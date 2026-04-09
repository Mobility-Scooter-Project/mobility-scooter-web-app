import json
import requests
import ray
import torch
from datetime import datetime

from utils.logger import logger
from utils.retry import step_retry_sleep
from core.db import DBActor
from core.api_webhook import notify_step_completed
from config.config import MAX_STEP_RETRIES, TASK_DETECTION_MAX_RETRIES
from processors.task_detector import TaskDetector
from processors.video_transcriber import VideoTranscriber

num_gpus = 0.5 if torch.cuda.is_available() else 0
logger.debug(f"Audio detection using {num_gpus} GPUs")

@ray.remote(num_gpus=num_gpus)
class TaskIdentification:
  def __init__(self):
    self.db = DBActor.remote()
    self.task_detector = TaskDetector()
    self.video_transcriber = VideoTranscriber()

  def _download_transcript(self, transcript_get_url):
    """Download an existing transcript CSV from storage and return as text."""
    resp = requests.get(transcript_get_url)
    resp.raise_for_status()
    if not resp.text.strip():
      raise RuntimeError("Downloaded transcript is empty")
    return resp.text

  def process_video(self, video_url, transcript_put_url, transcript_get_url,
    filename, video_id, skip_transcription):
    logger.info(f"Starting task identification for {filename}")

    # Video Transcription
    try:
      if skip_transcription:
        logger.info("Skipping transcription, downloading existing transcript")
        transcript_csv = self._download_transcript(transcript_get_url)
      else:            
        transcript_csv = None
        ray.get(self.db.update_step_status.remote(video_id, "transcription", "processing"))
        transcription_start = datetime.now()
        for attempt in range(1, MAX_STEP_RETRIES + 1):
          try:
            logger.info(f"Transcription attempt {attempt} for {filename}")
            transcript_df = self.video_transcriber.transcribe_video(video_url, filename)
            if transcript_df is None:
              raise RuntimeError(f"Transcription returned nothing for {filename}")

            transcript_csv = transcript_df.to_csv(index=False)
            duration_sec = round((datetime.now() - transcription_start).total_seconds(), 3)
            logger.info(f"[transcription] Completed {filename} in {duration_sec:.2f} seconds")
            ray.get(self.db.update_step_status.remote(video_id, "transcription", "completed", None, duration_sec))
            break
          except Exception as e:
            logger.error(f"Transcription failed for {filename}: {e}")
            if attempt >= MAX_STEP_RETRIES:
              ray.get(self.db.update_step_status.remote(video_id, "transcription", "failed", str(e)))
              return "failed"
            step_retry_sleep(attempt - 1)

      requests.put(
        transcript_put_url,
        data=transcript_csv.encode("utf-8"),
        headers={"Content-Type": "text/csv"},
      )
    except Exception as e:
      logger.error(f"Task identification failed for {filename}: {e}")
      ray.get(self.db.update_step_status.remote(video_id, "task_identification", "failed", str(e)))
      return "failed"

    # Task Detection
    ray.get(self.db.update_step_status.remote(video_id, "task_detection", "processing"))
    task_detection_start = datetime.now()
    attempts = None

    try:
      tasks_json, attempts = self.task_detector.detect_task(transcript_csv)
      task_detection_duration_sec = round((datetime.now() - task_detection_start).total_seconds(), 3)
      logger.info(f"[task_detection] Completed {filename} in {task_detection_duration_sec:.2f} seconds")
      ray.get(self.db.update_step_status.remote(video_id, "task_detection", "completed", None, task_detection_duration_sec, attempts))

      for i, task in enumerate(tasks_json):
        task["taskNumber"] = i + 1
        task.setdefault("note", None)
        task.setdefault("score", None)      

      ray.get(self.db.upsert_tasks.remote(video_id, json.dumps(tasks_json)))
      # when tasks are available to display, notify the api backend
      notify_step_completed(video_id, "task_detection", task_detection_duration_sec)
      return "completed"

    except Exception as e:
      logger.error(f"Task detection failed for {filename}: {e}")
      task_detection_duration_sec = round((datetime.now() - task_detection_start).total_seconds(), 3)
      attempt_count = attempts if attempts is not None else TASK_DETECTION_MAX_RETRIES
      ray.get(self.db.update_step_status.remote(video_id, "task_detection", "failed", str(e), task_detection_duration_sec, attempt_count))
      return "failed"
