import { Toggle } from "~/components/Toggle";

import type { StageOverlayKey } from "./VideoStage";

interface VideoStageTogglesProps {
  enabledOverlays: Record<StageOverlayKey, boolean>;
  onToggle: (key: StageOverlayKey) => void;
}

const STAGE_TOGGLES: Array<{ key: StageOverlayKey; label: string }> = [
  { key: "gait", label: "Gait" },
  { key: "sway", label: "Sway Displacement" },
  { key: "points", label: "Points" },
];

export function VideoStageToggles({
  enabledOverlays,
  onToggle,
}: VideoStageTogglesProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {STAGE_TOGGLES.map((toggle) => (
        <Toggle
          key={toggle.key}
          pressed={enabledOverlays[toggle.key]}
          onPressedChange={() => onToggle(toggle.key)}
          className="text-foreground inset-ring-2 inset-ring-accent"
        >
          {toggle.label}
        </Toggle>
      ))}
    </div>
  );
}