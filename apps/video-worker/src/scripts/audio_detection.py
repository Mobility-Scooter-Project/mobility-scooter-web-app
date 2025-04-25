import os
import tempfile
import webvtt
import requests
import time
import re
from dotenv import load_dotenv
from datetime import timedelta
from rapidfuzz import fuzz
from constants.tasks import TASK_LIST, KEY_WORDS, FILLER_PHRASES

load_dotenv()
API_KEY = os.getenv('TESTING_API_KEY')
USER_TOKEN = os.getenv('USER_TOKEN')

def format_time(td):
  """
  Formats a timedelta object as a string in HH:MM:SS.mmm format.

  Args:
    td (timedelta): The time.
  
  Returns: 
    str: Formatted time.
  """
  seconds = int(td.total_seconds())
  hours = seconds // 3600
  minutes = (seconds % 3600) // 60
  seconds = seconds % 60
  milliseconds = td.microseconds // 1000

  return f"{hours:02}:{minutes:02}:{seconds:02}.{milliseconds:03}"

def format_vtt(segments, mode):
  """
  Converts the transcript into WebVTT format with time-synchronized text tracks.

  Args:
    segments (list): Results of transcribing the video in segments.
    mode (str): Option to have captions in segments or per word.

  Returns:
    str: The content of the transcript.
  """
  vtt_output = "WEBVTT\n\n"
  if mode == "words":
    for segment in segments:
      for word in segment["words"]:
        start = format_time(timedelta(seconds=word["start"]))
        end = format_time(timedelta(seconds=word["end"]))       

        vtt_output += f"{start} --> {end}\n{word['word']}\n\n"

  elif mode == "segms":
    for i, segment in enumerate(segments):
      start = format_time(timedelta(seconds=segment["start"]))
      end = format_time(timedelta(seconds=segment["end"]))
      text = segment["text"].strip()

      vtt_output += f"{start} --> {end}\n{text}\n\n"

  return vtt_output

def get_transcript(video_url, model):
  """
  Generates a transcript of the video.
  
  Args:
    video_url (str): Url of the video file.
    model (Whisper): The loaded Whisper model.
  
  Returns:
    file: Temporary trancript file.
  
  """
  try:
    time_start = time.time()
    result = model.transcribe(video_url, word_timestamps=True, fp16=False)  
    vtt_content = format_vtt(result["segments"], "segms")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".vtt") as tmp:
      tmp.write(vtt_content.encode("utf-8"))  
      
    print(f"Transcript generated successfully after {time.time() - time_start:.2f}s!\n")
    return tmp
  except Exception as e:
    print(f"Failed to generate trancript: {e}\n")

def clean_task_description(text):
    text = text.lower()
    # Remove filler phrases
    for phrase in FILLER_PHRASES:
        text = re.sub(rf"\b{re.escape(phrase)}\b", "", text)

    # Remove extra whitespace and punctuation
    text = re.sub(r"[^\w\s]", "", text)  # Remove punctuation
    text = re.sub(r"\s+", " ", text)     # Normalize spaces
    return text.strip()

def fuzzy_task_match(text):
  """Match a caption to the most likely task."""
  best_task = None
  best_score = 0
  for task in TASK_LIST:
    score = fuzz.partial_ratio(text.lower(), task.lower())
    if score > best_score:
      best_score = score
      best_task = task

  return best_task if best_score > 70 else None

def get_tasks_times(transcript_path, filename, video_id):
  captions = webvtt.read(transcript_path)
  tasks_time = []
  current_task = None
  current_start = None

  for i, caption in enumerate(captions):
    text = caption.text.lower()

    # Check if there's either a keyword or a matched task in the current caption
    keyword_trigger = any(kw.lower() in text for kw in KEY_WORDS)
    matched_task = fuzzy_task_match(caption.text)

    if keyword_trigger or matched_task:
      if current_task and current_start:
        # End previous task
        tasks_time.append({
            "task": current_task,
            "start": current_start,
            "end": caption.start
        })

      # Start new task
      current_task = matched_task or text
      current_start = caption.start

  # Handle last task if still open
  if current_task and current_start:
    tasks_time.append({
      "task": current_task,
      "start": current_start,
      "end": captions[-1].end
    })

  cleaned_tasks = []
  for t in tasks_time:
    cleaned = clean_task_description(t['task'])
    cleaned_tasks.append({
        "task": cleaned,
        "start": t['start'],
        "end": t['end']
    })

  if len(cleaned_tasks) == 0:
    print(f"No tasks detected from {filename}\n")
  else:
    print(cleaned_tasks)

  requests.post(
    "http://localhost:3000/api/v1/storage/videos/store-task", 
    json={
      "videoId": video_id,
      "tasks": cleaned_tasks,
    },
    headers={
      "Authorization": "Bearer " + API_KEY,
      "Content-Type": "application/json",
      "X-User": USER_TOKEN,
    },
  )

def audio_detection(model, video_url, transcript_url, filename):
  """
  Calls functions to generate a transcript and determine if the video has any tasks.

  Args:
    video_url (str): Url of the video file.
    filename (str): Name of the video file.
  """
  print(f"\nGenerating transcript for {filename}...")
  transcript = get_transcript(video_url, model) 

  response = requests.post(
    "http://localhost:3000/api/v1/storage/videos/find-video-id", 
    json={
      "videoPath": filename,
    },
    headers={
      "Authorization": "Bearer " + API_KEY,
      "Content-Type": "application/json",
      "X-User": USER_TOKEN,
    },
  ) 

  video_id = response.json()["data"]["videoId"]

  with open(transcript.name, "rb") as f:
    requests.put(transcript_url, data=f)  

  requests.post(
    "http://localhost:3000/api/v1/storage/videos/store-transcript", 
    json={
      "videoId": video_id,
      "transcriptPath": transcript_url,
    },
    headers={
      "Authorization": "Bearer " + API_KEY,
      "Content-Type": "application/json",
      "X-User": USER_TOKEN,
    },
  )
  
  print(f"Detecting tasks from transcript...")
  get_tasks_times(transcript.name, filename, video_id)
  