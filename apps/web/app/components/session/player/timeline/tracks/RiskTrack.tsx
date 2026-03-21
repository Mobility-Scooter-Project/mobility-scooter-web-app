import type { Risk, View } from "~/data/mock-session-data";

import { TrackLabel } from "./TrackLabel";
import { getSafeDuration, getTrackPosition } from "./timeline-track";

interface RiskTrackProps {
  activeView: View | null;
  duration: number;
}

export function RiskTrack({ activeView, duration }: RiskTrackProps) {
  const risks: Risk[] = activeView?.risks ?? [];
  const safeDuration = getSafeDuration(duration);

  return (
    <div className="relative h-6.5 w-full">
      {risks.map((risk) => (
        <TrackLabel
          key={`${activeView?.id ?? "view"}-${risk.id}`}
          variant={risk.severity}
          style={getTrackPosition(risk, safeDuration)}
          title={risk.title}
        />
      ))}
    </div>
  );
}