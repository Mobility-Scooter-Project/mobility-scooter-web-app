import requests

from utils.logger import logger
from config.config import (
  VIDEO_WORKER_SECRET,
  VIDEO_WORKER_COMPLETED_URL,
  VIDEO_WORKER_STEP_COMPLETED_URL
)

def _post_webhook(url, payload, ok_log, err_ctx):
  """Best-effort POST; URL unset skips (local dev without API)."""
  if not url:
    return

  headers = {
    "Content-Type": "application/json",
    "X-Video-Worker-Secret": VIDEO_WORKER_SECRET or "",
  }

  try:
    response = requests.post(url, json=payload, headers=headers, timeout=10)
    if response.status_code >= 300:
      logger.error(f"Webhook non-2xx {err_ctx}: HTTP {response.status_code}")
    else:
      logger.info(ok_log)
  except requests.RequestException as e:
    logger.error(f"Webhook failed {err_ctx}: {e}")


def notify_step_completed(video_id: str, step: str, duration_sec=None):
  """POST after a step completes successfully (pose_estimation / task_detection only)."""
  payload = {"videoId": video_id, "step": step}
  if duration_sec is not None:
    payload["durationSec"] = duration_sec

  _post_webhook(
    VIDEO_WORKER_STEP_COMPLETED_URL,
    payload,
    ok_log=f"Step webhook sent for {video_id} ({step})",
    err_ctx=f"for {video_id} {step}",
  )


def notify_video_completed(video_id, duration_sec, overall_status="processed"):
  """POST after DB commit when overall video processing reaches a terminal state."""
  payload = {
    "videoId": video_id,
    "durationSec": duration_sec,
    "overallStatus": overall_status,
  }

  _post_webhook(
    VIDEO_WORKER_COMPLETED_URL,
    payload,
    ok_log=f"Completion webhook sent for {video_id}",
    err_ctx=f"for {video_id}",
  )
