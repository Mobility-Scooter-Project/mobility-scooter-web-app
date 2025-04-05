import os
import json
from threading import Thread
from dotenv import load_dotenv
from pika.exchange_type import ExchangeType
import pika
from fastapi import FastAPI, Request

from scripts.audio_detection import audio_detection
from scripts.angle_calculation import pose_estimation

load_dotenv()

QUEUE_URL = os.getenv('QUEUE_URL')
app = FastAPI()

connection = pika.BlockingConnection(pika.ConnectionParameters(QUEUE_URL))
channel = connection.channel()

def start_video_work():
    print("Video Worker started")
    channel.basic_consume(queue='videos', on_message_callback=callback, auto_ack=True)
    channel.start_consuming()

def callback(ch, method, properties, body):
    video = json.loads(body.decode())
    audio_detection(video['videoUrl'])
    pose_estimation(video['videoUrl'])

channel.exchange_declare(exchange='storage', exchange_type=ExchangeType.direct)
channel.queue_declare(queue='videos', durable=True, passive=False)
channel.queue_bind(exchange='storage', queue='videos', routing_key='videos.put')

Thread(target=start_video_work, daemon=True).start()