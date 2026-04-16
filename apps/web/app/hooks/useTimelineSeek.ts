import { useEffect, useState, type RefObject } from "react";
import { useVideoStore } from "~/stores/useVideoStore";

export function useTimelineSeek(
  containerRef: RefObject<HTMLElement | null>,
  duration: number,
) {
  const setCurrentTime = useVideoStore((state) => state.actions.setCurrentTime);
  const seekTo = useVideoStore((state) => state.actions.seekTo);
  const [isDragging, setIsDragging] = useState(false);
  const safeDuration = duration > 0 ? duration : 1;

  const calculateTime = (clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * safeDuration;
  };

  const previewSeek = (clientX: number) => {
    setCurrentTime(calculateTime(clientX));
  };

  const commitSeek = (clientX: number) => {
    seekTo(calculateTime(clientX));
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (event: MouseEvent) => {
      event.preventDefault();
      previewSeek(event.clientX);
    };

    const onUp = (event: MouseEvent) => {
      commitSeek(event.clientX);
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
  }, [isDragging]);

  return {
    isDragging,
    startSeek: (event: React.MouseEvent) => {
      previewSeek(event.clientX);
      setIsDragging(true);
    },
  };
}