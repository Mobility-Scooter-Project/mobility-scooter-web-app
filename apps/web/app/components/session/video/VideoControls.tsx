import React, { useRef, useState, useEffect } from "react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { TimelineTicks } from "./TimelineTicks";

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  formattedCurrentTime: string;
  formattedDuration: string;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

export function VideoControls({
  isPlaying,
  currentTime,
  duration,
  formattedCurrentTime,
  formattedDuration,
  onPlayPause,
  onSeek,
}: VideoControlsProps) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const calculateSeekTime = (
    e: MouseEvent | React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (timelineRef.current && duration > 0) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
      const percent = clickX / rect.width;
      return percent * duration;
    }
    return 0;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    setIsDragging(true);
    const seekTime = calculateSeekTime(e);
    onSeek(seekTime);
  };

  // dragging logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const seekTime = calculateSeekTime(e);
      onSeek(seekTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, duration, onSeek]);

  return (
    <div className="flex flex-col m-2 gap-2">
      <div
        ref={timelineRef}
        className="relative w-full cursor-pointer py-2"
        onMouseDown={handleMouseDown}
      >
        {/* Ticks */}
        <div className="relative h-4 w-full">
          {duration > 0 && <TimelineTicks duration={duration} />}
        </div>

        {/* Chips */}
        <div className="relative w-full h-48" />

        {/* Track */}
        <div className="pointer-events-none absolute h-1 w-full rounded-full bg-foreground/20">
          <div
            className="h-full rounded-full bg-foreground"
            style={{ width: `${playheadPercent}%` }}
          />
        </div>

        {/* Playhead */}
        <div
          className="pointer-events-none absolute top-2 w-px -translate-x-1/2"
          style={{
            left: `${playheadPercent}%`,
            height: `calc(100% - 0.5rem`,
          }}
        >
          <div className="h-full w-full bg-foreground/50" />
        </div>

        {/* Knob */}
        <div
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/3 rounded-full bg-foreground"
          style={{ left: `${playheadPercent}%` }}
        />
      </div>

      {/* 3. Playback Controls */}
      <div className="flex h-8 items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-2 text-foreground">
          <Button variant="ghost" size="inline" onClick={onPlayPause}>
            <Icon name={isPlaying ? "Pause" : "Play"} />
          </Button>
          <Button variant="ghost" size="inline">
            <Icon name="Volume2" />
          </Button>

          <div className="flex items-center gap-3 text-base text-foreground">
            <span>
              {formattedCurrentTime} / {formattedDuration}
            </span>
            <span className="">•</span>
            <span>Task At Hand</span>
            <Icon name="ChevronRight" size="secondary" />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="inline">
            <Icon name="Maximize" />
          </Button>
        </div>
      </div>
    </div>
  );
}
