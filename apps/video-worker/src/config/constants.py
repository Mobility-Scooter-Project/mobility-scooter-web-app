from os import environ
from dotenv import load_dotenv

load_dotenv()

BROKER_URL = environ.get("BROKER_URL")
DATABASE_URL = environ.get("DATABASE_URL")