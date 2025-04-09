import whisper
from datetime import timedelta
import webvtt
from constants.tasks import TASK_LIST
from rapidfuzz import fuzz
import tempfile
import os

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
    result = model.transcribe(video_url, word_timestamps=True, fp16=False)  
    vtt_content = format_vtt(result["segments"], "segms")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".vtt") as tmp:
      tmp.write(vtt_content.encode("utf-8"))  
      
    print("Transcript generated successfully!\n")
    return tmp
  except Exception as e:
    print(f"Failed to generate trancript: {e}\n")

def get_task_time(task, i, captions, tasks_time):
  """
  Determines the start and end time of each detected task

  Args:
    task (str): Name of the task.
    i (int): Index used to iterate through the captions. 
    captions (WEBVTT): Object representing the transcript content.
    tasks_time (dict): Dictionary of the detected tasks and their start and end time.

  Returns:
    The index used to iterate through the captions.  
  """
  for j, caption in enumerate(captions, start=i):
    if "start" in captions[j].text.lower():
      start_time = captions[j].start

    if "stop" in captions[j].text.lower() and start_time:
      end_time = captions[j].end
      tasks_time[task] = [start_time, end_time]
      return j
    
def get_tasks(transcript, filename):
  """
  Detects if the video has any tasks.

  Args:
    transcript (VTT): Transcript generated from the video. 
    filename (str): Name of the video file.
  """
  tasks_time = {}
  captions = webvtt.read(transcript)
  i = 0

  while i < len(captions):
    for task in TASK_LIST:
      score = fuzz.partial_ratio(captions[i].text.lower(), task.lower())
      if score > 75:
        i = get_task_time(task, i, captions, tasks_time)
    else:
       i += 1

  if len(tasks_time) == 0:
    print(f"No tasks detected from {filename}\n")

  for task in tasks_time:
    start_time, end_time = tasks_time[task]
    print(f'Task: "{task}" starts at {start_time} and ends at {end_time}\n')
    
def audio_detection(video_url, filename):
  """
  Calls functions to generate a transcript and determine if the video has any tasks.

  Args:
    video_url (str): Url of the video file.
    filename (str): Name of the video file.
  """
  print(f"\nGenerating transcript for {filename}...")
  model = whisper.load_model("small")
  transcript = get_transcript(video_url, model)  

  print(f"Detecting tasks from transcript...")
  get_tasks(transcript.name, filename)
  
  os.remove(transcript.name)


