import { VideoLabel } from "../VideoLabel";
import { useVideoStore } from "~/stores/useVideoStore";
import { Icon } from "~/components/Icon";

// TODO: Replace with real data from a RiskStore or props
const MOCK_RISKS = [
  { id: 1, startTime: 64, endTime: 65, color: "#E11D48" }, // Red
  { id: 2, startTime: 160, endTime: 210, color: "#F59E0B" }, // Amber
];

/**
 * A read-only track displaying "Risk" segments (e.g., automated AI detections).
 * Renders triangular alert icons.
 */
export function RiskTrack() {
  const duration = useVideoStore((state) => state.duration);
  const safeDuration = duration > 0 ? duration : 1;

  return (
    <div className="relative h-9 w-full pointer-events-none">
      {MOCK_RISKS.map((risk) => (
        <VideoLabel
          key={risk.id}
          id={risk.id}
          type="risk"
          label={<Icon name="TriangleAlert" />}
          startTime={risk.startTime}
          endTime={risk.endTime}
          totalDuration={safeDuration}
          color={risk.color}
        />
      ))}
    </div>
  );
}