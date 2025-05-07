from pypino import PyPino
import os
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

logger = PyPino(name="video-worker")

if ENVIRONMENT != 'production':
    logger.level("debug")
