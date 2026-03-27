import logging
import os
import warnings

def _setup_warnings():
  noisy_libraries = [
    "pyannote", "speechbrain", "whisperx",
    "pytorch_lightning", "torch", "torchaudio",
    "google.generativeai", "absl", "torchcodec",
  ]
  for lib in noisy_libraries:
    warnings.filterwarnings("ignore", module=rf"^{lib}(\.|$)")
    lib_logger = logging.getLogger(lib) 
    lib_logger.setLevel(logging.ERROR)
    lib_logger.propagate = False

_setup_warnings()

import contextlib
import tempfile
import requests
import gc
import pandas as pd
import torch
import whisperx
from collections import defaultdict

from utils.logger import logger
from whisperx.diarize import DiarizationPipeline 
from config.config import HF_TOKEN, WHISPERX_SIZE, BATCH_SIZE, COMPUTE_TYPE, VAD_ONSET, VAD_OFFSET

# gpu actions to be replaced by model service
class VideoTranscriber:
  def __init__(self):
    self.model_device = "cuda" if torch.cuda.is_available() else "cpu"

    # Load Models 
    self.whisper_model = None
    self.diarize_model = None
    self._initialize_models()

  @staticmethod
  @contextlib.contextmanager
  def _unsafe_torch_load():
    original_load = torch.load
    def patched_load(*args, **kwargs):
      kwargs.setdefault("weights_only", False)
      return original_load(*args, **kwargs)
    torch.load = patched_load
    orig_matmul = torch.backends.cuda.matmul.allow_tf32
    orig_cudnn = torch.backends.cudnn.allow_tf32
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True
    try:
      yield
    finally:
      torch.load = original_load
      torch.backends.cuda.matmul.allow_tf32 = orig_matmul
      torch.backends.cudnn.allow_tf32 = orig_cudnn

  def _initialize_models(self):
    with self._unsafe_torch_load():

      vad_options = {
        "vad_onset": VAD_ONSET,
        "vad_offset": VAD_OFFSET,
      }

      self.whisper_model = whisperx.load_model(
        WHISPERX_SIZE,
        device=self.model_device,
        compute_type=COMPUTE_TYPE if self.model_device == "cuda" else "int8",
        vad_options=vad_options,
      )
      self.diarize_model = DiarizationPipeline(
        token=HF_TOKEN,
        device=self.model_device,
      )

  def _generate_transcript(self, result, video_name):
    speakerScript = defaultdict(list)
    speakerLabel = defaultdict(str)
    for segment in result["segments"]:
      if "speaker" not in segment:
        continue
      start, end = segment["start"], segment["end"]
      speaker, sentence = segment["speaker"], segment["text"]
      speakerScript[speaker].append([start, end, sentence])

    if len(speakerScript["SPEAKER_00"]) >= len(speakerScript["SPEAKER_01"]):
      speakerLabel["SPEAKER_00"] = "instructor"
      speakerLabel["SPEAKER_01"] = "participant"
    else:
      speakerLabel["SPEAKER_01"] = "instructor"
      speakerLabel["SPEAKER_00"] = "participant"

    scripts = []
    for segment in result["segments"]:
      if "speaker" not in segment:
        continue
      start, end = segment["start"], segment["end"]
      speaker = speakerLabel[segment["speaker"]]
      text = segment["text"]
      scripts.append([speaker, start, end, text])

    transcript_df = pd.DataFrame(scripts, columns=["speaker", "start", "end", "text"])

    return transcript_df

  def transcribe_video(self, video_url, filename):
    """Runs the full transcription, alignment, and diarization pipeline on a video file.
    Returns a transcript DataFrame (speaker, start, end, text). Raises on failure.
    """
    video_name = filename.split(".")[0]

    temp_video_path = None
    try:
      logger.info(f"[transcription] Starting WhisperX pipeline for {video_name}")

      with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        temp_video_path = temp_video.name
        logger.info(f"[transcription] Downloading video for {video_name}")
        temp_video.write(requests.get(video_url).content)
        
      logger.info(f"[transcription] Loading audio for {video_name}")
      audio = whisperx.load_audio(temp_video_path)

      logger.info(f"[transcription] Transcribing audio for {video_name}")
      result = self.whisper_model.transcribe(audio, batch_size=BATCH_SIZE)

      logger.info(f"[transcription] Aligning segments for {video_name}")
      model_a, metadata = whisperx.load_align_model(language_code=result["language"], device=self.model_device)
      result = whisperx.align(result["segments"], model_a, metadata, audio, self.model_device, return_char_alignments=False)
      del model_a
      gc.collect()
      torch.cuda.empty_cache()

      logger.info(f"[transcription] Diarizing speakers for {video_name}")
      diarize_segments = self.diarize_model(audio, min_speakers=1, max_speakers=2)

      logger.info(f"[transcription] Assigning speakers for {video_name}")
      result = whisperx.assign_word_speakers(diarize_segments, result)

      if result is None:
        raise RuntimeError(f"WhisperX returned None for {video_name}")

      return self._generate_transcript(result, video_name)

    except Exception as e:
      logger.error(f"Error transcribing video {video_name}: {e}")
      raise
    finally:
      if temp_video_path:
        try:
          os.remove(temp_video_path)
        except Exception as e:
          logger.error(f"Failed to clean up temp file: {e}")
