import { cn } from "~/lib/utils";
import { Icon } from "~/components/Icon";

interface VideoLabelProps {
  id: number;
  startTime: number;
  endTime: number;
  totalDuration: number;
  type: "annotation" | "risk" | "drawing";
  label?: string;
  color?: string;
  className?: string;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onInteractionStart?: (
    e: React.MouseEvent,
    id: number,
    action: "resize-start" | "resize-end" | "move"
  ) => void;
  isInteracting?: boolean;
}

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
  isInteracting,
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
      // Trigger "move" when clicking/dragging the body
      onMouseDown={(e) => {
        if (isAnnotation && onInteractionStart) {
          onInteractionStart(e, id, "move");
        }
      }}
      className={cn(
        "absolute flex items-center justify-center shadow-sm whitespace-nowrap group/label",
        isAnnotation ? "h-7 rounded-xl min-w-7 px-1" : "h-7 rounded-full px-3",

        // Removed 'active:scale-95' to fix the bad UI feel
        onClick && "cursor-pointer hover:brightness-110 z-10",
        
        // Add grab cursors for draggable annotations
        isAnnotation && "cursor-grab active:cursor-grabbing",

        selected && "ring-2 ring-white/80 scale-105 z-20",

        // Disable transitions during any interaction (move or resize)
        !isInteracting ? "transition-all duration-200" : "transition-none",

        className
      )}
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        backgroundColor: color || undefined,
      }}
      title={label}
    >
      {/* Icon based on type */}
      {type === "annotation" && (
        <Icon name="MessageSquareText" className="size-3.5 fill-current" />
      )}
      {type === "drawing" && (
        <Icon name="Pencil" className="size-3.5 fill-current" />
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