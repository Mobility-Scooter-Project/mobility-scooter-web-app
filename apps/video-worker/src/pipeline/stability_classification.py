import json
import os
from datetime import datetime

import numpy as np
import ray
import requests
import torch

from config.config import (
  MAX_STEP_RETRIES,
  STABILITY_FEATURES_PER_FRAME,
  STABILITY_MODEL,  # model file path (.pt)
  STABILITY_MODEL_URL,
  STABILITY_WINDOW_FRAMES,
  STABILITY_WINDOW_SECONDS,
)
from core.api_webhook import notify_step_terminal
from core.db import DBActor
from core.gcn import GCNClassifier
from utils.logger import logger
from utils.retry import step_retry_sleep

STEP_NAME = "stability_classification"
JOINT_KEYS = [
  "nose",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftHip",
  "rightHip",
]
N_JOINTS = len(JOINT_KEYS)

@ray.remote
class StabilityClassification:
  def __init__(self):
    self.device = "cuda" if torch.cuda.is_available() else "cpu"
    self.db = DBActor.remote()
    # Model loading happens once when the Ray actor starts
    self._load_model(STABILITY_MODEL)

  def _download_model_if_missing(self, model_path):
    if os.path.isfile(model_path):
      return
    if not STABILITY_MODEL_URL:
      raise FileNotFoundError(
        f"Model file not found at '{model_path}' and STABILITY_MODEL_URL is not configured."
      )

    logger.info(f"[{STEP_NAME}] downloading stability model from {STABILITY_MODEL_URL}")
    tmp_path = f"{model_path}.download"
    os.makedirs(os.path.dirname(model_path) or ".", exist_ok=True)
    try:
      with requests.get(STABILITY_MODEL_URL, stream=True, timeout=60) as response:
        response.raise_for_status()
        with open(tmp_path, "wb") as model_file:
          for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
              model_file.write(chunk)
      os.replace(tmp_path, model_path)
      logger.info(f"[{STEP_NAME}] stability model downloaded to {model_path}")
    finally:
      if os.path.exists(tmp_path):
        os.remove(tmp_path)

  def _load_model(self, model_path):
    # Load trained weights + graph structure + training metadata from model .pt
    self._download_model_if_missing(model_path)
    raw = torch.load(model_path, map_location=self.device)
    if (
      not isinstance(raw, dict)
      or "state_dict" not in raw
      or "edge_index" not in raw
      or "config" not in raw
    ):
      raise ValueError("Invalid model format. Expected keys: state_dict, edge_index, config.")

    cfg = raw["config"]

    # Initialize the GCN model with the configuration
    model = GCNClassifier(
      h1_channels=int(cfg["h1_channels"]),
      out_channels=int(cfg["out_channels"]),
      num_classes=int(cfg["num_classes"]),
    ).to(self.device)
    model.load_state_dict(raw["state_dict"])
    model.eval()

    # Store the model and edge index for inference
    self.model = model
    self.edge_index = torch.as_tensor(raw["edge_index"], dtype=torch.long, device=self.device)
    self.model_config = cfg  # optional, for debugging only

    logger.info(f"Model loaded successfully from {model_path}")

  def _frame_features_from_keypoints(self, keypoints):
    if isinstance(keypoints, str):
      keypoints = json.loads(keypoints)
    # Build one frame feature vector: [x0, y0, x1, y1, ...]
    # Missing joints are treated as invalid input
    row = []
    for key in JOINT_KEYS:
      xy = keypoints.get(key)
      if not isinstance(xy, (list, tuple)) or len(xy) < 2:
        raise RuntimeError(f"Missing or invalid keypoint '{key}'")
      row.extend([float(xy[0]), float(xy[1])])
    if len(row) != STABILITY_FEATURES_PER_FRAME:
      raise RuntimeError(
        f"Expected {STABILITY_FEATURES_PER_FRAME} features per frame, got {len(row)}"
      )
    return row

  def _interpolate_window(self, timestamps, frame_vectors, window_start, window_end):
    """
    Resample one time-window of sparse pose features to a fixed length.

    Why this exists:
    - Pose estimation stores sparse samples (e.g., every 6th frame).
    - The stability model expects exactly STABILITY_WINDOW_FRAMES rows.
    - We linearly interpolate each feature over time so any window can be
      converted to the fixed shape expected by the model.

    Args:
      timestamps: List[float], timestamps (seconds) for each sampled row.
      frame_vectors: List[List[float]], each row has
        STABILITY_FEATURES_PER_FRAME values.

    Returns:
      List[List[float]] with shape:
      [STABILITY_WINDOW_FRAMES, STABILITY_FEATURES_PER_FRAME].
    """
    # Fast path: already exactly the target number of rows
    if len(frame_vectors) == STABILITY_WINDOW_FRAMES:
      return frame_vectors
    # Need at least two points to define a line for interpolation
    if len(frame_vectors) < 2:
      raise RuntimeError("Need at least 2 frames for interpolation")

    # Convert to numpy arrays for vectorized shape checks + interpolation
    ts = np.asarray(timestamps, dtype=np.float32)
    values = np.asarray(frame_vectors, dtype=np.float32)
    # Validate we have a 2D matrix [N, features_per_frame]
    if values.ndim != 2 or values.shape[1] != STABILITY_FEATURES_PER_FRAME:
      raise RuntimeError(
        f"Expected feature shape [N, {STABILITY_FEATURES_PER_FRAME}], got {values.shape}"
      )

    # np.interp requires increasing x-values. Keep first occurrence of each
    # timestamp and drop duplicates
    unique_ts, unique_idx = np.unique(ts, return_index=True)
    values = values[unique_idx]
    if unique_ts.size < 2:
      raise RuntimeError("Timestamps must contain at least 2 unique values for interpolation")

    # Build evenly spaced target timestamps across the requested wall-clock window
    # (exclude endpoint to keep non-overlapping [start, end) windows)
    target_ts = np.linspace(
      window_start,
      window_end,
      num=STABILITY_WINDOW_FRAMES,
      endpoint=False,
      dtype=np.float32,
    )
    # Allocate output matrix [target_rows, features_per_frame]
    interpolated = np.empty((STABILITY_WINDOW_FRAMES, STABILITY_FEATURES_PER_FRAME), dtype=np.float32)
    # Interpolate each feature independently along the time axis
    for feat_i in range(STABILITY_FEATURES_PER_FRAME):
      interpolated[:, feat_i] = np.interp(target_ts, unique_ts, values[:, feat_i])
    # Convert back to Python lists for downstream serialization/conversion
    return interpolated.tolist()

  def _predict_window(self, features_window):
    # Prepare one full window tensor for GCN forward pass
    arr = np.asarray(features_window, dtype=np.float32)
    expected = (STABILITY_WINDOW_FRAMES, STABILITY_FEATURES_PER_FRAME)
    if arr.shape != expected:
      raise RuntimeError(f"Expected window shape {expected}, got {arr.shape}")

    if STABILITY_FEATURES_PER_FRAME != N_JOINTS * 2:
      raise RuntimeError(
        f"Expected features per frame to be {N_JOINTS * 2} (x,y per joint), got {STABILITY_FEATURES_PER_FRAME}",
      )

    # Convert frame-major [T, (x0,y0,...,x8,y8)] -> node features [T*18, 2]
    # Each coordinate node (x-node and y-node) gets the same per-joint [x, y] feature vector
    # so we preserve 540 nodes (matching edge_index) while satisfying in_channels=2
    per_joint_xy = arr.reshape(STABILITY_WINDOW_FRAMES, N_JOINTS, 2)  # [T, 9, 2]
    node_features = np.repeat(per_joint_xy, 2, axis=1).reshape(-1, 2)  # [T*18, 2]
    x = torch.tensor(node_features, dtype=torch.float32, device=self.device)

    if self.edge_index.numel() > 0:
      max_idx = int(self.edge_index.max().item())
      if max_idx >= x.shape[0]:
        raise RuntimeError(
          f"edge_index references node {max_idx}, but x has only {x.shape[0]} nodes",
        )

    batch = torch.zeros(x.shape[0], dtype=torch.long, device=self.device)
    with torch.no_grad():
      # Inference happens here
      logits = self.model(x, self.edge_index, batch)  # [1, 2]
      probs = torch.softmax(logits, dim=-1)[0]
      predicted_class = int(torch.argmax(probs).item())
      confidence = float(torch.max(probs).item())
    return predicted_class, confidence

  def _run_inference(self, video_id):
    """
    Run stability inference over an entire video using fixed 1-second windows.

    Flow:
    1) Load sparse pose keypoints from DB (produced by pose_estimation).
    2) Split rows into contiguous 1-second buckets by timestamp.
    3) For each bucket with >= 2 samples:
       - build per-frame feature vectors,
       - interpolate to STABILITY_WINDOW_FRAMES rows,
       - run model inference,
       - store one prediction row for that window.
    4) Replace prior predictions for the video in a single DB operation.
    """
    # Fetch all pose rows sorted by frame index (frameIndex, timestamp, keypoints)
    rows = ray.get(self.db.get_video_keypoints.remote(video_id))
    # Interpolation needs at least two samples overall
    if len(rows) < 2:
      logger.warning(
        f"[{STEP_NAME}] not enough keypoints for {video_id}: {len(rows)} rows (< 2)"
      )
      ray.get(self.db.upsert_stability_inferences.remote(video_id, []))
      return
    predictions = []

    # Use timestamp order for efficient window scans
    rows_by_ts = sorted(rows, key=lambda r: float(r[1]))
    min_ts = float(rows_by_ts[0][1])
    max_ts = float(rows_by_ts[-1][1])

    # Build contiguous 1-second windows and upsample sparse pose samples to 30 frames
    window_start = min_ts
    n_rows = len(rows_by_ts)
    start_idx = 0
    end_idx = 0
    while window_start <= max_ts:
      window_end = window_start + STABILITY_WINDOW_SECONDS

      # Move start pointer to first row in [window_start, ...)
      while start_idx < n_rows and float(rows_by_ts[start_idx][1]) < window_start:
        start_idx += 1
      # Keep end pointer monotonic; expand to first row not in [..., window_end)
      if end_idx < start_idx:
        end_idx = start_idx
      while end_idx < n_rows and float(rows_by_ts[end_idx][1]) < window_end:
        end_idx += 1

      # Rows in the current [start, end) bucket
      window_rows = rows_by_ts[start_idx:end_idx]

      # Skip windows that cannot be interpolated
      if len(window_rows) < 2:
        window_start += STABILITY_WINDOW_SECONDS
        continue

      # Convert stored keypoints to model feature vectors
      timestamps = [ts for _, ts, _ in window_rows]
      frame_vectors = [self._frame_features_from_keypoints(kp) for _, _, kp in window_rows]

      # Resample sparse vectors to the model-required fixed frame count
      interpolated_vectors = self._interpolate_window(
        timestamps,
        frame_vectors,
        window_start,
        window_end,
      )

      # Predict one label/confidence for this entire 1-second window
      predicted_class, confidence = self._predict_window(interpolated_vectors)
      start_frame, start_ts, _ = window_rows[0]
      end_frame, end_ts, _ = window_rows[-1]
      predictions.append(
        {
          "startFrame": int(start_frame),
          "endFrame": int(end_frame),
          "startTime": float(start_ts),
          "endTime": float(end_ts),
          "predictedClass": predicted_class,
          "confidence": confidence,
        }
      )
      # Advance to next non-overlapping 1-second window
      window_start += STABILITY_WINDOW_SECONDS
    # Atomic replace: remove old rows and insert this run's results
    ray.get(self.db.upsert_stability_inferences.remote(video_id, predictions))

  def process_video(self, video_id):
    ray.get(self.db.update_step_status.remote(video_id, STEP_NAME, "processing", 1))
    start_time = datetime.now()
    for attempt in range(1, MAX_STEP_RETRIES + 1):
      try:
        self._run_inference(video_id)
        duration_sec = round((datetime.now() - start_time).total_seconds(), 3)
        ray.get(
          self.db.update_step_status.remote(
            video_id, STEP_NAME, "completed", attempt, duration_sec, None
          )
        )
        notify_step_terminal(video_id, STEP_NAME, "completed", attempt, duration_sec, None)
        return "completed"
      except Exception as e:
        logger.error(f"[{STEP_NAME}] failed for {video_id} (attempt {attempt}/{MAX_STEP_RETRIES}): {e}")
        if attempt >= MAX_STEP_RETRIES:
          duration_sec = round((datetime.now() - start_time).total_seconds(), 3)
          ray.get(
            self.db.update_step_status.remote(
              video_id, STEP_NAME, "failed", attempt, duration_sec, str(e)
            )
          )
          notify_step_terminal(video_id, STEP_NAME, "failed", attempt, duration_sec, str(e))
          return "failed"
        step_retry_sleep(attempt - 1)
