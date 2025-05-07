import ray
from kafka import KafkaConsumer
import json
import time
from utils.logger import logger
from lib.audio_detection import AudioDetection
from lib.pose_estimation import PoseEstimator
from lib.db import DBActor
from datetime import datetime

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
                    enable_auto_commit=False
                )
                
            except:
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
        
        self.pose_actor = PoseEstimator.remote()
        self.audio_actor = AudioDetection.remote()
        self.db = DBActor.remote()
        
    def consumer(self):
        for msg in self.consumer:
            data = json.loads(msg.value)
            
            id = data["id"]
            video_url = data["url"]
            transcript_url = data["transcriptPutUrl"]
            filename = data["filename"]
            
            try:
                start = datetime.now()
                ray.get(self.db.update_processing_status.remote(id, "processing"))
                pose_ref = self.pose_actor.process_video.remote(video_url, filename, id)
                audio_ref = self.audio_actor.audio_detection.remote(video_url, transcript_url, filename, id)
                ray.get([audio_ref, pose_ref])
                end = datetime.now()
                logger.info(f"Video processing complete after {end - start}")
            except Exception as e:
                logger.error(f"An error occurred while processing video: {e}")
            else:
                ray.get(self.db.update_processing_status.remote(id, "processed"))
                self.consumer.commit()
                logger.debug("Updated video processing status")
            
            