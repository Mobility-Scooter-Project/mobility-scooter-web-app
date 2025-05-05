from dotenv import load_dotenv
import os
from lib.kafka import KafkaActor
import ray

load_dotenv()

QUEUE_URL = os.environ.get('QUEUE_URL')

if __name__ == "__main__":
    ray.init()
    actor = KafkaActor.remote(QUEUE_URL, "videos")
    ray.get(actor.consumer.remote())