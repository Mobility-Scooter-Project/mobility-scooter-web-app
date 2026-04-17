import ray
import json
import time
from kafka import KafkaConsumer
from kafka.errors import CommitFailedError
from datetime import datetime

from utils.logger import logger
from pipeline.task_identification import TaskIdentification
from pipeline.pose_estimation import PoseEstimation
from pipeline.stability_classification import StabilityClassification
from core.db import DBActor
from core.api_webhook import notify_overall_terminal
from config.config import (
  ALL_STEPS,
  KAFKA_CLIENT_ID,
  KAFKA_MAX_POLL_INTERVAL_MS,
  KAFKA_MAX_POLL_RECORDS,
)


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
          client_id=KAFKA_CLIENT_ID,
          enable_auto_commit=False,
          max_poll_interval_ms=KAFKA_MAX_POLL_INTERVAL_MS,
          max_poll_records=KAFKA_MAX_POLL_RECORDS,
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
    self.stability_actor = StabilityClassification.remote()
    self.db = DBActor.remote()

  def _commit_processed_message(self, video_id):
    try:
      self.consumer.commit()
    except CommitFailedError as e:
      logger.warning(
        "Kafka offset commit failed after processing "
        f"{video_id}; results were already persisted and terminal webhooks were sent. "
        "This usually means another worker instance joined the consumer group "
        f"or the local dev process restarted: {e}"
      )

  def _wait_step(self, video_id, name, ref, completed_steps, failed_steps):
    """
    Wait for a Ray step result and update completed/failed sets consistently.
    """
    try:
      result = ray.get(ref)
    except Exception as e:
      logger.error(f"{name} failed for {video_id}: {e}")
      failed_steps.add(name)
      return None
    if result == "completed":
      completed_steps.add(name)
    elif result == "failed":
      failed_steps.add(name)
    return result

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
          # Stability depends on pose keypoints; skip it when pose is intentionally skipped.
          steps.discard("stability_classification")

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

        pose_ref = refs.pop("pose_estimation", None)
        pose_completed = False
        if pose_ref is not None:
          pose_completed = self._wait_step(
            video_id, "pose_estimation", pose_ref, completed_steps, failed_steps
          ) == "completed"

        if "stability_classification" in steps:
          # Stability depends on pose keypoints, so run immediately after pose completes.
          if not pose_completed:
            logger.warning(
              f"Skipping stability_classification for {video_id}: pose_estimation was not run or not completed"
            )
            failed_steps.add("stability_classification")
          else:
            self._wait_step(
              video_id,
              "stability_classification",
              self.stability_actor.process_video.remote(video_id),
              completed_steps,
              failed_steps,
            )

        # Wait for remaining independent steps after pose/stability handling.
        for name, ref in refs.items():
          self._wait_step(video_id, name, ref, completed_steps, failed_steps)

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
          notify_overall_terminal(video_id, status, overall_duration_sec)
        else:
          logger.info(f"Video {video_id} processing complete after {overall_duration_sec} seconds, status: {status}")
          ray.get(self.db.update_processing_status.remote(video_id, status, overall_duration_sec))
          notify_overall_terminal(video_id, status, overall_duration_sec)

        self._commit_processed_message(video_id)
    except Exception as e:
      logger.error(f"Failed to consume messages: {e}")
      raise e
