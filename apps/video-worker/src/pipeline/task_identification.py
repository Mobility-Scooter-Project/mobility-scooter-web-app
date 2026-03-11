import json
import requests
import ray
import torch

from utils.logger import logger
from core.db import DBActor
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
    filename, video_id, skip_transcription=False):
    logger.info(f"Starting task identification for {filename}")

    # Video Transcription
    try:
      if skip_transcription:
        logger.info("Skipping transcription, downloading existing transcript")
        transcript_csv = self._download_transcript(transcript_get_url)
      else:
        ray.get(self.db.update_step_status.remote(video_id, "transcription", "processing"))
        transcript_df = self.video_transcriber.transcribe_video(video_url, filename)

        if transcript_df is None:
          raise RuntimeError(f"Transcription returned nothing for {filename}")

        transcript_csv = transcript_df.to_csv(index=False)

        requests.put(
          transcript_put_url,
          data=transcript_csv.encode("utf-8"),
          headers={"Content-Type": "text/csv"},
        )
        ray.get(self.db.update_step_status.remote(video_id, "transcription", "completed"))
    except Exception as e:
      logger.error(f"Transcription failed for {filename}: {e}")
      if not skip_transcription:
        ray.get(self.db.update_step_status.remote(video_id, "transcription", "failed", str(e)))
      raise

    # Task Detection
    ray.get(self.db.update_step_status.remote(video_id, "task_detection", "processing"))
    try:
      tasks_json = self.task_detector.detect_task(transcript_csv)
      for i, task in enumerate(tasks_json):
        task["taskNumber"] = i + 1
    except Exception as e:
      logger.error(f"Task detection failed for {filename}: {e}")
      ray.get(self.db.update_step_status.remote(video_id, "task_detection", "failed", str(e)))
      raise

    ray.get(self.db.upsert_tasks.remote(video_id, json.dumps(tasks_json)))
    ray.get(self.db.update_step_status.remote(video_id, "task_detection", "completed"))
