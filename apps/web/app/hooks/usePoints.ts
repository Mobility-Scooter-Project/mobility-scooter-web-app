import { useState } from "react";

type PointStatus = "visible" | "hidden" | "available";

type MockPoint = {
  id: number;
  name: string;
  status: PointStatus;
};

const mockPoints: MockPoint[] = [
  { id: 1, name: "Nose", status: "visible" },
  { id: 2, name: "Left Shoulder", status: "visible" },
  { id: 3, name: "Right Shoulder", status: "hidden" },
  { id: 4, name: "Left Elbow", status: "available" },
  { id: 5, name: "Right Elbow", status: "visible" },
];

/**
 * Mutation and state handlers for points.
 */
export function usePoints() {
  const [points, setPoints] = useState(mockPoints);
  const [allVisible, setAllVisible] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const toggleAllVisibility = () => {
    const newVisibility = !allVisible;
    setAllVisible(newVisibility);

    setPoints((prevPoints) =>
      prevPoints.map((p) =>
        p.status === "available"
          ? p
          : { ...p, status: newVisibility ? "visible" : "hidden" }
      )
    );
  };

  const handleVisibilityToggle = (
    e: React.MouseEvent,
    id: number
  ) => {
    e.stopPropagation();
    setPoints((prevPoints) =>
      prevPoints.map((p) => {
        if (p.id !== id) return p;
        const newStatus: PointStatus =
          p.status === "visible" ? "hidden" : "visible";
        return { ...p, status: newStatus };
      })
    );
  };

  const handlePointSelect = (id: number, status: PointStatus) => {
    if (status === "available") return;
    setSelectedId((prevId) => (prevId === id ? null : id));
  };

  const getIconForStatus = (status: PointStatus) => {
    if (status === "visible") return "Eye";
    if (status === "hidden") return "EyeOff";
    return "Plus";
  };
  
  return {
    points,
    allVisible,
    selectedId,
    toggleAllVisibility,
    handleVisibilityToggle,
    handlePointSelect,
    getIconForStatus
  };
}