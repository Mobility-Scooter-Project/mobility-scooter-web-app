import cv2
import json
import requests
import tempfile
import cupy as cp
import numpy as np
import torch
import ray
from datetime import datetime
from ultralytics import YOLO
from ray.experimental.tqdm_ray import tqdm

from utils.logger import logger
from core.db import DBActor
from config.config import POSE_MODEL

num_gpus = 0.5 if torch.cuda.is_available() else 0
logger.debug(f"Pose estimation using {num_gpus} GPUs")

@ray.remote(num_gpus=num_gpus)
class PoseEstimation:
  def __init__(self):
    """
    Initializes the PoseEstimator with a given YOLO pose estimation model.

    """
    self.model = None
    self.upper_body_keypoints = [5, 6, 11, 12]  # Left Shoulder, Right Shoulder, Left Hip, Right Hip
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

  def _run_pose_estimation(self, video_url, filename, video_id):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
      start = datetime.now()
      temp_video.write(requests.get(video_url).content)
      temp_video.flush()
      end = datetime.now()
      logger.debug(f"Downloaded file in {(end - start).total_seconds()} seconds")
      
      if not self.model:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = YOLO(POSE_MODEL).to(device)
      
      cap = cv2.VideoCapture(temp_video.name)
      progress_bar = iter(tqdm(range(int(cap.get(cv2.CAP_PROP_FRAME_COUNT)))))
      if not cap.isOpened():
        raise RuntimeError(f"Could not open video file {video_url}")

      ret, frame = cap.read()
      if not ret:
        cap.release()
        return

      results = self.model(frame, verbose=False)
      result = results[0]

      if result.keypoints is not None and result.boxes is not None:
        keypoints = result.keypoints.xy
        boxes = result.boxes.xyxy

        # Calculate the mid-point of the first bounding box
        x1, y1, x2, y2 = boxes[0]
        x_mid = (x1 + x2) / 2
        y_mid = (y1 + y2) / 2
        
        pending = []
        frame_idx = 0
        while cap.isOpened():
          next(progress_bar)
          points = {}
          box_i = 0

          timestamp = round(cap.get(cv2.CAP_PROP_POS_MSEC) / 1000, 3)

          for box_idx, (x1, y1, x2, y2) in enumerate(boxes):
            if x1 < x_mid < x2 and y1 < y_mid < y2:
              box_i = box_idx
              break

          kp = keypoints[box_i]

          for index in self.upper_body_keypoints:
            if index < len(kp):
              x, y = int(kp[index, 0]), int(kp[index, 1])
              points[index] = [x, y]

          if 5 in points and 6 in points and 11 in points and 12 in points:
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

            if frame_idx % 5 == 0:
              pending.append(
                self.db.upsert_keypoints.remote(
                  video_id, frame_idx, timestamp, angle, json.dumps(kps)
                )
              )

            if len(pending) >= 10:
              try:
                ray.get(pending)
              except Exception as e:
                logger.error(f"Failed to batch pending keypoints: {e}")
              else:
                pending = []

          ret, frame = cap.read()
          if not ret:
            break

          results = self.model(frame, verbose=False)
          result = results[0]

          if result.keypoints is not None and result.boxes is not None:
            keypoints = result.keypoints.xy
            boxes = result.boxes.xyxy

          frame_idx += 1

      cap.release()
      
      if len(pending) > 0:
        try:
          ray.get(pending)
        except Exception as e:
          logger.error(f"Failed to batch final keypoints: {e}")
      
      end = datetime.now()
      logger.info(f"Pose estimation complete for {filename} in {end-start}")

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
      