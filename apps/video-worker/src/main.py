from config.constants import BROKER_URL
from lib.kafka import KafkaActor
import os
import ray

# temp disable worker killing
os.environ["RAY_memory_monitor_refresh_ms"] = "0"

if __name__ == "__main__":
    ray.init()
    actor = KafkaActor.remote(BROKER_URL, "videos")
    ray.get(actor.consumer.remote())