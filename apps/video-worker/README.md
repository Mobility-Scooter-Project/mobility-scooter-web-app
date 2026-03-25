# Video Worker

Python worker that consumes video-processing jobs from Kafka, runs selected pipeline steps, writes results/status to Postgres, and notifies the API when processing completes.

## What it does

- Consumes messages from Kafka topic `videos`.
- Runs one or more processing steps:
  - `pose_estimation`
  - `transcription`
  - `task_detection`
- Writes:
  - keypoints to `videos.keypoint`
  - tasks to `videos.video_task`
  - step/overall status to `video_worker.step_status` and `video_worker.status`
- Sends completion webhook to API:
  - `POST {API_BASE_URL}/api/v1/video-worker/completed`
  - Header: `X-Video-Worker-Secret`

## Message format

Expected Kafka payload:

```json
{
  "id": "video-uuid",
  "url": "presigned-video-url",
  "filename": "patients/.../video.mp4",
  "transcriptPutUrl": "presigned-put-url",
  "transcriptGetUrl": "presigned-get-url",
  "steps": ["pose_estimation", "transcription", "task_detection"]
}
```

Notes:
- If `steps` is omitted, worker defaults to all steps.
- If filename contains `"side"`, `pose_estimation` is skipped.

## Requirements

- Python `>=3.11,<3.12`
- Kafka broker reachable from worker
- Postgres reachable from worker
- API reachable (for completion webhook)
- Poetry (project uses `pyproject.toml` + `poetry.lock`)

## Setup

From `apps/video-worker`:

```bash
poetry install
```

Optional GPU deps group:

```bash
poetry install --with gpu
```

## Environment variables

Defined in `src/config/config.py` and `.env.example`:

- `BROKER_URL` - Kafka bootstrap server(s), e.g. `localhost:9092`
- `DATABASE_URL` - Postgres connection string
- `API_BASE_URL` - API base URL, e.g. `http://localhost:3000`
- `VIDEO_WORKER_SECRET` - shared secret for completion webhook header
- `GOOGLE_API_KEY` - LLM API key used by task detection
- `HF_TOKEN` - token for Hugging Face model access (if needed)

## Run

```bash
poetry run python src/main.py
```

The worker starts Ray, creates a Kafka actor, subscribes to topic `videos`, and begins consuming messages.

## Retry behavior

- Per-step retries are tracked in DB (`video_worker.step_status.attempts`).
- Global retry cap is controlled by `MAX_STEP_RETRIES` in `src/config/config.py`.
- If failed steps are retryable, worker republishes a reduced `steps` set to Kafka.
- If retries are exhausted, overall status is marked `partially_processed` or `failed`.

## Related API endpoints

- `GET /api/v1/video-worker/:videoId/status`
- `GET /api/v1/video-worker/:videoId/:step/status`
- `POST /api/v1/video-worker/completed`

