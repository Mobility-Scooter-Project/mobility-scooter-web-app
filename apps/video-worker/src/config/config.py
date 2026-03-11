from os import environ
from dotenv import load_dotenv

load_dotenv()

BROKER_URL = environ.get("BROKER_URL")
DATABASE_URL = environ.get("DATABASE_URL")
GOOGLE_API_KEY = environ.get("GOOGLE_API_KEY")
HF_TOKEN = environ.get("HF_TOKEN")

WHISPERX_SIZES = [
    "tiny",
    "base",
    "small",
    "medium",
    "large-v2",
]

WHISPERX_SIZE = "base" # large-v2 for GPU, base for CPU

# Transcription batch size and compute type
BATCH_SIZE = 1 # 16 for GPU, 1 for CPU
COMPUTE_TYPE = "float32" # float16 for GPU, float32 for CPU

# WhisperX VAD (voice activity detection) options
VAD_ONSET = 0.700
VAD_OFFSET = 0.500

# Pose estimation (YOLO)
POSE_MODEL = "yolo11n-pose.pt"

# Task Detection Model
GOOGLE_LLMS = [
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemma-3-27b-it",
    "gemma-3-12b-it",
]

TASK_DETECTION_MODEL = "gemma-3-27b-it"  # Choose from the above list

# Pipeline retry configuration
ALL_STEPS = {"pose_estimation", "transcription", "task_detection"}
MAX_STEP_RETRIES = 3
TASK_DETECTION_MAX_RETRIES = 2
TASK_DETECTION_RETRY_DELAY = 60  # seconds between task detection retries