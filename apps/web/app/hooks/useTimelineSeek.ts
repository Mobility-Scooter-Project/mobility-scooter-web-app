import { useState, useEffect, type RefObject } from "react";
import { useVideoStore } from "~/stores/useVideoStore";

export function useTimelineSeek(
  containerRef: RefObject<HTMLElement | null>,
  duration: number
) {
  const setCurrentTime = useVideoStore((state) => state.actions.setCurrentTime);
  const [isDragging, setIsDragging] = useState(false);
  const safeDuration = duration > 0 ? duration : 1;

  const calculateTime = (clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * safeDuration;
  };

  const handleSeek = (clientX: number) => {
    setCurrentTime(calculateTime(clientX));
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

  return {
    isDragging,
    startSeek: (e: React.MouseEvent) => {
      handleSeek(e.clientX);
      setIsDragging(true);
    },
  };
}