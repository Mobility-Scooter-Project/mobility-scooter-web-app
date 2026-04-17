import os
import ray
from config.config import BROKER_URL, KAFKA_CONSUMER_GROUP_ID
from core.kafka import KafkaActor

# temp disable worker killing
os.environ["RAY_memory_monitor_refresh_ms"] = "0"

if __name__ == "__main__":
    ray.init()
    actor = KafkaActor.remote(BROKER_URL, "videos", KAFKA_CONSUMER_GROUP_ID)
    ray.get(actor.consume.remote())
