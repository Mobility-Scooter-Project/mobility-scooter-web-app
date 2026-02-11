import { cn } from "~/lib/utils";
import { Icon } from "~/components/Icon";

interface VideoLabelProps {
  id: number;
  startTime: number;
  endTime: number;
  totalDuration: number;
  type: "annotation" | "risk" | "drawing";
  label?: string | React.ReactNode;
  color?: string;
  className?: string;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onInteractionStart?: (
    e: React.MouseEvent,
    id: number,
    action: "resize-start" | "resize-end" | "move",
  ) => void;
}

/**
 * A label component that appears on the video timeline for annotations, risks, or drawings.
 */
export function VideoLabel({
  id,
  startTime,
  endTime,
  totalDuration,
  type,
  label,
  color,
  className,
  selected,
  onClick,
  onInteractionStart,
}: VideoLabelProps) {
  const safeDuration = totalDuration > 0 ? totalDuration : 1;
  const startPercent = Math.max(0, (startTime / safeDuration) * 100);
  const endPercent = Math.min(100, (endTime / safeDuration) * 100);
  const widthPercent = Math.max(0.5, endPercent - startPercent);

  const isAnnotation = type === "annotation";
  const showHandles = isAnnotation && onInteractionStart;

  return (
    <div
      onClick={onClick}
      onMouseDown={(e) => {
        if (isAnnotation && onInteractionStart) {
          onInteractionStart(e, id, "move");
        }
      }}
      className={cn(
        "absolute flex items-center justify-start shadow-sm whitespace-nowrap group/label h-7 pl-2 min-w-8",
        isAnnotation ? "rounded-xl" : "rounded-full",
        onClick && "cursor-pointer hover:brightness-110 z-10",
        isAnnotation && "cursor-grab active:cursor-grabbing",
        selected && "ring-2 ring-white/80 z-20",
        className,
      )}
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        backgroundColor: color || undefined,
      }}
      title={typeof label === "string" ? label : undefined}
    >
      {/* Icon based on type */}
      {type === "annotation" && (
        <Icon name="MessageSquareText"/>
      )}
      {type === "drawing" && (
        <Icon name="Pencil" />
      )}
      {!isAnnotation && label && (
        <span className="text-xs font-medium text-white truncate">{label}</span>
      )}

      {/* --- Resize Handles --- */}
      {showHandles && (
        <>
          {/* Left Handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-3 cursor-w-resize z-30 rounded-l-xl"
            onMouseDown={(e) => {
              e.stopPropagation(); // Stop bubbling to move handler
              onInteractionStart(e, id, "resize-start");
            }}
          />
          {/* Right Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-3 cursor-e-resize z-30 rounded-r-xl"
            onMouseDown={(e) => {
              e.stopPropagation();
              onInteractionStart(e, id, "resize-end");
            }}
          />
        </>
      )}
    </div>
  );
}
