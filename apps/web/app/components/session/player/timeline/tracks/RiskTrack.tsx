import { useRef } from "react";
import type { Risk, View } from "~/data/mock-session-data";

import { TrackLabel } from "./TrackLabel";
import { getSafeDuration } from "./timeline-track";
import { useTrackRowLayout } from "./useTrackRowLayout";

interface RiskTrackProps {
  activeView: View | null;
  duration: number;
}

export function RiskTrack({ activeView, duration }: RiskTrackProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const risks: Risk[] = activeView?.risks ?? [];
  const safeDuration = getSafeDuration(duration);
  const { items: positionedRisks, containerHeight } = useTrackRowLayout(
    containerRef,
    risks,
    safeDuration,
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${containerHeight}px` }}
    >
      {positionedRisks.map(({ item: risk, style }) => (
        <TrackLabel
          key={`${activeView?.id ?? "view"}-${risk.id}`}
          variant={risk.severity}
          style={style}
          title={risk.title}
        />
      ))}
    </div>
  );
}
