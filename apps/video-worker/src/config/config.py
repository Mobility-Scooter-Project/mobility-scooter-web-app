from os import environ
from dotenv import load_dotenv

load_dotenv()

BROKER_URL = environ.get("BROKER_URL")
DATABASE_URL = environ.get("DATABASE_URL")
GOOGLE_API_KEY = environ.get("GOOGLE_API_KEY")
HF_TOKEN = environ.get("HF_TOKEN")

# Shared secret used for x-video-worker-secret
VIDEO_WORKER_SECRET = environ.get("VIDEO_WORKER_SECRET")

API_BASE_URL = environ.get("API_BASE_URL")
VIDEO_WORKER_COMPLETED_PATH = "/api/v1/video-worker/completed"
VIDEO_WORKER_STEP_COMPLETED_PATH = "/api/v1/video-worker/step-completed"

VIDEO_WORKER_COMPLETED_URL = f"{API_BASE_URL}{VIDEO_WORKER_COMPLETED_PATH}"
VIDEO_WORKER_STEP_COMPLETED_URL = f"{API_BASE_URL}{VIDEO_WORKER_STEP_COMPLETED_PATH}"
KAFKA_CONSUMER_GROUP_ID = environ.get("KAFKA_CONSUMER_GROUP_ID", "ray-group")
KAFKA_CLIENT_ID = environ.get("KAFKA_CLIENT_ID", "video_worker")
KAFKA_MAX_POLL_INTERVAL_MS = int(environ.get("KAFKA_MAX_POLL_INTERVAL_MS", str(4 * 60 * 60 * 1000)))
KAFKA_MAX_POLL_RECORDS = int(environ.get("KAFKA_MAX_POLL_RECORDS", "1"))

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
POSE_BATCH_SIZE = 1 # 4 for GPU, 1 for CPU
POSE_FRAME_SKIP = 6 # process every 6 frames to reduce database writes => 5 frames per second
MAX_FRAMES = None # keep at 300 for short testing, None for production

# Task Detection Model
GOOGLE_LLMS = [
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemma-3-27b-it",
    "gemma-3-12b-it",
]

TASK_DETECTION_MODEL = "gemma-3-27b-it"  # Choose from the above list

# Pipeline retry configuration
ALL_STEPS = {"pose_estimation", "transcription", "task_detection", "stability_classification"}
MAX_STEP_RETRIES = 3
# Backoff cap for step retries (seconds)
STEP_RETRY_BACKOFF_CAP_SEC = 60

TASK_DETECTION_MAX_RETRIES = 2
TASK_DETECTION_RETRY_DELAY = 60  # seconds between task detection retries (seconds)

# Stability classifier inference configuration
STABILITY_MODEL = "stability_model.pt"
STABILITY_MODEL_URL = environ.get("STABILITY_MODEL_URL")
STABILITY_WINDOW_FRAMES = 30
STABILITY_FEATURES_PER_FRAME = 18  # x0,y0,...,x8,y8
STABILITY_WINDOW_SECONDS = 1.0
