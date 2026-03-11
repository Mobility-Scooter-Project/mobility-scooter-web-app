import os
import ray
from config.config import BROKER_URL
from core.kafka import KafkaActor

# temp disable worker killing
os.environ["RAY_memory_monitor_refresh_ms"] = "0"

if __name__ == "__main__":
    ray.init()
    actor = KafkaActor.remote(BROKER_URL, "videos")
    ray.get(actor.consume.remote())