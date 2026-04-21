import { create } from "zustand";
import type { StageOverlayKey } from "~/types/overlay";

interface OverlayStore {
  enabledOverlays: Record<StageOverlayKey, boolean>;
  actions: {
    toggleOverlay: (key: StageOverlayKey) => void;
    setOverlays: (overlays: Record<StageOverlayKey, boolean>) => void;
  };
}

const DEFAULT_OVERLAYS: Record<StageOverlayKey, boolean> = {
  gait: false,
  sway: false,
  points: false,
};

/**
 * Manages the visibility state of video analysis overlays.
 */
export const useOverlayStore = create<OverlayStore>((set) => ({
  enabledOverlays: DEFAULT_OVERLAYS,

  actions: {
    toggleOverlay: (key) =>
      set((state) => ({
        enabledOverlays: {
          ...state.enabledOverlays,
          [key]: !state.enabledOverlays[key],
        },
      })),
    setOverlays: (enabledOverlays) => set({ enabledOverlays }),
  },
}));