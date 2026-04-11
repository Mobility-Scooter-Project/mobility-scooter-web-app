import { Toggle } from "~/components/Toggle";
import { useOverlayStore } from "~/stores/useOverlayStore";
import type { StageOverlayKey } from "~/types/overlay";

const STAGE_TOGGLES: Array<{ key: StageOverlayKey; label: string }> = [
  { key: "gait", label: "Gait" },
  { key: "sway", label: "Sway Displacement" },
  { key: "points", label: "Points" },
];

export function VideoStageToggles() {
  const enabledOverlays = useOverlayStore((s) => s.enabledOverlays);
  const toggleOverlay = useOverlayStore((s) => s.actions.toggleOverlay);

  return (
    <div className="flex flex-wrap gap-3">
      {STAGE_TOGGLES.map((toggle) => (
        <Toggle
          key={toggle.key}
          pressed={enabledOverlays[toggle.key]}
          onPressedChange={() => toggleOverlay(toggle.key)}
          className="text-foreground inset-ring-2 inset-ring-accent"
        >
          {toggle.label}
        </Toggle>
      ))}
    </div>
  );
}