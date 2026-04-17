import json
import cupy as cp
import numpy as np
import torch
import ray
import tempfile
import os
import urllib.request
from datetime import datetime
from decord import VideoReader, cpu, gpu
from ultralytics import YOLO
from ray.experimental.tqdm_ray import tqdm
 
from utils.logger import logger
from utils.retry import step_retry_sleep
from core.db import DBActor
from core.api_webhook import notify_step_terminal
from config.config import (
  POSE_MODEL,
  POSE_BATCH_SIZE,
  POSE_FRAME_SKIP,
  MAX_FRAMES,
  MAX_STEP_RETRIES,
)
 
num_gpus = 0.5 if torch.cuda.is_available() else 0
logger.debug(f"Pose estimation using {num_gpus} GPUs")
 
@ray.remote(num_gpus=num_gpus)
class PoseEstimation:
  def __init__(self):
    """
    Initializes the PoseEstimator with a given YOLO pose estimation model.
    """
    self.device = "cuda" if torch.cuda.is_available() else "cpu"
    # 0: nose, 5/6: shoulders, 7/8: elbows, 9/10: wrists, 11/12: hips
    self.upper_body_keypoints = [0, 5, 6, 7, 8, 9, 10, 11, 12]
    self.db = DBActor.remote()
    self.model = YOLO(POSE_MODEL).to(self.device)
 
  def calculate_angle(self, p1, p2):
    """
    Calculates the angle between two points.
 
    Args:
      p1 (tuple): Coordinates of the first point.
      p2 (tuple): Coordinates of the second point.
 
    Returns:
      The calculated angle rounded to two decimals.
    """
    if p1 is None or p2 is None:
      raise ValueError("Angle points must be non-null")

    if self.device == "cuda":
      vector = cp.array([p2[0] - p1[0], p2[1] - p1[1]], dtype=cp.float32)
      vertical = cp.array([0, 1], dtype=cp.float32)

      magnitude = cp.linalg.norm(vector) * cp.linalg.norm(vertical)
      mag = float(cp.asnumpy(magnitude))
      # Guard against coincident points (zero-length vector).
      if not np.isfinite(mag) or mag == 0.0:
        raise ValueError("Angle points must not coincide")

      dot_product = cp.dot(vector, vertical)
      cos_theta = dot_product / magnitude

      # Clamp the arccos input into [-1, 1] to avoid NaNs from float error.
      cos_theta = cp.clip(cos_theta, -1.0, 1.0)
      angle_rad = cp.arccos(cos_theta)

      angle_sign = -cp.sign(vector[0])
      angle_deg = angle_sign * cp.degrees(angle_rad)
      return round(float(cp.asnumpy(angle_deg)), 2)
    else:
      vector = np.array([p2[0] - p1[0], p2[1] - p1[1]], dtype=np.float32)
      vertical = np.array([0, 1], dtype=np.float32)

      magnitude = np.linalg.norm(vector) * np.linalg.norm(vertical)
      if not np.isfinite(magnitude) or magnitude == 0.0:
        raise ValueError("Angle points must not coincide")

      dot_product = np.dot(vector, vertical)
      cos_theta = dot_product / magnitude
      cos_theta = np.clip(cos_theta, -1.0, 1.0)
      angle_rad = np.arccos(cos_theta)

      angle_sign = -np.sign(vector[0])
      angle_deg = angle_sign * np.degrees(angle_rad)
      return round(float(angle_deg), 2)

  def _get_center_box_idx(self, boxes):
    """
    Initial person selection — picks the bounding box closest to the frame center.
 
    Args:
      boxes: tensor of bounding boxes (xyxy format)
 
    Returns:
      Index of the bounding box closest to the frame center.
    """
    frame_cx = self.frame_width / 2
    frame_cy = self.frame_height / 2
    closest_idx = 0
    closest_dist = float('inf')
    for i, (x1, y1, x2, y2) in enumerate(boxes):
      box_cx = (x1 + x2) / 2
      box_cy = (y1 + y2) / 2
      dist = ((box_cx - frame_cx) ** 2 + (box_cy - frame_cy) ** 2) ** 0.5
      if dist < closest_dist:
        closest_dist = dist
        closest_idx = i
    return closest_idx
 
  def _get_iou_box_idx(self, boxes, prev_box):
    """
    Subsequent frame person selection — picks the bounding box with the highest
    IoU overlap with the previous frame's box to track the same person.
 
    Args:
      boxes    : tensor of bounding boxes (xyxy format)
      prev_box : bounding box from the previous frame (xyxy format)
 
    Returns:
      Index of the bounding box with highest IoU overlap.
    """
    best_idx = 0
    best_iou = 0
    px1, py1, px2, py2 = prev_box
    for i, (x1, y1, x2, y2) in enumerate(boxes):
      # Intersection
      ix1 = max(x1, px1)
      iy1 = max(y1, py1)
      ix2 = min(x2, px2)
      iy2 = min(y2, py2)
      intersection = max(0, ix2 - ix1) * max(0, iy2 - iy1)
      if intersection == 0:
        continue
      # Union
      area_a = (x2 - x1) * (y2 - y1)
      area_b = (px2 - px1) * (py2 - py1)
      iou = intersection / (area_a + area_b - intersection)
      if iou > best_iou:
        best_iou = iou
        best_idx = i
    return best_idx

  def _process_batch(self, frames, batch_metadata, prev_box, video_id, pending):
    """
    Runs YOLO inference on a batch of frames and queues DB writes.
 
    Args:
      frames         : numpy array of frames (N, H, W, C)
      batch_metadata : list of (frame_idx, timestamp) tuples matching frames
      prev_box       : bounding box from the last valid frame for IoU tracking
      video_id       : video identifier for DB writes
      pending        : current list of pending ray futures
 
    Returns:
      (prev_box, pending) updated tuple
    """
    batch_results = self.model(frames, verbose=False)
 
    for result, (frame_idx, timestamp) in zip(batch_results, batch_metadata):
      # Skip frame if no detections
      if result.keypoints is None or result.boxes is None:
        continue

      # Get boxes 
      boxes = result.boxes.xyxy

      # Get keypoint pixels to calculate angle
      keypoints_px = result.keypoints.xy

      # Get normalized keypoints
      keypoints_norm = result.keypoints.xyn

      # Skip frames where YOLO returns empty tensors (non-None but size 0).
      if len(boxes) == 0 or len(keypoints_px) == 0 or len(keypoints_norm) == 0:
        continue

      # Keypoints confidence
      keypoints_conf = result.keypoints.conf if hasattr(result.keypoints, "conf") else None
 
      # First valid frame uses center heuristic, subsequent frames use IoU
      if prev_box is None:
        box_i = self._get_center_box_idx(boxes)
      else:
        box_i = self._get_iou_box_idx(boxes, prev_box)
      prev_box = boxes[box_i]
 
      kp_px = keypoints_px[box_i]
      kp_norm = keypoints_norm[box_i]
      kp_conf = keypoints_conf[box_i] if keypoints_conf is not None else None

      # Explicitly skip when any upper-body keypoint is missing/low-confidence.
      missing_upper = False
      for index in self.upper_body_keypoints:
        if index >= len(kp_px):
          missing_upper = True
          break
        if kp_conf is not None:
          if kp_conf[index].item() <= 0:
            missing_upper = True
            break
        else:
          # Fallback validity check when confidence isn't available.
          if kp_px[index, 0].item() == 0 and kp_px[index, 1].item() == 0:
            missing_upper = True
            break

      if missing_upper:
        logger.debug(
          f"Skipping frame {frame_idx}: missing/low-confidence upper-body keypoints"
        )
        continue

      # Midpoints should be normalized (match kp_norm coordinate space).
      midpoint_shoulder_norm = (
        (kp_norm[5][0].item() + kp_norm[6][0].item()) / 2.0,
        (kp_norm[5][1].item() + kp_norm[6][1].item()) / 2.0,
      )
      midpoint_hip_norm = (
        (kp_norm[11][0].item() + kp_norm[12][0].item()) / 2.0,
        (kp_norm[11][1].item() + kp_norm[12][1].item()) / 2.0,
      )

      midpoint_shoulder_px = (
        (kp_px[5][0].item() + kp_px[6][0].item()) / 2.0,
        (kp_px[5][1].item() + kp_px[6][1].item()) / 2.0,
      )
      midpoint_hip_px = (
        (kp_px[11][0].item() + kp_px[12][0].item()) / 2.0,
        (kp_px[11][1].item() + kp_px[12][1].item()) / 2.0,
      )

      try:
        angle = self.calculate_angle(midpoint_shoulder_px, midpoint_hip_px)
      except Exception as e:
        logger.warn(f"Failed to calculate angle at frame {frame_idx}, skipping: {e}")
        continue
 
      kps_norm = {
        "nose": kp_norm[0].tolist(),
        "leftShoulder": kp_norm[5].tolist(),
        "rightShoulder": kp_norm[6].tolist(),
        "leftElbow": kp_norm[7].tolist(),
        "rightElbow": kp_norm[8].tolist(),
        "leftWrist": kp_norm[9].tolist(),
        "rightWrist": kp_norm[10].tolist(),
        "leftHip": kp_norm[11].tolist(),
        "rightHip": kp_norm[12].tolist(),
        "midpointShoulder": midpoint_shoulder_norm,
        "midpointHip": midpoint_hip_norm,
      }
 
      pending.append(
        self.db.upsert_keypoints.remote(
          video_id, frame_idx, timestamp, angle, json.dumps(kps_norm)
        )
      )
 
      # Flush DB writes when batch is large enough
      if len(pending) >= 10:
        try:
          ray.get(pending)
        except Exception as e:
          logger.error(f"Failed to batch pending keypoints: {e}")
        else:
          pending = []
 
    return prev_box, pending

  def _run_pose_estimation(self, video_url, filename, video_id):
    """
    Runs pose estimation on a video.

    Args:
      video_url (str): The URL of the video to process.
      filename (str): The filename of the video.
      video_id (str): The ID of the video.

    Returns:
      None
    """
    logger.info(f"Running pose estimation for {filename}")
    # If a new video is uploaded using the same video id, clear the previous keypoints
    ray.get(self.db.clear_video_keypoints.remote(video_id))
    temp_video_path = None
    try:
      with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        temp_video_path = temp_video.name
        urllib.request.urlretrieve(video_url, temp_video_path)

      # Decode video with GPU or CPU
      ctx = gpu(0) if torch.cuda.is_available() else cpu(0)
      vr = VideoReader(temp_video_path, ctx=ctx)

      total_frames = len(vr)
      self.frame_width  = vr[0].shape[1]
      self.frame_height = vr[0].shape[0]

      # Get every POSE_FRAME_SKIP frame index and its timestamp
      frame_limit = MAX_FRAMES if MAX_FRAMES else total_frames
      indices = list(range(0, frame_limit, POSE_FRAME_SKIP))
      timestamps = [round(vr.get_frame_timestamp(i)[0], 3) for i in indices]

      # Process frames in batches
      # first valid frame uses center heuristic to track the driver's position, subsequent frames use IoU tracking (handled in _process_batch)
      pending = []
      prev_box = None

      progress_bar = iter(tqdm(range(len(indices))))

      for batch_start in range(0, len(indices), POSE_BATCH_SIZE):
        batch_indices    = indices[batch_start : batch_start + POSE_BATCH_SIZE]
        batch_timestamps = timestamps[batch_start : batch_start + POSE_BATCH_SIZE]

        # decode frames and convert to list of (H, W, C) arrays for YOLO
        raw = vr.get_batch(batch_indices).asnumpy()
        batch_frames = [raw[i] for i in range(len(batch_indices))]

        if batch_frames[0].shape[0] == 0 or batch_frames[0].shape[1] == 0:
          logger.error(f"Invalid frame dimensions at batch starting {batch_indices[0]}, skipping")
          continue

        batch_metadata = list(zip(batch_indices, batch_timestamps))

        prev_box, pending = self._process_batch(
          batch_frames, batch_metadata,
          prev_box, video_id, pending
        )

        # Tick progress bar once per frame in the batch
        for _ in batch_indices:
          next(progress_bar)

      # Flush remaining DB writes
      if pending:
        try:
          ray.get(pending)
        except Exception as e:
          logger.error(f"Failed to flush final keypoints: {e}")

    finally:
      if temp_video_path and os.path.exists(temp_video_path):
        try:
          os.remove(temp_video_path)
        except Exception as e:
          logger.error(f"Failed to clean up temp file: {e}")
 
  def process_video(self, video_url, filename, video_id):
    """
    Run pose with in-process retries; persist terminal step status. Returns completed/failed step names.

    Args:
      video_url (str): The URL of the video to process.
      filename (str): The filename of the video.
      video_id (str): The ID of the video.

    Returns:
      str: The name of the step that was completed or failed.
    """
    ray.get(self.db.update_step_status.remote(video_id, "pose_estimation", "processing", 1))
    start_time = datetime.now()
    for attempt in range(1, MAX_STEP_RETRIES + 1):
      try:
        self._run_pose_estimation(video_url, filename, video_id)
        duration_sec = round((datetime.now() - start_time).total_seconds(), 3)
        logger.info(f"[pose_estimation] completed for {video_id} in {duration_sec} seconds")

        # update step status as completed and notify backend
        ray.get(
          self.db.update_step_status.remote(
            video_id,
            "pose_estimation",
            "completed",
            attempt,
            duration_sec,
            None,
          ),
        )
        notify_step_terminal(
          video_id,
          "pose_estimation",
          "completed",
          attempt,
          duration_sec,
          None,
        )
        return "completed"
      except Exception as e:
        logger.error(f"[pose_estimation] failed for {video_id} (attempt {attempt}/{MAX_STEP_RETRIES}): {e}")

        # if max retries reached, update step status as failed and notify backend
        if attempt >= MAX_STEP_RETRIES:
          duration_sec = round((datetime.now() - start_time).total_seconds(), 3)
          ray.get(
            self.db.update_step_status.remote(
              video_id,
              "pose_estimation",
              "failed",
              attempt,
              duration_sec,
              str(e),
            ),
          )
          notify_step_terminal(
            video_id,
            "pose_estimation",
            "failed",
            attempt,
            duration_sec,
            str(e),
          )
          return "failed"

        step_retry_sleep(attempt - 1)
        