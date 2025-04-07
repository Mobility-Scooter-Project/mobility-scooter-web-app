import os
import cv2
from ultralytics import YOLO
import numpy as np
import requests
import tempfile
import shutil

def extract_frames(video_path):
  """
  Extracts frames from a video and saves them as JPG images.

  Args:
      video_path (str): Path to the video file.
      output_folder (str): Path to the folder where frames will be saved.
  """ 

  # Open the video file
  video_capture = cv2.VideoCapture(video_path)

  # Check if the video opened successfully
  if not video_capture.isOpened():
    print(f"Error: Could not open video file: {video_path}")
    return

  frame_count = 0
  success, frame = video_capture.read()

  with tempfile.TemporaryDirectory(delete=False) as tmp_dir:
    while success and frame_count < 30 * 60:
      # Save the current frame as a JPG image
      frame_path = os.path.join(tmp_dir, f"frame_{frame_count:04d}.jpg")
      cv2.imwrite(frame_path, frame)

      frame_count += 1
      success, frame = video_capture.read()

  # Release the video capture object
  video_capture.release()

  print(f"Successfully extracted {frame_count} frames to temporary folder")
  return tmp_dir

def calculate_angle(p1, p2):
  vector = np.array([p2[0] - p1[0], p2[1] - p1[1]])
  vertical = np.array([0, 1])
  # Dot product and magnitude
  dot_product = np.dot(vector, vertical)
  magnitude = np.linalg.norm(vector) * np.linalg.norm(vertical)
  angle_rad = np.arccos(dot_product / magnitude)
  angle_sign = -np.sign(vector[0])
  angle_deg = angle_sign * np.degrees(angle_rad)
  return angle_deg

def plot_predictions(image_path, model, mid_point):
  """
  Plots YOLO predictions over the original image.

  Args:
      image_path (str): Path to the image file.
      model (YOLO): The loaded YOLO model.
  """
  color = (255, 0, 0)
  upper_body_keypoints = [5, 6, 11, 12]

  # Load the image
  img = cv2.imread(image_path)

  # Run inference
  results = model.predict(img, verbose=False)
  # print(results)
  # Get the first prediction
  result = results[0]

  # Get bounding boxes and keypoints
  boxes = result.boxes.xyxy.cpu().numpy().astype(int)
  keypoints = result.keypoints.xy.cpu().numpy().astype(int)

  points = {}
  box_i = 0

  for i, (x1, y1, x2, y2) in enumerate(boxes):
    if x1 < mid_point[0] < x2 and y1 < mid_point[1] < y2:
      box_i = i

  x1, y1, x2, y2 = boxes[box_i]
  cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
  kp = keypoints[box_i]

  for index in upper_body_keypoints:
    if index < len(kp):
      x, y = int(kp[index, 0]), int(kp[index, 1])
      points[index] = (x, y)
      cv2.circle(img, (x, y), 5, color, -1)

  # Calculate midpoints
  if 5 in points and 6 in points and 11 in points and 12 in points:
    midpoint_shoulder = ((points[5][0] + points[6][0]) // 2, (points[5][1] + points[6][1]) // 2)
    cv2.circle(img, midpoint_shoulder, 5, color, -1)
    midpoint_hip = ((points[11][0] + points[12][0]) // 2, (points[11][1] + points[12][1]) // 2)
    cv2.circle(img, midpoint_hip, 5, color, -1)


    # Draw a line connecting the midpoints and calculate the angle
    cv2.line(img, midpoint_shoulder, midpoint_hip, color, 2)
    angle = calculate_angle(midpoint_shoulder, midpoint_hip)
    # Display angle on video
    cv2.putText(img, f"Angle: {angle:.2f} degrees", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

  return img 

def images_to_video(raw_frames_dir, fps=30):
  """
  Converts a sequence of images to a video.

  Args:
      image_folder (str): Path to the folder containing the images.
      output_video_path (str): Path to save the output video.
      fps (int): Frames per second of the output video.
  """

  model = YOLO("yolo11n-pose.pt", verbose=False)

  images = [img for img in os.listdir(raw_frames_dir) if img.endswith((".png", ".jpg", ".jpeg"))]
  images.sort()  # Sort images to maintain sequence

  if not images:
    print("No images found in the directory.")
    return

  frame = cv2.imread(os.path.join(raw_frames_dir, images[0]))
  if frame is None:
    print(f"Error reading image: {os.path.join(raw_frames_dir, images[0])}")
    return
  
  #---------------------
  results = model.predict(frame, verbose=False)
  # Get the first prediction
  result = results[0]

  # Get bounding boxes and keypoints
  boxes = result.boxes.xyxy.cpu().numpy().astype(int)

  x1, y1, x2, y2 = boxes[0]
  x_mid = (x1 + x2)/2
  y_mid = (y1 + y2)/2
  #-------------------------

  height, width, layers = frame.shape
  fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # MP4 format

  with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as annotatedVideo:
    video = cv2.VideoWriter(annotatedVideo.name, fourcc, fps, (width, height))

  for image in images:
    print("\r", f"Processing {image}...", end="")

    image_path = os.path.join(raw_frames_dir, image)

    # Use the model to detect keypoints for each image
    annotated_image = plot_predictions(image_path, model, (x_mid, y_mid))

    if annotated_image is not None:
      video.write(annotated_image)
    else:
      print(f"Error processing or writing image: {image_path}")

  video.release()
  return annotatedVideo

def pose_estimation(videoUrl, annotatedVideoUrl):
  raw_frames_dir = extract_frames(videoUrl)
  annotated_video_path = images_to_video(raw_frames_dir, fps=30)
 
  shutil.rmtree(raw_frames_dir)

  with open(annotated_video_path.name, "rb") as f:
    requests.put(annotatedVideoUrl, data=f)
    print("Annotated video sent to object store successfully")
  
  os.remove(annotated_video_path)







    



