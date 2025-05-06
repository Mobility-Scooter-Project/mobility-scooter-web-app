import os
import tempfile
import webvtt
import requests
import time
import re
import ray
from dotenv import load_dotenv
from datetime import timedelta
from rapidfuzz import fuzz
from config.tasks import TASK_LIST, KEY_WORDS, FILLER_PHRASES
from utils.logger import logger
from faster_whisper import WhisperModel, BatchedInferencePipeline
from ray.experimental.tqdm_ray import tqdm
import torch
from datetime import datetime
from lib.format_time import format_time

@ray.remote
class AudioDetection:
  def __init__(self):
    load_dotenv()
    self.API_KEY = os.getenv('TESTING_API_KEY')
    self.USER_TOKEN = os.getenv('USER_TOKEN')
    self.logger = logger
    self.TASK_LIST = TASK_LIST
    self.KEY_WORDS = KEY_WORDS
    self.FILLER_PHRASES = FILLER_PHRASES
    self.model = None

  @staticmethod
  def format_vtt(segments, mode):
    """
    Converts the transcript into WebVTT format with time-synchronized text tracks.
    """
    vtt_output = "WEBVTT\n\n"
    if mode == "words":
      for segment in segments:
        for word in segment["words"]:
          start = format_time(timedelta(seconds=word["start"]))
          end = format_time(timedelta(seconds=word["end"]))
          vtt_output += f"{start} --> {end}\n{word['word']}\n\n"
    elif mode == "segms":
      for segment in tqdm(segments):
        start = format_time(timedelta(seconds=segment.start))
        end = format_time(timedelta(seconds=segment.end))
        text = segment.text.strip()
        vtt_output += f"{start} --> {end}\n{text}\n\n"
    return vtt_output

  def generate_transcript(self, video_url, filename):
    """
    Generates a transcript of the video.
    """
    try:
      with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        start = datetime.now()
        temp_video.write(requests.get(video_url).content)
        temp_video.flush()
        self.logger.debug(f"Transcribing {filename}...")
        
        if not self.model:
          model_size = os.getenv('WHISPER_MODEL_SIZE')
          device = "cpu"
          compute_type = "int8"
          
          if torch.cuda.is_available():
            device = "cuda"
            compute_type = "float16"
      
          model = WhisperModel(model_size, device=device, compute_type=compute_type)
          self.model = BatchedInferencePipeline(model=model)
        
        segments, info = self.model.transcribe(temp_video.name, word_timestamps=True)
        end = datetime.now()
        self.logger.debug(f"Transcription completed for {filename} after {end-start}")
        vtt_content = self.format_vtt(segments, "segms")

        logger.debug("Saving temp transcript...")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".vtt") as tmp:
          tmp.write(vtt_content.encode("utf-8"))

      return tmp
    except Exception as e:
      self.logger.error(f"Error generating transcript for {filename}: {e}")

  def filter_task_description(self, text):
    """
    Filters the task description to remove filler phrases and punctuation.
    """
    text = text.lower()
    for phrase in self.FILLER_PHRASES:
      text = re.sub(rf"\b{re.escape(phrase)}\b", "", text)
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

  def fuzzy_task_match(self, text):
    """
    Match a caption to the most likely task.
    """
    best_task = None
    best_score = 0
    for task in self.TASK_LIST:
      score = fuzz.partial_ratio(text.lower(), task.lower())
      if score > best_score:
        best_score = score
        best_task = task
    return best_task if best_score > 70 else None

  def get_tasks_times(self, transcript_path, filename, video_id):
    """
    Gets and stores the task, and start and end times from the transcript.
    """
    captions = webvtt.read(transcript_path)
    tasks_time = []
    current_task = None
    current_start = None

    for caption in captions:
      text = caption.text.lower()
      keyword_trigger = any(kw.lower() in text for kw in self.KEY_WORDS)
      matched_task = self.fuzzy_task_match(caption.text)

      if keyword_trigger or matched_task:
        if current_task and current_start:
          tasks_time.append({
            "task": current_task,
            "start": current_start,
            "end": caption.start
          })
        current_task = matched_task or text
        current_start = caption.start

    if current_task and current_start:
      tasks_time.append({
        "task": current_task,
        "start": current_start,
        "end": captions[-1].end
      })

    if len(tasks_time) == 0:
      self.logger.debug(f"No tasks detected in {filename}.")
      return

    for taskId, t in enumerate(tasks_time):
      filtered_task = self.filter_task_description(t['task'])
      requests.post(
        "http://localhost:3000/api/v1/storage/videos/store-task",
        json={
          "videoId": video_id,
          "taskId": taskId + 1,
          "task": {
            "task": filtered_task,
            "start": t['start'],
            "end": t['end'],
          }
        },
        headers={
          "Authorization": "Bearer " + self.API_KEY,
          "Content-Type": "application/json",
        },
      )

  def audio_detection(self, video_url, transcript_url, filename, video_id):
    """
    Calls functions to generate a transcript and determine if the video has any tasks.
    """
    start = datetime.now()
    self.logger.info(f"Generating transcript for {filename}...")
    transcript = self.generate_transcript(video_url, filename)

    logger.debug(f"Uploading transcript of f{filename}...")
    with open(transcript.name, "rb") as f:
      requests.put(transcript_url, data=f, verify=False)

    logger.debug(f"Detecting tasks from {filename}'s transcript...")
    self.get_tasks_times(transcript.name, filename, video_id)
    os.remove(transcript.name)
    end = datetime.now()
    logger.info(f"Audio detection complete after {end - start}")
