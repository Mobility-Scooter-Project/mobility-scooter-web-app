import { useRef } from "react";
import { useVideoPlayerLogic } from "~/hooks/useVideoPlayerLogic";

interface VideoPlayerProps {
  src: string;
}

/**
 * Renders the HTML5 Video element and binds it to the global store.
 */
export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { handleTimeUpdate, handleLoadedMetadata, handleEnded, togglePlay } = 
    useVideoPlayerLogic(videoRef);

  return (
    <div className="relative w-full aspect-video flex items-center justify-center overflow-hidden bg-black rounded-md">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        playsInline
      />
    </div>
  );
}