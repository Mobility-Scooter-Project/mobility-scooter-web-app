import { useRef } from "react";
import type { View } from "~/data/mock-session-data";
import { VideoStageToggles } from "./VideoStageToggles";
import { StageOverlay } from "./StageOverlay";
import { PipelineProgress } from "../../common/PipelineProgress";
import { useVideoPipeline } from "~/hooks/useVideoPipeline";
import { useVideoSync } from "~/hooks/useVideoSync";

interface VideoStageProps {
  activeView: View | null;
}

export function VideoStage({ activeView }: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { pipelineSteps, pipelineVisible, frames } = useVideoPipeline(activeView);
  const videoHandlers = useVideoSync(videoRef, activeView);

  return (
    <section className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between gap-4">
        <VideoStageToggles />
        {pipelineVisible && <PipelineProgress steps={pipelineSteps} />}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black">
        {activeView?.videoUrl ? (
          <video
            key={activeView.id}
            ref={videoRef}
            src={activeView.videoUrl}
            preload="metadata"
            className="block h-full w-full object-contain"
            controls={false}
            {...videoHandlers}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-label text-white/50">No video selected</span>
          </div>
        )}

        <StageOverlay frames={frames} />
      </div>
    </section>
  );
}