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

/**
 * A row component representing a tracking point (e.g., "Left Shoulder").
 * Allows toggling visibility (eye icon) and selection state.
 */
export function PointToggle({
  point,
  selected,
  getIconForStatus,
  onSelect,
  onToggle,
}: PointToggleProps) {
  const iconName = getIconForStatus(point.status);
  const isAvailable = point.status === "available";

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
        isAvailable && "bg-card text-foreground hover:bg-background/20",
        
        selected
          ? "border-primary/50 border-2" 
          : isAvailable
          ? "border-2"
          : "border-transparent"
      )}
    >
      <span>{point.name}</span>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => onToggle(e, point.id)}
        aria-label={`Toggle visibility for ${point.name}`}
        className={cn(
          "rounded-full hover:bg-accent/30",
          point.status === "hidden" && "text-foreground/50"
        )}
      >
        <Icon name={iconName} />
      </Button>
    </div>
  );
}