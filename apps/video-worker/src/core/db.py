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
          
  def upsert_tasks(self, video_id, tasks):
    self._lazyInit()
    query = """
      INSERT INTO videos.video_task ("videoId", tasks)
      VALUES (%s, %s)
      ON CONFLICT ("videoId")
      DO UPDATE SET
        tasks = EXCLUDED.tasks,
        "cuUpdatedat" = NOW();
    """
    try:
      self.cursor.execute(query, (video_id, tasks))
    except Exception as e:
      self.connection.rollback()
      logger.error(f"Failed to upsert tasks for video {video_id}: {e}")
    else:
      self.connection.commit()
  
  def get_retryable_steps(self, video_id, max_retries):
    """Return failed steps that haven't exhausted their per-step retry limit.
    If transcription is retryable, task_detection is also included (dependency).
    """
    self._lazyInit()
    query = """
      SELECT step, attempts FROM video_worker.step_status
      WHERE "videoId" = %s AND status = 'failed';
    """
    try:
      self.cursor.execute(query, (video_id,))
      rows = self.cursor.fetchall()

      retryable = []
      exhausted = []
      for step, attempts in rows:
        if attempts < max_retries:
          retryable.append(step)
        else:
          exhausted.append(step)

      if "transcription" in retryable and "task_detection" not in retryable:
        retryable.append("task_detection")

      return retryable, exhausted

    except Exception as e:
      logger.error(f"Failed to get retryable steps: {e}")
      return [], []

  def update_step_status(self, video_id, step, status, error=None, duration_sec=None):
    """Upsert per-step status and append an audit event."""
    self._lazyInit()
    query = """
      WITH new_event AS (
        INSERT INTO video_worker.event ("videoId", step, status)
        VALUES (%s, %s, %s)
        RETURNING id
      )
      INSERT INTO video_worker.step_status ("videoId", step, status, attempts, "lastError", "durationSec")
      VALUES (%s, %s, %s, 1, %s, %s)
      ON CONFLICT ("videoId", step)
      DO UPDATE SET
        status = EXCLUDED.status,
        attempts = video_worker.step_status.attempts + CASE WHEN EXCLUDED.status = 'processing' THEN 1 ELSE 0 END,
        "lastError" = EXCLUDED."lastError",
        "durationSec" = EXCLUDED."durationSec",
        "cuUpdatedat" = NOW();
    """
    try:
      self.cursor.execute(
        query,
        (video_id, step, status, video_id, step, status, error, duration_sec),
      )
    except Exception as e:
      self.connection.rollback()
      logger.error(f"Failed to update step status ({step}={status}): {e}")
    else:
      self.connection.commit()

  def reset_step_attempts(self, video_id):
    """Reset per-step attempts and status for a given video upload."""
    self._lazyInit()
    query = """
      UPDATE video_worker.step_status
      SET attempts = 0
      WHERE "videoId" = %s;
    """
    try:
      self.cursor.execute(query, (video_id,))
    except Exception as e:
      self.connection.rollback()
      logger.error(f"Failed to reset step attempts for video {video_id}: {e}")
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
