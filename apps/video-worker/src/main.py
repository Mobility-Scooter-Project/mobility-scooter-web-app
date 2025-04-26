import os
import pika
from threading import Thread
from dotenv import load_dotenv
from pika.exchange_type import ExchangeType
from worker import worker, callback

load_dotenv()
QUEUE_URL = os.getenv('QUEUE_URL')
API_KEY = os.getenv('API_KEY')

NUM_WORKERS = 2  # adjust depending on GPU memory

# Set up RabbitMQ
print("Connecting to RabbitMQ...")

while True:
    connectSucceeded = False
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(QUEUE_URL))
        connectSucceeded = True
    except:
        pass
    if connectSucceeded:
        print("Connected to RabbitMQ.")
        break
      
channel = connection.channel()
channel.exchange_declare(exchange='storage', exchange_type=ExchangeType.direct)
channel.queue_declare(queue='videos', durable=True, passive=False)
channel.queue_declare(queue='events', durable=True, passive=False)
channel.queue_bind(exchange='storage', queue='videos', routing_key='videos.put')

for _ in range(NUM_WORKERS):
  Thread(target=worker, daemon=True).start()

print("Worker threads started.")
channel.basic_consume(queue='videos', on_message_callback=callback, auto_ack=True)
channel.start_consuming()