import type { ReactNode } from "react";

import type { StageOverlayKey } from "./VideoStage";
import { StageOverlay } from "./StageOverlay";

interface VideoSurfaceProps {
  enabledOverlays: Record<StageOverlayKey, boolean>;
  children: ReactNode;
}

const OVERLAY_STYLES: Record<
  StageOverlayKey,
  { label: string; className: string }
> = {
  gait: {
    label: "Gait Overlay",
    className: "bg-cyan-400/10",
  },
  sway: {
    label: "Sway Displacement Overlay",
    className: "bg-fuchsia-400/10",
  },
  points: {
    label: "Points Overlay",
    className: "bg-amber-300/12",
  },
};

export function VideoSurface({
  enabledOverlays,
  children,
}: VideoSurfaceProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-black">
      {children}

      {Object.entries(enabledOverlays).map(([key, isVisible]) => {
        if (!isVisible) return null;

        const overlay = OVERLAY_STYLES[key as StageOverlayKey];

        return (
          <StageOverlay
            key={key}
            label={overlay.label}
            className={overlay.className}
          />
        );
      })}
    </div>
  );
}