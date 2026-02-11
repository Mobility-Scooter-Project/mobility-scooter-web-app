import { useState, useRef, useEffect } from "react";
import { TimelineTicks } from "./TimelineTicks";
import { useVideoStore } from "~/stores/useVideoStore";

interface TimelineProps {
  children: React.ReactNode;
}

export function Timeline({ children }: TimelineProps) {
  const { duration, currentTime } = useVideoStore();
  const setCurrentTime = useVideoStore((state) => state.actions.setCurrentTime);
  
  const safeDuration = duration > 0 ? duration : 1;
  const progressPercent = Math.min(100, (currentTime / safeDuration) * 100);

  // --- Interaction Logic for Ticks ---
  const tickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSeek = (clientX: number) => {
    if (!tickRef.current) return;
    const rect = tickRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setCurrentTime(ratio * safeDuration);
  };

  useEffect(() => {
    if (!isDragging) return;
    
    const onMove = (e: MouseEvent) => {
      e.preventDefault();
      handleSeek(e.clientX);
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    document.body.style.cursor = "grabbing";

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
    };
  }, [isDragging, safeDuration]);


  return (
    <div className="relative w-full select-none">
      <div className="absolute inset-0 pointer-events-none z-30">
        <div 
          className="absolute top-0 bottom-0 w-px bg-foreground -translate-x-1/2"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Ticks Container - Now Interactive */}
      <div 
        ref={tickRef}
        className="relative h-2 w-full opacity-60 mb-4 z-10 cursor-pointer"
        onMouseDown={(e) => {
          handleSeek(e.clientX);
          setIsDragging(true);
        }}
      >
        <TimelineTicks duration={safeDuration} />
      </div>
      
      <div className="relative w-full flex flex-col gap-1 z-10">
        {children}
      </div>
    </div>
  );
}