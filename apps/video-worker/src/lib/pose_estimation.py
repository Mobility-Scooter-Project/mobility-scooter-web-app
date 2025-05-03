import os
import cv2
import requests
import tempfile
from dotenv import load_dotenv
from datetime import timedelta
import cupy as cp
import numpy as np
from lib.audio_detection import format_time
import torch
import pika
import json

load_dotenv()
API_KEY = os.getenv('TESTING_API_KEY')
USER_TOKEN = os.getenv('USER_TOKEN')

def calculate_angle(p1, p2):
  """
  Calculates the angle of a straight line connected by two points.

  Args:
    p1 (tuple): Coordinates of a midpoint.
    p2 (tuple): Coordinates of another midpoint.

  Returns:
    The calculated angle.
  """
  try:
    if torch.cuda.is_available():
      vector = cp.array([p2[0] - p1[0], p2[1] - p1[1]])
      vertical = cp.array([0, 1])

      # Dot product and magnitude
      dot_product = cp.dot(vector, vertical)
      magnitude = cp.linalg.norm(vector) * cp.linalg.norm(vertical)
      angle_rad = cp.arccos(dot_product / magnitude)
      angle_sign = -cp.sign(vector[0])
      angle_deg = angle_sign * cp.degrees(angle_rad)
      return round(float(angle_deg), 2)
    else:
      vector = np.array([p2[0] - p1[0], p2[1] - p1[1]])
      vertical = np.array([0, 1])

      # Dot product and magnitude
      dot_product = np.dot(vector, vertical)
      magnitude = np.linalg.norm(vector) * np.linalg.norm(vertical)
      angle_rad = np.arccos(dot_product / magnitude)
      angle_sign = -np.sign(vector[0])
      angle_deg = angle_sign * np.degrees(angle_rad)
      return round(float(angle_deg), 2)
  except Exception as e:
    print(f"Calculating Angle Error: {e}")

def pose_estimation(model, video_url, filename, video_id):
  """
  Locates and stores the upper body key points using a pose estimation model

  Args:
    model (YOLO): The loaded YOLO pose estimation model.
    video_url (str): Url of the video file.
    filename (str): Name of the video file.
    video_id (str): The ID of the video.
  """
  upper_body_keypoints = [5, 6, 11, 12]  # Left Shoulder, Right Shoulder, Left Hip, Right Hip
  
  with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
    temp_video.write(requests.get(video_url).content)  
    temp_video.flush()

    cap = cv2.VideoCapture(temp_video.name)
    if not cap.isOpened():
      print(f"Error: Could not open video file {video_url}")
      return
    
    # Get video properties
    ret, frame = cap.read()
    if not ret:
      return

    results = model(frame, verbose=False)
    # Get the first prediction  
    result = results[0]
    
    # Get bounding boxes and keypoints
    if result.keypoints is not None and result.boxes is not None: 
      keypoints = result.keypoints.xy
      boxes = result.boxes.xyxy

    x1, y1, x2, y2 = boxes[0]
    x_mid = (x1 + x2)/2
    y_mid = (y1 + y2)/2
    
    while cap.isOpened():
      points = {}
      box_i = 0

      frame_seconds = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000
      timestamp = format_time(timedelta(seconds=frame_seconds))

      for i, (x1, y1, x2, y2) in enumerate(boxes):
        if x1 < x_mid < x2 and y1 < y_mid < y2:
          box_i = i
          break

      kp = keypoints[box_i]

      for index in upper_body_keypoints:
        if index < len(kp):
          x, y = int(kp[index, 0]), int(kp[index, 1])
          points[index] = (x, y)

      # Calculate midpoints
      if 5 in points and 6 in points and 11 in points and 12 in points:
        midpoint_shoulder = (points[5][0] + points[6][0]) // 2, (points[5][1] + points[6][1]) // 2
        midpoint_hip = (points[11][0] + points[12][0]) // 2, (points[11][1] + points[12][1]) // 2

        angle = calculate_angle(midpoint_shoulder, midpoint_hip)

        channel.basic_publish(
          exchange='storage',
          routing_key='keypoints.post',
          body=json.dumps({
            "videoId": video_id,
            "timestamp": timestamp,
            "angle": angle,
            "keypoints": {
              "leftShoulder": points[5],
              "rightShoulder": points[6],
              "leftHip": points[11],
              "rightHip": points[12],
              "midpointShoulder": midpoint_shoulder,
              "midpointHip": midpoint_hip,
            },
          }),
          properties=pika.BasicProperties(
            content_type='application/json',
            delivery_mode=2,  # make message persistent
          )
        )
        

      print(f"\rExtracting keypoints and calculating angle for {filename}... {timestamp} complete", end="")

      # Perform operations for the frame
      ret, frame = cap.read()
      if not ret:
        break 

      results = model(frame, verbose=False)
      result = results[0]
      
      # Get keypoints
      if result.keypoints is not None and result.boxes is not None: 
        keypoints = result.keypoints.xy
        boxes = result.boxes.xyxy

    cap.release()