import { useVideoStore } from "~/stores/useVideoStore";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { useEffect, useRef, useState } from "react";

export function PlayerVolume() {
  const volume = useVideoStore((state) => state.volume);
  const isMuted = useVideoStore((state) => state.isMuted);
  const { setVolume, toggleMute } = useVideoStore((state) => state.actions);

  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const displayVolume = isMuted ? 0 : volume;

  useEffect(() => {
    if (!isDragging) return;

    const updateVolume = (clientX: number) => {
      const slider = sliderRef.current;
      if (!slider) return;

      const rect = slider.getBoundingClientRect();
      const nextVolume = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setVolume(nextVolume);
    };

    const handleMouseMove = (event: MouseEvent) => updateVolume(event.clientX);
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, setVolume]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextVolume = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

    setVolume(nextVolume);
    setIsDragging(true);
  };

  return (
    <div className="group flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={toggleMute}>
        <Icon name={isMuted || volume === 0 ? "VolumeX" : "Volume2"} />
      </Button>

      <div
        className={[
          "overflow-hidden transition-[width] duration-200",
          isDragging ? "w-20" : "w-0 group-hover:w-20",
        ].join(" ")}
      >
        <div
          ref={sliderRef}
          className="relative flex h-8 w-20 cursor-pointer items-center"
          onMouseDown={handleMouseDown}
        >
          <div className="h-1 w-full rounded-full bg-foreground/20" />
          <div
            className="absolute left-0 h-1 rounded-full bg-foreground"
            style={{ width: `${displayVolume * 100}%` }}
          />
          <div
            className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
            style={{ left: `${displayVolume * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}