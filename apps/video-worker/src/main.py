import pika 
import os
from dotenv import load_dotenv
from pika.exchange_type import ExchangeType
load_dotenv()

QUEUE_URL = os.getenv('QUEUE_URL')
connection = pika.BlockingConnection(pika.ConnectionParameters(QUEUE_URL))
channel = connection.channel()

channel.exchange_declare(exchange='storage', exchange_type=ExchangeType.direct)
channel.queue_declare(queue='videos', durable=True)
channel.queue_bind(exchange='storage', queue='videos', routing_key='videos.put')

def callback(ch, method, properties, body):
    print (f"Processing video {body}")

channel.basic_consume(queue='videos', on_message_callback=callback, auto_ack=True)

print("Video Worker started")
channel.start_consuming()