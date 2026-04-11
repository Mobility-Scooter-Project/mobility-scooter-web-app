import requests
import ray
import torch
from datetime import datetime

from utils.logger import logger
from utils.retry import step_retry_sleep
from core.db import DBActor
from core.api_webhook import notify_step_terminal
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
    transcription_start = None

    # Video Transcription
    try:
      if skip_transcription:
        logger.info("Skipping transcription, downloading existing transcript")
        transcript_csv = self._download_transcript(transcript_get_url)
      else:
        transcript_csv = None
        transcription_start = datetime.now()
        for attempt in range(1, MAX_STEP_RETRIES + 1):
          try:
            ray.get(self.db.update_step_status.remote(video_id, "transcription", "processing", attempt))
            logger.info(f"Transcription attempt {attempt} for {filename}")
            transcript_df = self.video_transcriber.transcribe_video(video_url, filename)
            if transcript_df is None:
              raise RuntimeError(f"Transcription returned nothing for {filename}")

            transcript_csv = transcript_df.to_csv(index=False)

            requests.put(
              transcript_put_url,
              data=transcript_csv.encode("utf-8"),
              headers={"Content-Type": "text/csv"},
            )

            transcription_duration_sec = round((datetime.now() - transcription_start).total_seconds(), 3)
            logger.info(f"[transcription] Attempt {attempt} completed {filename} in {transcription_duration_sec:.2f} seconds")
            ray.get(
              self.db.update_step_status.remote(
                video_id,
                "transcription",
                "completed",
                attempt,
                transcription_duration_sec,
                None,
              ),
            )
            break
          except Exception as e:
            logger.error(f"[transcription] Attempt {attempt} failed for {filename}: {e}")
            if attempt >= MAX_STEP_RETRIES:
              transcription_duration_sec = round((datetime.now() - transcription_start).total_seconds(), 3)
              ray.get(
                self.db.update_step_status.remote(
                  video_id,
                  "transcription",
                  "failed",
                  attempt,
                  transcription_duration_sec,
                  str(e),
                ),
              )
              task_det_err = f"transcription failed: {e}"
              ray.get(
                self.db.update_step_status.remote(
                  video_id,
                  "task_detection",
                  "failed",
                  attempt,
                  transcription_duration_sec,
                  task_det_err,
                ),
              )
              notify_step_terminal(
                video_id,
                "task_detection",
                "failed",
                attempt,
                transcription_duration_sec,
                task_det_err,
              )
              return "failed"
            step_retry_sleep(attempt - 1)
    except Exception as e:
      # Only the skip-transcription path reaches here (download / load errors). 
      err = str(e)
      logger.error(f"Transcript error for {filename}: {err}")
      ray.get(
        self.db.update_step_status.remote(
          video_id,
          "task_detection",
          "failed",
          1,
          None,
          err,
        ),
      )
      notify_step_terminal(
        video_id,
        "task_detection",
        "failed",
        1,
        None,
        err,
      )
      return "failed"

    # Task Detection
    ray.get(self.db.update_step_status.remote(video_id, "task_detection", "processing", 1))
    detection_attempts = None

    try:
      task_detection_start = datetime.now()
      tasks_json, detection_attempts = self.task_detector.detect_task(transcript_csv)
      task_detection_duration_sec = round((datetime.now() - task_detection_start).total_seconds(), 3)

      logger.info(f"[task_detection] completed for {filename} after {task_detection_duration_sec:.2f} seconds")

      for task in tasks_json:
        task.setdefault("note", None)
        task.setdefault("score", None)

      # Persist tasks before terminal step + webhook so clients never see completed with empty tasks.
      ray.get(self.db.upsert_worker_tasks.remote(video_id, tasks_json))
      ray.get(
        self.db.update_step_status.remote(
          video_id,
          "task_detection",
          "completed",
          detection_attempts,
          task_detection_duration_sec,
          None,
        ),
      )
      notify_step_terminal(
        video_id,
        "task_detection",
        "completed",
        detection_attempts,
        task_detection_duration_sec,
        None,
      )
      return "completed"

    except Exception as e:
      logger.error(f"[task_detection] failed for {filename}: {e}")
      task_detection_duration_sec = round((datetime.now() - task_detection_start).total_seconds(), 3)
      ray.get(
        self.db.update_step_status.remote(
          video_id,
          "task_detection",
          "failed",
          TASK_DETECTION_MAX_RETRIES,
          task_detection_duration_sec,
          str(e),
        ),
      )
      notify_step_terminal(
        video_id,
        "task_detection",
        "failed",
        TASK_DETECTION_MAX_RETRIES,
        task_detection_duration_sec,
        str(e),
      )
      return "failed"
