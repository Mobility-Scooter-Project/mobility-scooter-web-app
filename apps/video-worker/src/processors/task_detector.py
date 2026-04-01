import io
import time
import pandas as pd
from google import genai

from utils.logger import logger
from config.config import (
  GOOGLE_API_KEY,
  TASK_DETECTION_MODEL,
  TASK_DETECTION_MAX_RETRIES,
  TASK_DETECTION_RETRY_DELAY,
)
from config.constants import SYS_INS, PROMPT

class TaskDetector:
  def __init__(self):
    self.client = genai.Client(api_key=GOOGLE_API_KEY)

  def _load_transcript(self, transcript_csv: str) -> str:
    """Parse CSV text into a prompt for the LLM."""
    trans_df = pd.read_csv(io.StringIO(transcript_csv))
    transcript_text = trans_df.to_csv(index=False, lineterminator='\n')
    prompt = PROMPT.format(transcript_text=transcript_text)
    prompt = SYS_INS + "\n\n" + prompt
    return prompt

  def _parse_tasks_text(self, text: str):
    """
    Parse model text output into a list of tasks.

    Supports:
    - JSON array: [{"timestamp": 1.2, "task": "..."}, ...]
    - Line-based: "time, task" per line
    """
    if not text or not text.strip():
      return []

    # Fallback: "time, task" per line
    tasks = []
    for raw in text.splitlines():
      line = raw.strip()
      if not line or "," not in line:
        continue
      time_part, task_part = line.split(",", 1)

      try:
        t = float(time_part.strip())
      except ValueError:
        continue

      task = task_part.strip()
      if not task:
        continue
      
      tasks.append({"timestamp": t, "task": task})

    tasks.sort(key=lambda x: x["timestamp"])
    return tasks

  def detect_task(self, transcript_csv: str):
    """
    Detect tasks from transcript CSV text.

    Returns (tasks, attempt_count) where tasks is a list of
    { "timestamp": float, "task": str }. Retries on transient failures.
    """
    prompt = self._load_transcript(transcript_csv)

    for attempt in range(TASK_DETECTION_MAX_RETRIES):
      try:
        logger.info(
          f"Detecting task (attempt {attempt + 1}/{TASK_DETECTION_MAX_RETRIES})"
        )
        response = self.client.models.generate_content(
          model=TASK_DETECTION_MODEL,
          contents=f"{prompt}",
          config={"temperature": 0.0},
        )
        return self._parse_tasks_text(response.text), attempt + 1

      except Exception as e:
        logger.error(f"Task detection attempt {attempt + 1} failed: {e}")
        if attempt < TASK_DETECTION_MAX_RETRIES - 1:
          time.sleep(TASK_DETECTION_RETRY_DELAY)

    raise RuntimeError(
      f"Task detection failed after {TASK_DETECTION_MAX_RETRIES} attempts"
    )
  