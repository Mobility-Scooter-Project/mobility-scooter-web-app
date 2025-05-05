from dotenv import load_dotenv

from celery import Celery
import os
from celery.utils.log import get_task_logger
from kombu import Exchange, Queue

logger = get_task_logger(__name__)

load_dotenv()

QUEUE_URL = os.environ.get('QUEUE_URL')
KV_URL = os.environ.get('KV_URL')