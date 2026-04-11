import { create } from "zustand";
import type { Point, PointStatus } from "~/data/mock-session-data";
import { useSelectionStore } from "./useSelectionStore";

type PointStore = {
  points: Point[];
  allVisible: boolean;

  actions: {
    setPoints: (points: Point[]) => void;
    toggleAllVisibility: () => void;
    handleVisibilityToggle: (id: string) => void;
    enablePoint: (id: string) => void;
  };
};

/**
 * Returns whether all selectable points are currently visible.
 */
function getAllPointsVisible(points: Point[]): boolean {
  const selectablePoints = points.filter((point) => point.status !== "inactive");

  return (
    selectablePoints.length > 0 &&
    selectablePoints.every((point) => point.status === "visible")
  );
}

/**
 * Manages interactive video points, including visibility and selection state.
 */
export const usePointStore = create<PointStore>((set, get) => ({
  points: [],
  allVisible: true,

  actions: {
    setPoints: (points) => {
      set({
        points,
        allVisible: getAllPointsVisible(points),
      });
      useSelectionStore.getState().actions.clearSelection();
    },

    toggleAllVisibility: () => {
      const { allVisible } = get();
      const nextStatus: PointStatus = allVisible ? "hidden" : "visible";

      set((state) => {
        const points: Point[] = state.points.map((point) =>
          point.status === "inactive"
            ? point
            : {
                ...point,
                status: nextStatus,
              },
        );

        return {
          points,
          allVisible: getAllPointsVisible(points),
        };
      });
    },

    handleVisibilityToggle: (id) => {
      set((state) => {
        const points: Point[] = state.points.map((point) => {
          if (point.id !== id || point.status === "inactive") {
            return point;
          }

          const nextStatus: PointStatus =
            point.status === "visible" ? "hidden" : "visible";

          return {
            ...point,
            status: nextStatus,
          };
        });

        return {
          points,
          allVisible: getAllPointsVisible(points),
        };
      });
    },

    enablePoint: (id) => {
      set((state) => {
        const points: Point[] = state.points.map((point) =>
          point.id !== id || point.status !== "inactive"
            ? point
            : { ...point, status: "visible" },
        );

        return {
          points,
          allVisible: getAllPointsVisible(points),
        };
      });
      useSelectionStore.getState().actions.setSelection("point", id);
    },
  },
}));

/**
 * Selector for whether all selectable points are visible.
 */
export const selectAllPointsVisible = (state: PointStore) => state.allVisible;