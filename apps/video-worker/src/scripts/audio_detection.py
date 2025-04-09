import whisper
from datetime import timedelta
import webvtt
from constants.tasks import TASK_LIST
from rapidfuzz import fuzz
import tempfile
import os

def format_time(td):
  seconds = int(td.total_seconds())
  hours = seconds // 3600
  minutes = (seconds % 3600) // 60
  seconds = seconds % 60
  milliseconds = td.microseconds // 1000

  # Format as HH:MM:SS.mmm
  return f"{hours:02}:{minutes:02}:{seconds:02}.{milliseconds:03}"

def format_vtt(segments, mode):
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

def get_transcript(videoUrl):
  model = whisper.load_model("small")

  try:
    result = model.transcribe(videoUrl, word_timestamps=True, fp16=False)  
    vtt_content = format_vtt(result["segments"], "segms")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".vtt") as tmp:
      tmp.write(vtt_content.encode("utf-8"))  
      
    print("Transcript generated successfully!\n")
    return tmp
  except Exception as e:
    print(f"Failed to generate trancript: {e}\n")

def get_task_time(task, i, captions, tasks_time):
  for j, caption in enumerate(captions, start=i):
    if "start" in captions[j].text.lower():
      start_time = captions[j].start

    if "stop" in captions[j].text.lower() and start_time:
      end_time = captions[j].end
      tasks_time[task] = [start_time, end_time]
      return j
    
def get_tasks(transcript, filename):
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
    
def audio_detection(videoUrl, filename):
  print(f"\nGenerating transcript for {filename}...")
  transcript = get_transcript(videoUrl)  

  print(f"Detecting tasks from transcript...")
  get_tasks(transcript.name, filename)
  
  os.remove(transcript.name)


