from pika.exchange_type import ExchangeType
import pika
import os
from utils.logger import logger
import time
  
QUEUE_URL = os.getenv('QUEUE_URL')

class Client:
    def __init__(self):
        self.connection = None
        self.channel = None

    def connect(self):
        try:
            connected = False
            while not connected:
                try:
                    logger.info("Connecting to RabbitMQ...")
                    self.connection = pika.BlockingConnection(pika.ConnectionParameters(QUEUE_URL))
                    connected = True
                except pika.exceptions.AMQPConnectionError:
                    logger.debug("Connection failed, retrying in 1 second...")
                    time.sleep(1)
            self.channel = self.connection.channel()
            logger.debug("Connected to RabbitMQ")
            self.channel = self.connection.channel()
            self.channel.exchange_declare(exchange='storage', exchange_type=ExchangeType.direct, durable=True)
            self.channel.queue_declare(queue='videos', durable=True, passive=False)
            self.channel.queue_declare(queue='keypoints', durable=True, passive=False)
            self.channel.queue_bind(exchange='storage', queue='videos', routing_key='videos.put')
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise e
        
    def safe_publish(self, exchange, routing_key, body, properties):
        self.connection.add_callback_threadsafe(
            lambda: self.channel.basic_publish(
                exchange=exchange,
                routing_key=routing_key,
                body=body,
                properties=properties,
            )
        )
        
client = Client()
client.connect()