import { Button, buttonVariants } from "~/components/Button";
import { Icon, type IconProps } from "~/components/Icon";
import { cn } from "~/lib/utils";
import type { Point, PointStatus } from "~/data/mock-session-data";

interface PointToggleProps {
  point: Point;
  selected: boolean;
  getIconForStatus: (status: PointStatus) => IconProps["name"];
  onSelect: (id: number, status: PointStatus) => void;
  onToggle: (e: React.MouseEvent, id: number) => void;
}

export function PointToggle({
  point,
  selected,
  getIconForStatus,
  onSelect,
  onToggle,
}: PointToggleProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(point.id, point.status)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(point.id, point.status);
        }
      }}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "h-14 w-full justify-between px-4 font-semibold hover:bg-background/60 cursor-pointer",
        "transition-all duration-50",

        point.status === "visible" && "bg-background text-foreground",
        point.status === "hidden" && "bg-background text-foreground/50",
        point.status === "available" &&
          "bg-card text-foreground hover:bg-background/20", // available = exists but no (points) data

        selected
          ? "border-primary/50 border-2" // Selected style
          : point.status === "available"
          ? "border-2" // Available (but not selected) style
          : "border-transparent" // Default style
      )}
    >
      <span>{point.name}</span>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => onToggle(e, point.id)}
        className={cn(
          "rounded-full hover:bg-accent/30",
          point.status === "hidden" && "text-foreground/50"
        )}
      >
        <Icon name={getIconForStatus(point.status)} />
      </Button>
    </div>
  );
}