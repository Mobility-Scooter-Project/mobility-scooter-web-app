import type { View } from "~/data/mock-session-data";
import { TimelinePlayhead } from "./TimelinePlayhead";
import { TimelineTicks } from "./TimelineTicks";
import { AnnotationTrack } from "./tracks/AnnotationTrack";
import { RiskTrack } from "./tracks/RiskTrack";
import { ChapterTrack } from "./tracks/ChapterTrack";
import { PlayerControls } from "./controls/PlayerControls";
import { useVideoStore } from "~/stores/useVideoStore";

interface PlayerTimelineProps {
  activeView: View | null;
}

export function PlayerTimeline({ activeView }: PlayerTimelineProps) {
  const duration = useVideoStore((s) => s.duration);

  return (
    <div className="flex flex-col gap-y-3">
      <div className="relative flex flex-col gap-y-3 w-full">
        <TimelinePlayhead />
        <TimelineTicks duration={duration} />
        <AnnotationTrack />
        <RiskTrack activeView={activeView} duration={duration} />
        <ChapterTrack />
      </div>

      <PlayerControls />
    </div>
  );
}