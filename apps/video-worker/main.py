from dotenv import load_dotenv

from celery import Celery
import os
from utils.logger import logger

load_dotenv()

QUEUE_URL = os.environ.get('QUEUE_URL')
KV_URL = os.environ.get('KV_URL')

app = Celery('main', broker=QUEUE_URL, backend=KV_URL)

@app.task
def test():
    """
    Test function to check if the worker is running.
    """
    logger.info("Worker is running")
    return "Worker is running"

if __name__ == "__main__":
  app.start()


