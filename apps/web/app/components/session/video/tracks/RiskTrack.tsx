import { VideoLabel } from "../VideoLabel";
import { useVideoStore } from "~/stores/useVideoStore";
import { Icon } from "~/components/Icon";

const MOCK_RISKS = [
  { id: 1, startTime: 64, endTime: 65, color: "#E11D48" },
  {
    id: 2,
    startTime: 160,
    endTime: 210,
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
