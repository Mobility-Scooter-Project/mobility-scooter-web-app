import time

from config.config import STEP_RETRY_BACKOFF_CAP_SEC

def step_retry_sleep(attempt_index):
  time.sleep(min(2**attempt_index, STEP_RETRY_BACKOFF_CAP_SEC))
