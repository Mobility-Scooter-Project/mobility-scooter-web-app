import { useEffect } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { VideoControls } from "./VideoControls";
import { useVideoStore } from "~/stores/useVideoStore";

interface VideoContainerProps {
  src?: string;
  className?: string;
}

const DEFAULT_SRC = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4";

/**
 * The main container for the video player and its controls.
 * - Responsible for rendering the video and managing its state (playback, current time).
 * - Resets playback state when the video source changes.
 * - Provides a consistent layout for the video and controls.
 */
export function VideoContainer({ src, className }: VideoContainerProps) {
  const { setIsPlaying, setCurrentTime } = useVideoStore((state) => state.actions);
  
  const activeSrc = src || DEFAULT_SRC;

  // Reset state when source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [activeSrc, setIsPlaying, setCurrentTime]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-transparent">
      {/* Video Area */}
      <div className="relative flex-1 min-h-0 rounded-md bg-black">
        <VideoPlayer src={activeSrc} />
      </div>

      {/* Controls Area */}
      <div className="flex flex-col shrink-0 border-t bg-card z-10 w-full">
        <VideoControls />
      </div>
    </div>
  );
}