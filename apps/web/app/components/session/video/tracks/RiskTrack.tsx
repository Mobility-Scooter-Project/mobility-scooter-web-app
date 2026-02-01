import { VideoLabel } from "../VideoLabel";
import { useVideoStore } from "~/stores/useVideoStore";

const MOCK_RISKS = [
  { id: 1, startTime: 30, endTime: 65, label: "Risk Label", color: "#E11D48" },
  {
    id: 2,
    startTime: 160,
    endTime: 210,
    label: "Risk Label",
    color: "#F59E0B",
  },
];

export function RiskTrack() {
  const duration = useVideoStore((state) => state.duration);
  const safeDuration = duration > 0 ? duration : 1;

  return (
    <div className="relative h-9 w-full mb-1 pointer-events-none">
      {MOCK_RISKS.map((risk) => (
        <VideoLabel
          key={risk.id}
          id={risk.id}
          type="risk"
          label={risk.label}
          startTime={risk.startTime}
          endTime={risk.endTime}
          totalDuration={safeDuration}
          color={risk.color}
        />
      ))}
    </div>
  );
}
