from config.constants import BROKER_URL
from lib.kafka import KafkaActor
import ray


if __name__ == "__main__":
    ray.init()
    actor = KafkaActor.remote(BROKER_URL, "videos")
    ray.get(actor.consumer.remote())