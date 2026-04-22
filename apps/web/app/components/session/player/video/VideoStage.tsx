import { useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { View } from "~/data/mock-session-data";
import { VideoStageToggles } from "./VideoStageToggles";
import { StageOverlay } from "./StageOverlay";
import { VideoInteractionFeedback } from "./VideoInteractionFeedback";
import { PipelineProgress } from "../../common/PipelineProgress";
import { useVideoPipeline } from "~/hooks/useVideoPipeline";
import { useVideoSync } from "~/hooks/useVideoSync";
import { usePlayableVideoSource } from "~/hooks/usePlayableVideoSource";
import { useVideoStore } from "~/stores/useVideoStore";
import { VIDEO_SHORTCUT_FEEDBACK } from "~/hooks/videoPlayerShortcuts";

interface VideoStageProps {
  activeView: View | null;
}

export function VideoStage({ activeView }: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isPlaying = useVideoStore((state) => state.isPlaying);
  const isVideoLoading = useVideoStore((state) => state.isVideoLoading);
  const { setIsPlaying, showInteractionFeedback } = useVideoStore(
    (state) => state.actions,
  );

  const { pipelineSteps, pipelineVisible, frames } = useVideoPipeline(activeView);
  const { playbackUrl } = usePlayableVideoSource(
    activeView?.videoId,
    activeView?.videoUrl,
  );
  const { isRetryingSource, ...videoHandlers } = useVideoSync(
    videoRef,
    activeView?.videoId,
    activeView?.id,
    playbackUrl,
  );

  const hasActiveView = Boolean(activeView);
  const hasPlaybackUrl = Boolean(playbackUrl);
  const isUploadingMessageVisible =
    Boolean(activeView?.videoId) && !activeView?.uploadError && isRetryingSource;
  const overlayControlsReady =
    Boolean(activeView?.videoId) && hasPlaybackUrl && frames.length > 0;

  const handleVideoClick = useCallback(() => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    showInteractionFeedback(
      nextPlaying ? VIDEO_SHORTCUT_FEEDBACK.play : VIDEO_SHORTCUT_FEEDBACK.pause,
    );
  }, [isPlaying, setIsPlaying, showInteractionFeedback]);

  return (
    <section className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between gap-4">
        <VideoStageToggles disabled={!overlayControlsReady} />
        {pipelineVisible && (
          <PipelineProgress
            steps={pipelineSteps}
            playbackReady={hasPlaybackUrl}
            overlaysReady={overlayControlsReady}
          />
        )}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black">
        {hasPlaybackUrl ? (
          <video
            key={activeView!.id}
            ref={videoRef}
            src={playbackUrl}
            preload="auto"
            className="block h-full w-full object-contain"
            controls={false}
            onClick={handleVideoClick}
            {...videoHandlers}
          />
        ) : hasActiveView ? (
          <div className="flex h-full w-full items-center justify-center">
            <span className="inline-flex items-center gap-2 text-label text-white/70">
              <Loader2 className="size-4 animate-spin" />
              Loading video...
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-label text-white/50">No video selected</span>
          </div>
        )}

        {hasPlaybackUrl && isUploadingMessageVisible && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/45 px-6 text-center">
            <div className="flex flex-col items-center gap-2 text-white/85">
              <Loader2 className="size-5 animate-spin" />
              <div className="space-y-1">
                <p className="text-label">Currently uploading</p>
                <p className="text-xs text-white/65">
                  The video will appear here automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasPlaybackUrl && isVideoLoading && !isUploadingMessageVisible && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/15">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-label text-white shadow-lg">
              <Loader2 className="size-4 animate-spin" />
            </span>
          </div>
        )}

        <VideoInteractionFeedback />
        <StageOverlay frames={frames} />
      </div>
    </section>
  );
}
