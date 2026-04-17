from pypino import PyPino
import os
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

logger = PyPino(name="video-worker")

if not hasattr(logger, "warning") and hasattr(logger, "warn"):
    logger.warning = logger.warn

if ENVIRONMENT != 'production':
    logger.level("debug")
