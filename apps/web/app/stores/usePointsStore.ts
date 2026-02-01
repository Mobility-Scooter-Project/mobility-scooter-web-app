// stores/usePointStore.ts

import { create } from "zustand";
import type { Point, PointStatus } from "~/data/mock-session-data";
import { MOCK_SESSIONS } from "~/data/mock-session-data";
import type { IconProps } from "~/components/Icon";

type PointStore = {
  points: Point[];
  allVisible: boolean;
  selectedId: number | null;

  actions: {
    setPoints: (points: Point[]) => void;
    toggleAllVisibility: () => void;
    handleVisibilityToggle: (e: React.MouseEvent, id: number) => void;
    handlePointSelect: (id: number, status: PointStatus) => void;
    getIconForStatus: (status: PointStatus) => IconProps["name"];
  };
};

export const usePointStore = create<PointStore>((set, get) => ({
  points: MOCK_SESSIONS[0]?.views[0]?.points || [],
  allVisible: true,
  selectedId: null,

  actions: {
    setPoints: (points) => set({ points, selectedId: null }),

    toggleAllVisibility: () => {
      const { allVisible } = get();
      const newVisibility = !allVisible;

      set((state) => ({
        allVisible: newVisibility,
        points: state.points.map((p) =>
          p.status === "available"
            ? p
            : { ...p, status: newVisibility ? "visible" : "hidden" }
        ),
      }));
    },

    handleVisibilityToggle: (e, id) => {
      e.stopPropagation();
      set((state) => ({
        points: state.points.map((p) => {
          if (p.id !== id) return p;
          const newStatus: PointStatus =
            p.status === "visible" ? "hidden" : "visible";
          return { ...p, status: newStatus };
        }),
      }));
    },

    handlePointSelect: (id, status) => {
      if (status === "available") return;
      set((state) => ({
        selectedId: state.selectedId === id ? null : id,
      }));
    },

    getIconForStatus: (status) => {
      if (status === "visible") return "Eye";
      if (status === "hidden") return "EyeOff";
      return "Plus";
    },
  },
}));