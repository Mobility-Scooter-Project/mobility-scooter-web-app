import { useEffect, useRef } from "react";
import { useVideoStore } from "~/stores/useVideoStore";

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const isPlaying = useVideoStore((state) => state.isPlaying);
  const currentTime = useVideoStore((state) => state.currentTime);
  const duration = useVideoStore((state) => state.duration);
  const { setIsPlaying, setCurrentTime, setDuration } = useVideoStore((state) => state.actions);

  // Sync: Store -> Video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) {
      video.play().catch(() => setIsPlaying(false));
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Sync: Seek
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable) return;
      if (!videoRef.current) return;

      const JUMP_SHORT = 5;
      const JUMP_LONG = 15;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case "arrowleft":
          e.preventDefault();
          setCurrentTime(Math.max(0, videoRef.current.currentTime - JUMP_SHORT));
          break;
        case "arrowright":
          e.preventDefault();
          setCurrentTime(Math.min(duration, videoRef.current.currentTime + JUMP_SHORT));
          break;
        case "j":
          e.preventDefault();
          setCurrentTime(Math.max(0, videoRef.current.currentTime - JUMP_LONG));
          break;
        case "l":
          e.preventDefault();
          setCurrentTime(Math.min(duration, videoRef.current.currentTime + JUMP_LONG));
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, duration, setIsPlaying, setCurrentTime]);

  return (
    <div className="relative w-full aspect-video flex items-center justify-center overflow-hidden bg-black rounded-md">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onClick={() => setIsPlaying(!isPlaying)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}