import { useState } from "react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

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

export function PointsContent() {
  const [points, setPoints] = useState(mockPoints);
  const [allVisible, setAllVisible] = useState(true);

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

  const handlePointClick = (id: number) => {
    setPoints((prevPoints) =>
      prevPoints.map((p) => {
        if (p.id !== id) return p;

        // Clicking toggles its state:
        // 'visible' -> 'hidden'
        // 'hidden' -> 'visible'
        // 'available' -> 'visible'
        const newStatus: PointStatus =
          p.status === "visible" ? "hidden" : "visible";
        return { ...p, status: newStatus };
      })
    );
  };

  const getIconForStatus = (status: PointStatus) => {
    if (status === "visible") return "Eye";
    if (status === "hidden") return "EyeOff";
    return "Plus";
  };

  return (
    <div className="flex flex-col gap-3">
      {/* header */}
      <header className="flex justify-between my-3">
        <span className="text-subhead text-foreground pl-3">All Points</span>
        <Button variant="ghost" size="inline" onClick={toggleAllVisibility}>
          <Icon name={allVisible ? "Eye" : "EyeOff"} />
        </Button>
      </header>

      {/* points */}
      <section className="flex flex-col gap-2">
        {points.map((point) => (
          <Button
            key={point.id}
            variant="outline"
            size="default"
            onClick={() => handlePointClick(point.id)}
            className={cn(
              "h-14 justify-between px-4 text-base font-semibold hover:bg-background/60",

              point.status === "visible" && "bg-background text-foreground", // White bg, dark text
              point.status === "hidden" && "bg-background text-foreground/50", // White bg, gray text
              point.status === "available" &&
                "bg-card border-2 text-foreground hover:bg-background/20" // Gray bg, dark text
            )}
          >
            <span>{point.name}</span>
            <Icon
              name={getIconForStatus(point.status)}
              className={cn(point.status === "hidden" && "text-foreground/50")}
            />
          </Button>
        ))}
      </section>
    </div>
  );
}
