import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { cn } from "~/lib/utils";
import { usePoints } from "~/hooks/usePoints";

export function PointsContent() {
  const {
    points,
    allVisible,
    selectedId,
    toggleAllVisibility,
    handleVisibilityToggle,
    handlePointSelect,
    getIconForStatus
  } = usePoints();

  return (
    <div className="flex flex-col gap-3">
      {/* header */}
      <header className="flex justify-between my-3 items-center">
        <span className="text-foreground pl-3">All Points</span>
        <Button variant="ghost" onClick={toggleAllVisibility}>
          <Icon name={allVisible ? "Eye" : "EyeOff"} />
        </Button>
      </header>

      {/* points */}
      <section className="flex flex-col gap-2">
        {points.map((point) => (
          <Button
            key={point.id}
            variant="outline"
            onClick={() => handlePointSelect(point.id, point.status)}
            className={cn(
              "h-14 w-full justify-between px-4 font-semibold hover:bg-background/60",
              "transition-all duration-50",
              
              point.status === "visible" && "bg-background text-foreground",
              point.status === "hidden" && "bg-background text-foreground/50",
              point.status === "available" &&
                "bg-card text-foreground hover:bg-background/20", // available = exists but no (points) data
              
              selectedId === point.id
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
              onClick={(e) => handleVisibilityToggle(e, point.id)}
              className={cn(
                "rounded-full hover:bg-accent/30",
                point.status === "hidden" && "text-foreground/50"
              )}
            >
              <Icon
                name={getIconForStatus(point.status)}
              />
            </Button>
          </Button>
        ))}
      </section>
    </div>
  );
}