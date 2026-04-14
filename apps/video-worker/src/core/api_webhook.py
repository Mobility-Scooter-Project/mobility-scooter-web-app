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


def notify_step_terminal(
  video_id: str,
  step: str,
  status: str,
  attempts: int,
  duration_sec=None,
  last_error=None,
):
  """
  POST after a step is committed to DB in a terminal state (`completed` or `failed`).

  `attempts` is always sent (required by API DTO). Omit duration_sec / last_error when None.
  """
  payload = {
    "videoId": video_id,
    "step": step,
    "status": status,
    "attempts": attempts,
  }
  if duration_sec is not None:
    payload["durationSec"] = duration_sec
  if last_error is not None:
    payload["lastError"] = last_error

  _post_webhook(
    VIDEO_WORKER_STEP_COMPLETED_URL,
    payload,
    ok_log=f"Step terminal webhook sent for {video_id} ({step}={status})",
    err_ctx=f"for {video_id} {step}={status}",
  )


def notify_overall_terminal(video_id, status, duration_sec):
  """POST after DB commit when overall video processing reaches a terminal state."""
  payload = {
    "videoId": video_id,
    "overallStatus": status,
    "durationSec": duration_sec,
  }

  _post_webhook(
    VIDEO_WORKER_COMPLETED_URL,
    payload,
    ok_log=f"Overall terminal webhook sent for {video_id} (overallStatus={status})",
    err_ctx=f"for {video_id} overallStatus={status}",
  )
