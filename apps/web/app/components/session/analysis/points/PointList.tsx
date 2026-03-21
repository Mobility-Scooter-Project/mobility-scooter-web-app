import { usePointStore } from "~/stores/usePointsStore";
import { useSelectionStore } from "~/stores/useSelectionStore";
import { PointToggle } from "./PointToggle";

/**
 * Renders the list of points for the current session.
 * Handles selection and point actions through the point store.
 */
export function PointList() {
  const points = usePointStore((state) => state.points);
  
  const selectedId = useSelectionStore((state) => state.selectedId);
  const selectedType = useSelectionStore((state) => state.selectedType);
  const { setSelection } = useSelectionStore((state) => state.actions);

  const { handleVisibilityToggle, enablePoint } =
    usePointStore((state) => state.actions);

  return (
    <div className="flex flex-col gap-3">
      {points.map((point) => (
        <PointToggle
          key={point.id}
          data={point}
          isSelected={selectedType === "point" && selectedId === point.id}
          onSelect={() => {
            if (point.status !== "inactive") {
              setSelection("point", point.id);
            }
          }}
          onToggleVisibility={(e) => {
            e.stopPropagation();
            handleVisibilityToggle(point.id);
          }}
          onEnable={(e) => {
            e.stopPropagation();
            enablePoint(point.id);
          }}
        />
      ))}
    </div>
  );
}