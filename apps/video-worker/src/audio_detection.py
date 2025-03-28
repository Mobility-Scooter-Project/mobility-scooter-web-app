import whisper
from datetime import timedelta
import webvtt
from tasks import TASK_LIST
from fuzzywuzzy import fuzz

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

def get_transcript(audio_path, transcript_destination):
  model = whisper.load_model("small")
  result = model.transcribe(audio_path, word_timestamps=True)
  vtt_content = format_vtt(result["segments"], "segms")

  with open(transcript_destination, "w") as f:
      f.write(vtt_content)    
      
  print(result["text"])
  return transcript_destination

def get_tasks(transcript):
  captions = webvtt.read(transcript)
  for i, caption in enumerate(captions):
    for task in TASK_LIST:
      score = fuzz.partial_ratio(captions[i].text.lower(), task.lower())
      if score > 75:
        get_task_time(task, i, captions)
  
  return

def get_task_time(task, i, captions):
    for j, caption in enumerate(captions):
      if "start" in captions[i+j].text.lower():
        start_time = captions[i+j].start

      if "stop" in captions[i+j].text.lower():
        end_time = captions[i+j].end

    tasks_time[task] = [start_time, end_time]

tasks_time = {}
transcript = get_transcript("./test.mp4", "./sample_transcript.vtt")
get_tasks(transcript)

for task in tasks_time:
  start_time, end_time = tasks_time[task]
  print(f'Task: "{task}" starts at {start_time} and ends at {end_time}')

