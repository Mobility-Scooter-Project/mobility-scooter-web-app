import { useOverlayStore } from "~/stores/useOverlayStore";
import type { VideoFrameData } from "~/types/overlay";
import { GaitOverlay } from "./overlays/GaitOverlay";
import { PointsOverlay } from "./overlays/PointsOverlay";
import { SwayOverlay } from "./overlays/SwayOverlay";

interface StageOverlayProps {
  frames?: VideoFrameData[];
}

/**
 * Manager component responsible for mounting active video overlays.
 */
export function StageOverlay({ frames = [] }: StageOverlayProps) {
  const enabledOverlays = useOverlayStore((s) => s.enabledOverlays);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {enabledOverlays.gait && <GaitOverlay frames={frames} />}
      {enabledOverlays.points && <PointsOverlay frames={frames} />}
      {enabledOverlays.sway && <SwayOverlay frames={frames} />}
    </div>
  );
}
