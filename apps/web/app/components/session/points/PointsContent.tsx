import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
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
      <header className="flex justify-between my-3">
        <span className="text-subhead text-foreground pl-3">All Points</span>
        <Button variant="inline" size="inline" onClick={toggleAllVisibility}>
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
            onClick={() => handlePointSelect(point.id)}
            className={cn(
              "h-14 justify-between px-4 text-base font-semibold hover:bg-background/60",
              "transition-all duration-50",
              
              point.status === "visible" && "bg-background text-foreground",
              point.status === "hidden" && "bg-background text-foreground/50",
              point.status === "available" &&
                "bg-card border-2 text-foreground hover:bg-background/20",
              
              selectedId === point.id
                ? "border-primary/50 border-2" // Selected style
                : "border-transparent" // Default style
            )}
          >
            <span>{point.name}</span>
            
            <Button
              variant="inline"
              size="inline"
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