import ray
import json
import time
from kafka import KafkaConsumer
from datetime import datetime

from utils.logger import logger
from pipeline.task_identification import TaskIdentification
from pipeline.pose_estimation import PoseEstimation
from core.db import DBActor
from core.api_webhook import notify_video_completed
from config.config import ALL_STEPS


@ray.remote
class KafkaActor:
  def __init__(self, brokers, topic, group_id="ray-group"):
    retry_count = 0
    connected = False
    while retry_count < 5 and not connected:
      try:
        self.consumer = KafkaConsumer(
          bootstrap_servers=brokers,
          group_id=group_id,
          auto_offset_reset="earliest",
          client_id="video_worker",
          enable_auto_commit=False,
          max_poll_interval_ms=60 * 60 * 1000,  # 1 hour (CPU)
          max_poll_records=1,  # consume only one message at a time (CPU)
        )

      except Exception as e:
        logger.error(f"Failed to connect to broker: {e}")
        delay = 3 + retry_count
        logger.debug(f"Failed to connect to broker, retrying in {delay} seconds")
        retry_count += 1
        time.sleep(delay)
      else:
        connected = True
        self.consumer.subscribe([topic])
        logger.info(f"Successfully connected to broker after {retry_count + 1} attempt(s)")

    if not connected:
      error = f"Failed to connect to broker after {retry_count} attempt(s)"
      raise Exception(error)

    self.topic = topic

    self.pose_actor = PoseEstimation.remote()
    self.audio_actor = TaskIdentification.remote()
    self.db = DBActor.remote()

  def consume(self):
    try:
      for msg in self.consumer:
        data = json.loads(msg.value)

        video_id = data["id"]
        video_url = data["url"]
        transcript_put_url = data["transcriptPutUrl"]
        transcript_get_url = data["transcriptGetUrl"]
        filename = data["filename"]
        # if not provided, set all steps
        steps = set(data.get("steps", [])) or ALL_STEPS
        # skip pose for side-view videos (filename contains "side")
        if "side" in filename.lower():
          steps.discard("pose_estimation")

        start = datetime.now()
        ray.get(self.db.update_processing_status.remote(video_id, "processing"))

        completed_steps = set()
        failed_steps = set()

        refs = {}
        if "pose_estimation" in steps:
          refs["pose_estimation"] = self.pose_actor.process_video.remote(video_url, filename, video_id)

        if "transcription" in steps or "task_detection" in steps:
          skip_transcription = "transcription" not in steps
          refs["task_identification"] = self.audio_actor.process_video.remote(
            video_url, transcript_put_url, transcript_get_url, filename, video_id, skip_transcription
          )

        for name, ref in refs.items():
          try:
            result = ray.get(ref) 
            if result == "completed":
              completed_steps.add(name)
            elif result == "failed":
              failed_steps.add(name)
          except Exception as e:
            logger.error(f"{name} failed for {video_id}: {e}")
            failed_steps.add(name)

        has_failure = bool(failed_steps)

        end = datetime.now()
        overall_duration_sec = round((end - start).total_seconds(), 3)

        status = "processed"
        if has_failure:
          if completed_steps and failed_steps:
            status = "partially_processed"
          else:
            status = "failed"
        
          logger.error(f"Video {video_id} processing had failures, took {overall_duration_sec} seconds, status: {status}")
          ray.get(self.db.update_processing_status.remote(video_id, status, overall_duration_sec))
          notify_video_completed(video_id, overall_duration_sec, status)
        else:
          logger.info(f"Video {video_id} processing complete after {overall_duration_sec} seconds, status: {status}")
          ray.get(self.db.update_processing_status.remote(video_id, status, overall_duration_sec))
          notify_video_completed(video_id, overall_duration_sec, status)

        self.consumer.commit()
    except Exception as e:
      logger.error(f"Failed to consume messages: {e}")
      raise e
