import psycopg
import ray
from utils.logger import logger
from config.config import DATABASE_URL

@ray.remote
class DBActor():
  def __init__(self):
    self.connection = None
    self.cursor = None
      
  def _lazyInit(self):
    if not self.connection or not self.cursor:
      try:
        self.connection = psycopg.connect(DATABASE_URL)
        self.cursor = self.connection.cursor()
      except Exception as e:
        logger.error(f"Failed to connect to db: {e}")
      
  def upsert_keypoints(self, video_id, frame_index, timestamp, angle, keypoints):
    self._lazyInit()
    query = """
      INSERT INTO videos.keypoint ("videoId", "frameIndex", timestamp, angle, keypoints)
      VALUES (%s, %s, %s, %s, %s)
      ON CONFLICT ("videoId", "frameIndex")
      DO UPDATE SET
        timestamp = EXCLUDED.timestamp,
        angle = EXCLUDED.angle,
        keypoints = EXCLUDED.keypoints,
        "cuUpdatedat" = NOW();
    """
    try:
      self.cursor.execute(query, (video_id, frame_index, timestamp, angle, keypoints))
    except Exception as e:
      self.connection.rollback()
      logger.error(f"Failed to upload keypoints to database: {e}")
    else:
      self.connection.commit()

  def clear_video_keypoints(self, video_id):
    """
    Delete all pose keypoint rows for a video before a fresh pose run.
    """
    self._lazyInit()
    query = """
      DELETE FROM videos.keypoint
      WHERE "videoId" = %s;
    """
    try:
      self.cursor.execute(query, (video_id,))
    except Exception as e:
      self.connection.rollback()
      logger.error(f"Failed to clear keypoints for video {video_id}: {e}")
      raise
    else:
      self.connection.commit()
          
  def upsert_worker_tasks(self, video_id, tasks):
    """
    Upsert all worker (AI) tasks for a video
    """
    self._lazyInit()
    delete_sql = 'DELETE FROM videos.video_task WHERE "videoId" = %s AND "createdByUserId" IS NULL'
    insert_sql = """
      INSERT INTO videos.video_task ("videoId", "timestamp", "task", "note", "score", "createdByUserId", "updatedByUserId")
      VALUES (%s, %s, %s, %s, %s, NULL, NULL)
    """
    rows = []
    for t in tasks:
      if not isinstance(t, dict):
        continue
      task_text = str(t.get("task") or "").strip()
      if not task_text:
        continue
      try:
        ts = float(t.get("timestamp") or 0)
      except (TypeError, ValueError):
        continue
      rows.append((video_id, ts, task_text, t.get("note"), t.get("score")))

    try:
      self.cursor.execute(delete_sql, (video_id,))
      if rows:
        self.cursor.executemany(insert_sql, rows)
    except Exception as e:
      self.connection.rollback()
      logger.error(f"Failed to upsert worker tasks for video {video_id}: {e}")
    else:
      self.connection.commit()
  
  def update_step_status(
    self,
    video_id,
    step,
    status,
    attempts,
    duration_sec=None,
    error=None,
  ):
    """
    Upsert per-step row for processing, completed, or failed.
    """
    self._lazyInit()
    query = """
      WITH new_event AS (
        INSERT INTO video_worker.event ("videoId", step, status)
        VALUES (%s, %s, %s)
        RETURNING id
      )
      INSERT INTO video_worker.step_status ("videoId", step, status, attempts, "lastError", "durationSec")
      VALUES (%s, %s, %s, %s, %s, %s)
      ON CONFLICT ("videoId", step)
      DO UPDATE SET
        status = EXCLUDED.status,
        attempts = EXCLUDED.attempts,
        "lastError" = EXCLUDED."lastError",
        "durationSec" = EXCLUDED."durationSec",
        "cuUpdatedat" = NOW();
    """
    try:
      self.cursor.execute(
        query,
        (
          video_id,
          step,
          status,
          video_id,
          step,
          status,
          attempts,
          error,
          duration_sec,
        ),
      )
    except Exception as e:
      self.connection.rollback()
      logger.error(f"Failed to update step status ({step}={status}): {e}")
    else:
      self.connection.commit()

  def update_processing_status(self, video_id, status, duration_sec=None):
    """Update the overall processing status of a video."""
    self._lazyInit()
    query = """
      WITH new_event AS (
        INSERT INTO video_worker.event ("videoId", step, status)
        VALUES (%s, 'overall', %s)
        RETURNING id
      )
      INSERT INTO video_worker.status ("videoId", "statusEventId", "durationSec")
      VALUES (%s, (SELECT id FROM new_event), %s)
      ON CONFLICT ("videoId")
      DO UPDATE SET
        "statusEventId" = EXCLUDED."statusEventId",
        "durationSec" = EXCLUDED."durationSec";
    """
    try:
      self.cursor.execute(query, (video_id, status, video_id, duration_sec))
    except Exception as e:
      self.connection.rollback()
      logger.error(f"Failed to update video processing status: {e}")
    else:
      self.connection.commit()      

  def get_video_keypoints(self, video_id):
    """
    Return keypoints rows for a video ordered by frame index.
    """
    self._lazyInit()
    query = """
      SELECT "frameIndex", timestamp, keypoints
      FROM videos.keypoint
      WHERE "videoId" = %s
      ORDER BY "frameIndex" ASC;
    """
    try:
      self.cursor.execute(query, (video_id,))
      return self.cursor.fetchall()
    except Exception as e:
      self.connection.rollback()
      logger.error(f"Failed to fetch keypoints for video {video_id}: {e}")
      return []

  def upsert_stability_inferences(self, video_id, predictions):
    """
    Replace all stability predictions for a video with new rows.
    """
    self._lazyInit()
    delete_sql = """
      DELETE FROM videos.stability
      WHERE "videoId" = %s;
    """
    insert_sql = """
      INSERT INTO videos.stability
      (
        "videoId",
        "startFrame",
        "endFrame",
        "startTime",
        "endTime",
        "predictedClass",
        "confidence"
      )
      VALUES (%s, %s, %s, %s, %s, %s, %s);
    """
    rows = []
    for p in predictions:
      rows.append(
        (
          video_id,
          int(p["startFrame"]),
          int(p["endFrame"]),
          float(p["startTime"]),
          float(p["endTime"]),
          int(p["predictedClass"]),
          float(p["confidence"]),
        ),
      )
    try:
      self.cursor.execute(delete_sql, (video_id,))
      if rows:
        self.cursor.executemany(insert_sql, rows)
    except Exception as e:
      self.connection.rollback()
      logger.error(f"Failed to replace stability predictions for video {video_id}: {e}")
    else:
      self.connection.commit()
