import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { usePointStore } from "~/stores/usePointsStore";
import { PointToggle } from "./PointsToggle";

export function PointsContent() {
  const points = usePointStore((state) => state.points);
  const allVisible = usePointStore((state) => state.allVisible);
  const selectedId = usePointStore((state) => state.selectedId);
  const {
    toggleAllVisibility,
    handleVisibilityToggle,
    handlePointSelect,
    getIconForStatus,
  } = usePointStore((state) => state.actions);

  return (
    <div className="flex flex-col gap-3">
      {/* header */}
      <header className="flex justify-between my-3 items-center">
        <span className="text-foreground pl-3">All Points</span>
        <Button variant="ghost" onClick={toggleAllVisibility}>
          <Icon name={allVisible ? "Eye" : "EyeOff"} />
        </Button>
      </header>

      {/* points */}
      <section className="flex flex-col gap-2">
        {points.map((point) => (
          <PointToggle
            key={point.id}
            point={point}
            selected={selectedId === point.id}
            getIconForStatus={getIconForStatus}
            onSelect={handlePointSelect}
            onToggle={handleVisibilityToggle}
          />
        ))}
      </section>
    </div>
  );
}
