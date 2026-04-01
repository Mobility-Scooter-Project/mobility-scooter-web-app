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
- Sends webhooks to API (same header `X-Video-Worker-Secret`):
  - **Keypoints ready** (`pose_estimation` → `completed`): `POST {API_BASE_URL}/api/v1/video-worker/step-completed`
  - **Tasks available** (`task_detection` → `completed`): `POST {API_BASE_URL}/api/v1/video-worker/step-completed`
  - **Overall job finished** (terminal overall status after DB commit): `POST {API_BASE_URL}/api/v1/video-worker/completed`

  Body includes `videoId`, `durationSec`, and `overallStatus`: `processed` (all steps succeeded), `failed` (all relevant steps failed after retries), or `partially_processed` (some steps succeeded, some exhausted retries). Same as success path, **failed** runs are notified so the client can stop polling and show errors.

  `step-completed` is best-effort and currently emitted only when:
  - `pose_estimation` reaches `completed` (not `failed`)
  - `task_detection` reaches `completed` (not intermediate `failed` attempts)
  This lets the UI switch to displaying keypoints/tasks without reacting to retry failures.

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

- Per-step retries run **in-process** inside `PoseEstimation` / `TaskIdentification` (exponential backoff via `utils/retry.py`); the worker does **not** republish to Kafka for step retries.
- **Pose** and the **transcription/task_detection** pipeline are started in **parallel** (both `.remote()` before `ray.get`), so GPU/CPU work can overlap again.
- Terminal outcomes are written once to `video_worker.step_status` via `update_step_status` (`completed` or `failed` with `attempts` set to the attempt number that produced the outcome).
- `MAX_STEP_RETRIES` in `src/config/config.py` caps each step.
- When any step fails, overall status is `partially_processed` if some other requested step succeeded, otherwise `failed`.

## Related API endpoints

- `GET /api/v1/video-worker/:videoId/status`
- `GET /api/v1/video-worker/:videoId/:step/status`
- `POST /api/v1/video-worker/completed`
- `POST /api/v1/video-worker/step-completed`

