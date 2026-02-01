import { useEffect } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { VideoControls } from "./VideoControls";
import { useVideoStore } from "~/stores/useVideoStore";

interface VideoContainerProps {
  src?: string;
}

const DEFAULT_SRC =
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4";

export function VideoContainer({ src }: VideoContainerProps) {
  const { setIsPlaying, setCurrentTime } = useVideoStore(
    (state) => state.actions,
  );
  const activeSrc = src || DEFAULT_SRC;

  // Reset state when source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [activeSrc, setIsPlaying, setCurrentTime]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <VideoPlayer src={activeSrc} />
      <div className="bg-card w-full">
        <VideoControls />
      </div>
    </div>
  );
}
