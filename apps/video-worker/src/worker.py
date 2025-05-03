from ultralytics import YOLO
import whisper

from lib.audio_detection import audio_detection
from lib.pose_estimation import pose_estimation
from utils.logger import logger

import queue
import json
import torch
import time

video_queue = queue.Queue()

def process_video(body, pe_model, asr_model):
  """
  Calls functions to perform audio detection and pose estimation on the video.

  Args:
    body (bytes): Video data from the queue.
    pe_model (YOLO): The loaded YOLO pose estimation model.
    asr_model (Whisper): The loaded Whisper ASR model.
  """  
  message = json.loads(body.decode())
  logger.info(f"Processing video with ID: {message['data']['id']}")
  
  id = message["data"]["id"]
  filename = message["data"]["filename"]
  get_url = message["data"]["url"]
  transcript_put_url = message["data"]["transcriptPutUrl"]

  #audio_detection(model=asr_model, video_url=get_url, filename=filename, video_id=id, transcript_url=transcript_put_url)
  pose_estimation(model=pe_model, video_url=get_url, filename=filename, video_id=id)

def worker():
  '''
  Worker function to process videos from the queue.
  '''
  if torch.cuda.is_available():
    asr_model = whisper.load_model("small").to("cuda")
    pe_model = YOLO("yolo11n-pose.pt", verbose=False).to("cuda")
    logger.debug("GPU available, using CUDA for processing.")
  else:
    asr_model = whisper.load_model("small").to("cpu")
    pe_model = YOLO("yolo11n-pose.pt", verbose=False).to("cpu")
    logger.debug("No GPU available, using CPU for processing.")
  logger.debug("Worker started.")
  
  while True:
    body = video_queue.get()
    if body is None:
        break  # Stop signal
    try:
      process_video(body, pe_model, asr_model)
    except Exception as e:
      logger.error(f"Error processing video: {e}")
  

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
