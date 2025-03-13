from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
import logging

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.get("/healthcheck", response_class=PlainTextResponse)
async def healthcheck():
    return "OK"

@app.get("/v1/api/video-webhook", response_class=PlainTextResponse)
async def video_webhook():
    logger.info("Endpoint 'read_root' accessed")
    return "Video webhook"