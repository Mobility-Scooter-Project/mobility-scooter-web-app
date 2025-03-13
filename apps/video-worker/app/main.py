import pika 
import os

QUEUE_URL = os.getenv('QUEUE_URL')
connection = pika.BlockingConnection(pika.ConnectionParameters(QUEUE_URL))
channel = connection.channel()

channel.queue_declare(queue='video-processing')

def callback(ch, method, properties, body):
    print (f"Processing video {body}")
    
channel.basic_consume(queue='video-processing', on_message_callback=callback, auto_ack=True)

print("Video Worker started")
channel.start_consuming()