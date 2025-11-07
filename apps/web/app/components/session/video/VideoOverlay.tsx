import { useRef, useState, useEffect } from "react";
import { VideoControls } from "./VideoControls";
import { formatDuration } from "~/lib/formatters";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";

// placeholder vid from online
const VIDEO_SRC =
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4";

export function VideoOverlay() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("timeupdate", handleTimeUpdate);

      if (video.readyState > 0) {
        handleLoadedMetadata();
      }

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, []);

  // Format times for display
  const formattedCurrentTime = formatDuration(currentTime);
  const formattedDuration = formatDuration(duration);

  return (
    <div className="flex h-full flex-col">
      {/* Video Area */}
      <div className="relative h-full flex-1">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          className="w-full object-contain"
          onPlay={() => handlePlayStateChange(true)}
          onPause={() => handlePlayStateChange(false)}
        />

        {/* drawing tools bar */}
        <div className="flex h-8 items-center gap-2 mt-2">
          <Button variant="ghost">
            <Icon name="Pencil" size="secondary" />
          </Button>
          <Button variant="ghost">
            <Icon name="Spline" size="secondary" />
          </Button>
          <Button variant="ghost">
            <Icon name="MessageSquare" size="secondary" />
          </Button>
          <Button variant="ghost">
            <Icon name="RectangleHorizontal" size="secondary" />
          </Button>
        </div>
      </div>

      {/* Controls Area */}
      <VideoControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        formattedCurrentTime={formattedCurrentTime}
        formattedDuration={formattedDuration}
        onPlayPause={togglePlayPause}
        onSeek={handleSeek}
      />
    </div>
  );
}
