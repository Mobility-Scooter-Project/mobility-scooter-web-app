import os
import json
import pika
from threading import Thread
from dotenv import load_dotenv
from pika.exchange_type import ExchangeType
from fastapi import FastAPI

from scripts.audio_detection import audio_detection
from scripts.pose_estimation import pose_estimation

load_dotenv()
QUEUE_URL = os.getenv('QUEUE_URL')
app = FastAPI()

connection = pika.BlockingConnection(pika.ConnectionParameters(QUEUE_URL))
channel = connection.channel()

def start_video_work():
  """
  Starts the video worker.
  """
  print("Video Worker started")
  channel.basic_consume(queue='videos', on_message_callback=callback, auto_ack=True)
  channel.start_consuming()

def callback(ch, method, properties, body):
  """
  Starts video processing when a message is received from the message queue.

  Args:
    ch: The channel object used to communicate with RabbitMQ.
    method: Delivery method containing delivery tag and exchange information.
    properties: Message properties (e.g., headers, content type).
    body (bytes): The message containing video data in JSON format.
  """
  video = json.loads(body.decode())
  Thread(target=process_video, args=(video,)).start()

def process_video(video):
  """
  Calls functions to perform audio detection and pose estimation on the video.

  Args:
    video (dict): Dictionary containing video data.
  """  
  audio_detection(video['videoUrl'], video['filename'])
  pose_estimation(video['videoUrl'], video['annotatedVideoUrl'], video['filename'])

channel.exchange_declare(exchange='storage', exchange_type=ExchangeType.direct)
channel.queue_declare(queue='videos', durable=True, passive=False)
channel.queue_bind(exchange='storage', queue='videos', routing_key='videos.put')

start_video_work()  