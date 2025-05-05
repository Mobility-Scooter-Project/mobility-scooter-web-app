import ray
from kafka import KafkaConsumer
import json
from lib.audio_detection import audio_detection
from lib.pose_estimation import pose_estimation
from ultralytics import YOLO
import whisper
import torch

@ray.remote(num_gpus = 0.5)
class KafkaActor:
    def __init__(self, brokers, topic, group_id="ray-group"):
        self.consumer = KafkaConsumer(
            bootstrap_servers=brokers,
            group_id=group_id,
            auto_offset_reset="earliest",
            client_id="video_worker",
            reconnect_backoff_max_ms=10000 # 10 seconds
        )
        
        self.consumer.subscribe([topic])
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.pe = YOLO("yolo11n.pt").to(device)
        self.whisper = whisper.load_model("small.en").to(device)
        
    def consumer(self):
        for msg in self.consumer:
            data = json.loads(msg.value)
            
            id = data["id"]
            video_url = data["url"]
            transcript_url = data["transcriptPutUrl"]
            filename = data["filename"]
            
            try:
                pose_ref = pose_estimation.remote(self.pe, video_url, filename, id)
                audio_ref = audio_detection.remote(self.whisper, video_url, transcript_url, filename, id)
                result = ray.get([pose_ref, audio_ref])
            except:
                print(f"An error occurred while processing video")
            
            