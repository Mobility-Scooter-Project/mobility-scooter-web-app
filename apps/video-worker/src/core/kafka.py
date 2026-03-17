import ray
import json
import time
from kafka import KafkaConsumer, KafkaProducer
from datetime import datetime

from utils.logger import logger
from pipeline.task_identification import TaskIdentification
from pipeline.pose_estimation import PoseEstimation
from core.db import DBActor
from config.config import ALL_STEPS, MAX_STEP_RETRIES

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
          auto_offset_reset="latest",
          client_id="video_worker",
          enable_auto_commit=False,
          max_poll_interval_ms=60 * 60 * 1000,  # 1 hour
          max_poll_records=1, # consume only one message at a time
          api_version=(2, 8, 0)
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
        self.producer = KafkaProducer(
          bootstrap_servers=brokers,
          value_serializer=lambda v: json.dumps(v).encode("utf-8"),
          key_serializer=lambda k: k.encode("utf-8") if k else None,
          api_version=(2, 8, 0)
        )
          
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

        refs = {}
        if "pose_estimation" in steps:
          refs["pose_estimation"] = self.pose_actor.process_video.remote(video_url, filename, video_id)

        if "transcription" in steps or "task_detection" in steps:
          skip_transcription = "transcription" not in steps
          refs["task_identification"] = self.audio_actor.process_video.remote(
            video_url, transcript_put_url, transcript_get_url, filename, video_id,
            skip_transcription=skip_transcription,
          )

        has_failure = False
        for name, ref in refs.items():
          try:
            ray.get(ref)
          except Exception as e:
            logger.error(f"{name} failed for {video_id}: {e}")
            has_failure = True

        end = datetime.now()

        if has_failure:
          logger.error(f"Processing had failures, took {end - start}")

          retryable, exhausted = ray.get(
            self.db.get_retryable_steps.remote(video_id, MAX_STEP_RETRIES)
          )

          if retryable:
            retry_msg = {
              "id": video_id,
              "url": video_url,
              "filename": filename,
              "transcriptPutUrl": transcript_put_url,
              "transcriptGetUrl": transcript_get_url,
              "steps": list(retryable),
            }
            time.sleep(1)
            self.producer.send(self.topic, key=video_id, value=retry_msg)
            self.producer.flush()
            logger.info(f"Queued retry for {video_id}, steps: {retryable}")

          if exhausted:
            logger.error(f"Steps exhausted all {MAX_STEP_RETRIES} retries for {video_id}: {exhausted}")

          if not retryable and exhausted:
            status = "partially_processed" if any(
              s not in exhausted for s in ALL_STEPS
            ) else "failed"
            ray.get(self.db.update_processing_status.remote(video_id, status))
            logger.error(f"Video {video_id} marked '{status}': no retryable steps remain")

        else:
          logger.info(f"Video processing complete after {end - start}")
          ray.get(self.db.update_processing_status.remote(video_id, "processed"))

        self.consumer.commit()
    except Exception as e:
      logger.error(f"Failed to consume messages: {e}")
      raise e
        