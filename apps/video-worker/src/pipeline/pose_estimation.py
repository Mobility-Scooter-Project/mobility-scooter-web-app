import json
import cupy as cp
import numpy as np
import torch
import ray
from datetime import datetime
from decord import VideoReader, cpu, gpu
from ultralytics import YOLO
from ray.experimental.tqdm_ray import tqdm
 
from utils.logger import logger
from core.db import DBActor
from config.config import POSE_MODEL, POSE_BATCH_SIZE, POSE_FRAME_SKIP
 
num_gpus = 0.5 if torch.cuda.is_available() else 0
logger.debug(f"Pose estimation using {num_gpus} GPUs")

MAX_FRAMES = 13 # quick test on CPU
 
@ray.remote(num_gpus=num_gpus)
class PoseEstimation:
  def __init__(self):
    """
    Initializes the PoseEstimator with a given YOLO pose estimation model.
    """
    self.model = None
    self.upper_body_keypoints = [5, 6, 7, 8, 11, 12] 
    self.db = DBActor.remote()
 
  @staticmethod
  def calculate_angle(p1, p2):
    """
    Calculates the angle between two points.
 
    Args:
      p1 (tuple): Coordinates of the first point.
      p2 (tuple): Coordinates of the second point.
 
    Returns:
      The calculated angle rounded to two decimals.
    """
    try:
      if torch.cuda.is_available():
        vector = cp.array([p2[0] - p1[0], p2[1] - p1[1]])
        vertical = cp.array([0, 1])
        dot_product = cp.dot(vector, vertical)
        magnitude = cp.linalg.norm(vector) * cp.linalg.norm(vertical)
        angle_rad = cp.arccos(dot_product / magnitude)
        angle_sign = -cp.sign(vector[0])
        angle_deg = angle_sign * cp.degrees(angle_rad)
        return round(float(angle_deg), 2)
      else:
        vector = np.array([p2[0] - p1[0], p2[1] - p1[1]])
        vertical = np.array([0, 1])
        dot_product = np.dot(vector, vertical)
        magnitude = np.linalg.norm(vector) * np.linalg.norm(vertical)
        angle_rad = np.arccos(dot_product / magnitude)
        angle_sign = -np.sign(vector[0])
        angle_deg = angle_sign * np.degrees(angle_rad)
        return round(float(angle_deg), 2)
    except Exception as e:
      print(f"Calculating Angle Error: {e}")
 
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

  def _process_batch(self, frames, batch_metadata, prev_box, prev_points, video_id, pending):
    """
    Runs YOLO inference on a batch of frames and queues DB writes.
 
    Args:
      frames         : numpy array of frames (N, H, W, C)
      batch_metadata : list of (frame_idx, timestamp) tuples matching frames
      prev_box       : bounding box from the last valid frame for IoU tracking
      prev_points    : keypoint dict from the last valid frame (fallback for missing keypoints)
      video_id       : video identifier for DB writes
      pending        : current list of pending ray futures
 
    Returns:
      (prev_box, prev_points, pending) updated tuple
    """
    batch_results = self.model(frames, verbose=False)
 
    for result, (frame_idx, timestamp) in zip(batch_results, batch_metadata):
      # Skip frame if no detections, prev_points fallback handles keypoints
      if result.keypoints is None or result.boxes is None:
        logger.debug(f"No detections at frame {frame_idx}, keypoints will fall back to previous.")
        continue
 
      boxes = result.boxes.xyxy
      keypoints = result.keypoints.xy
 
      # First valid frame uses center heuristic, subsequent frames use IoU
      if prev_box is None:
        box_i = self._get_center_box_idx(boxes)
        logger.debug(f"Tracking initialized at frame {frame_idx} using center heuristic")
      else:
        box_i = self._get_iou_box_idx(boxes, prev_box)
      prev_box = boxes[box_i]
 
      kp = keypoints[box_i]
      points = {}
 
      for index in self.upper_body_keypoints:
        if index < len(kp) and (kp[index, 0] != 0 or kp[index, 1] != 0):
          points[index] = [int(kp[index, 0]), int(kp[index, 1])]
 
      # Fill in any missing keypoints from previous frame
      for index in self.upper_body_keypoints:
        if index not in points and prev_points and index in prev_points:
          logger.debug(f"Keypoint {index} missing at frame {frame_idx}, reusing previous.")
          points[index] = prev_points[index]
 
      # If still missing required keypoints after fallback, skip
      if not all(k in points for k in [5, 6, 11, 12]):
        logger.warning(f"Missing required keypoints at frame {frame_idx} even after fallback, skipping.")
        continue
 
      # Update prev_points for next frame
      prev_points = points
 
      midpoint_shoulder = (
        (points[5][0] + points[6][0]) // 2,
        (points[5][1] + points[6][1]) // 2,
      )
      midpoint_hip = (
        (points[11][0] + points[12][0]) // 2,
        (points[11][1] + points[12][1]) // 2,
      )
 
      angle = self.calculate_angle(midpoint_shoulder, midpoint_hip)
 
      kps = {
        "leftShoulder": points[5],
        "rightShoulder": points[6],
        "leftHip": points[11],
        "rightHip": points[12],
        "midpointShoulder": midpoint_shoulder,
        "midpointHip": midpoint_hip,
      }
 
      pending.append(
        self.db.upsert_keypoints.remote(
          video_id, frame_idx, timestamp, angle, json.dumps(kps)
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
 
    return prev_box, prev_points, pending

  def _run_pose_estimation(self, video_url, filename, video_id):
    start = datetime.now()
 
    # Load model 
    if not self.model:
      device = "cuda" if torch.cuda.is_available() else "cpu"
      self.model = YOLO(POSE_MODEL).to(device)
 
    # Load video directly from URL with decord 
    ctx = gpu(0) if torch.cuda.is_available() else cpu(0)
    vr = VideoReader(video_url, ctx=ctx)
 
    total_frames = len(vr)
    self.frame_width  = vr[0].shape[1]
    self.frame_height = vr[0].shape[0]
 
    # Get every POSE_FRAME_SKIP frame index and its timestamp
    indices = list(range(0, MAX_FRAMES, POSE_FRAME_SKIP))
    timestamps = [round(vr.get_frame_timestamp(i)[0], 3) for i in indices]
 
    # Process frames in batches
    # first valid frame uses center heuristic to track the driver's position, subsequent frames use IoU tracking (handled in _process_batch)
    pending = []
    prev_box = None
    prev_points = None
 
    progress_bar = iter(tqdm(range(len(indices))))
 
    for batch_start in range(0, len(indices), POSE_BATCH_SIZE):
      batch_indices    = indices[batch_start : batch_start + POSE_BATCH_SIZE]
      batch_timestamps = timestamps[batch_start : batch_start + POSE_BATCH_SIZE]
 
      # Fetch batch of frames from decord — returns (N, H, W, C) numpy array
      batch_frames = vr.get_batch(batch_indices).asnumpy()
 
      # Build metadata list matching the current batch
      batch_metadata = list(zip(batch_indices, batch_timestamps))
 
      prev_box, prev_points, pending = self._process_batch(
        batch_frames, batch_metadata,
        prev_box, prev_points,
        video_id, pending
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
 
    end = datetime.now()
    logger.info(f"Pose estimation complete for {filename} in {end - start}")
 
  def process_video(self, video_url, filename, video_id):
    ray.get(self.db.update_step_status.remote(video_id, "pose_estimation", "processing"))
    try:
      self._run_pose_estimation(video_url, filename, video_id)
    except Exception as e:
      logger.error(f"Pose estimation failed for {filename}: {e}")
      ray.get(self.db.update_step_status.remote(video_id, "pose_estimation", "failed", str(e)))
      raise
    else:
      ray.get(self.db.update_step_status.remote(video_id, "pose_estimation", "completed"))
        