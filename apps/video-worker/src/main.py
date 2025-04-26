import os
import json
import pika
import queue
import requests
from threading import Thread
from dotenv import load_dotenv
from pika.exchange_type import ExchangeType
from fastapi import FastAPI

from ultralytics import YOLO
import whisper

from scripts.audio_detection import audio_detection
from scripts.pose_estimation import pose_estimation

load_dotenv()
QUEUE_URL = os.getenv('QUEUE_URL')
API_KEY = os.getenv('TESTING_API_KEY')
USER_TOKEN = os.getenv('USER_TOKEN')
app = FastAPI()

video_queue = queue.Queue()
NUM_WORKERS = 2  # adjust depending on GPU memory

def worker():
  '''
  Worker function to process videos from the queue.
  '''
  pe_model = YOLO("yolo11n-pose.pt", verbose=False)
  asr_model = whisper.load_model("small").to("cuda")

  while True:
    body = video_queue.get()
    if body is None:
        break  # Stop signal
    try:
      process_video(body, pe_model, asr_model)
    except Exception as e:
      print(f"Error processing video: {e}")
    finally:
      video_queue.task_done()


def callback(ch, method, properties, body):
  """
  Callback function to handle messages from RabbitMQ.

  Args:
    ch: The channel object used to communicate with RabbitMQ.
    method: Delivery method containing delivery tag and exchange information.
    properties: Message properties (e.g., headers, content type).
    body (bytes): The message containing video data in JSON format.
  """
  video_queue.put(body)


def process_video(body, pe_model, asr_model):
  """
  Calls functions to perform audio detection and pose estimation on the video.

  Args:
    body (bytes): Video data from the queue.
    pe_model (YOLO): The loaded YOLO pose estimation model.
    asr_model (Whisper): The loaded Whisper ASR model.
  """  
  message = json.loads(body.decode())
  
  id = message["data"]["id"]
  filename = message["data"]["filename"]
  get_url = message["data"]["url"]
  transcript_put_url = message["data"]["transcriptPutUrl"]

  audio_detection(model=asr_model, video_url=get_url, filename=filename, video_id=id, transcript_put_url=transcript_put_url)
  pose_estimation(model=pe_model, video_url=get_url, filename=filename, video_id=id)
 

# Set up RabbitMQ
connection = pika.BlockingConnection(pika.ConnectionParameters(QUEUE_URL))
channel = connection.channel()
channel.exchange_declare(exchange='storage', exchange_type=ExchangeType.direct)
channel.queue_declare(queue='videos', durable=True, passive=False)
channel.queue_bind(exchange='storage', queue='videos', routing_key='videos.put')

for _ in range(NUM_WORKERS):
  Thread(target=worker, daemon=True).start()

print("Video Worker started")
channel.basic_consume(queue='videos', on_message_callback=callback, auto_ack=True)
channel.start_consuming()