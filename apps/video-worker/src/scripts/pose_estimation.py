import os
import cv2
from ultralytics import YOLO
import numpy as np
import requests
import tempfile

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
    vector = np.array([p2[0] - p1[0], p2[1] - p1[1]])
    vertical = np.array([0, 1])

    # Dot product and magnitude
    dot_product = np.dot(vector, vertical)
    magnitude = np.linalg.norm(vector) * np.linalg.norm(vertical)
    angle_rad = np.arccos(dot_product / magnitude)
    angle_sign = -np.sign(vector[0])
    angle_deg = angle_sign * np.degrees(angle_rad)
    return angle_deg
  except Exception as e:
    print(f"Calculating Angle Error: {e}")

def analyze_pose(video_url, model, filename, fps=30):
  """
  Plots YOLO predictions over each frame of the video.

  Args:
    video_url (str): Url of the video file.
    model (YOLO): The loaded YOLO model.
    filename (str): Name of the video file.
    fps (int): Frames per second of the output video.

  Returns:
    The annotated video.
  """
  color = (255, 255, 0)
  upper_body_keypoints = [5, 6, 11, 12]

  cap = cv2.VideoCapture(video_url)
  if not cap.isOpened():
    print(f"Error: Could not open video file {video_url}")
    return
  
  # Get video properties
  ret, frame = cap.read()
  if not ret:
    return

  results = model.predict(frame, verbose=False)
  # Get the first prediction
  result = results[0]

  # Get bounding boxes and keypoints
  boxes = result.boxes.xyxy.cpu().numpy().astype(int)

  x1, y1, x2, y2 = boxes[0]
  x_mid = (x1 + x2)/2
  y_mid = (y1 + y2)/2

  height, width, layers = frame.shape
  fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # MP4 format

  # Set up VideoWriter to save output
  with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as annotatedVideo:
    video = cv2.VideoWriter(annotatedVideo.name, fourcc, fps, (width, height))

  while cap.isOpened():
    results = model(frame, verbose=False)
    result = results[0]

    # Get bounding boxes and keypoints
    boxes = result.boxes.xyxy.cpu().numpy().astype(int)
    keypoints = result.keypoints.xy.cpu().numpy().astype(int)

    points = {}
    box_i = 0

    for i, (x1, y1, x2, y2) in enumerate(boxes):
      if x1 < x_mid < x2 and y1 < y_mid < y2:
        box_i = i
        break

    x1, y1, x2, y2 = boxes[box_i]
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
    kp = keypoints[box_i]

    if len(results) > 0 and results[0].keypoints is not None:
      keypoints = results[0].keypoints.xy.cpu().numpy()[0]
      boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)

    for index in upper_body_keypoints:
      if index < len(kp):
        x, y = int(kp[index, 0]), int(kp[index, 1])
        points[index] = (x, y)
        cv2.circle(frame, (x, y), 5, color, -1)

    # Calculate midpoints
    if 5 in points and 6 in points and 11 in points and 12 in points:
      midpoint_shoulder = ((points[5][0] + points[6][0]) // 2, (points[5][1] + points[6][1]) // 2)
      cv2.circle(frame, midpoint_shoulder, 5, color, -1)
      midpoint_hip = ((points[11][0] + points[12][0]) // 2, (points[11][1] + points[12][1]) // 2)
      cv2.circle(frame, midpoint_hip, 5, color, -1)

    # Draw a line connecting the midpoints and calculate the angle
    cv2.line(frame, midpoint_shoulder, midpoint_hip, color, 2)
    angle = calculate_angle(midpoint_shoulder, midpoint_hip)

    # Display angle on video
    cv2.putText(frame, f"Angle: {angle:.2f} degrees", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
    
    video.write(frame)  # Save the annotated frame
    
    current_frame = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    progress = (current_frame / total_frames) * 100
    print(f"Plotting keypoints and calculating angle for {filename}... {progress:.2f}% complete", end='\r')

    ret, frame = cap.read()
    if not ret:
      break

  cap.release()
  video.release()
  return annotatedVideo

def pose_estimation(video_url, annotated_video_url, filename):
  """
  Performs pose estimation on the video.
  
  Args:
    video_url (str): Url of the video file.
    annotated_video_url (str): Url of the annotated video file.
    filename (str): Name of the video file.
  """
  if "front" not in filename:
    print(f"Pose estimation failed on {filename}. Please ensure the video is recorded from a front-facing point of view.\n")
    return
  
  model = YOLO("yolo11n-pose.pt", verbose=False)

  annotated_video_path = analyze_pose(video_url, model, filename)

  with open(annotated_video_path.name, "rb") as f:
    requests.put(annotated_video_url, data=f)

    print(f"\nannotated_{filename} sent to object store successfully!\n")
  
  os.remove(annotated_video_path.name)