import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { formatDuration } from "~/lib/formatters";
import { cn } from "~/lib/utils";
import { useVideoStore } from "~/stores/useVideoStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { usePanelStore } from "~/stores/usePanelStore";
import { Timeline } from "./Timeline";
import { AnnotationTrack } from "./tracks/AnnotationTrack";
import { RiskTrack } from "./tracks/RiskTrack";
import { ChapterTrack } from "./tracks/ChapterTrack";

export function VideoControls() {
  const { isPlaying, currentTime, duration, volume, isMuted } = useVideoStore();
  const { setIsPlaying, setVolume, toggleMute } = useVideoStore(
    (state) => state.actions
  );

  const chapters = useChapterStore((state) => state.chapters);
  const handleChapterSelect = useChapterStore(
    (state) => state.actions.handleSelect
  );
  const setActivePanelTab = usePanelStore((state) => state.setActiveTab);

  // --- Volume Logic ---
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  const displayVolume = isMuted ? 0 : volume;

  useEffect(() => {
    if (isDraggingVolume) {
      const handleMove = (e: MouseEvent) => {
        if (volumeRef.current) {
          const rect = volumeRef.current.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          setVolume(Math.max(0, Math.min(1, pos)));
        }
      };
      const handleUp = () => setIsDraggingVolume(false);

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
    }
  }, [isDraggingVolume, setVolume]);

  // --- Chapter Logic ---
  const currentChapter = (() => {
    // Robust seconds parser for H:MM:SS or MM:SS
    const getSec = (t: string) => {
      const p = t.split(":").map(Number);
      if (p.length === 3) return p[0]*3600 + p[1]*60 + p[2];
      return p[0]*60 + p[1];
    };

    const sorted = [...chapters].sort((a, b) => getSec(a.timestamp) - getSec(b.timestamp));

    // Find the *last* chapter that started before currentTime
    const match = sorted.reverse().find((ch) => currentTime >= getSec(ch.timestamp));

    return match || null;
  })();

  const toggleFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return "VolumeX";
    if (volume < 0.5) return "Volume1";
    return "Volume2";
  };

  return (
    <div className="flex flex-col w-full gap-2 px-4 pb-4 pt-2 select-none">
      {/* Top Toolbar */}
      <div className="flex items-center gap-4 text-foreground/60 mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="bg-foreground/5 hover:bg-foreground/10 rounded-full size-9"
        >
          <Icon name="Pencil" className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8">
          <Icon name="Eraser" className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8">
          <Icon name="MessageSquare" className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8">
          <Icon name="StickyNote" className="size-4" />
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Icon name="Undo2" className="size-4 mr-2" />
          <Icon name="Redo2" className="size-4 mr-4" />
          {/* Colors */}
          <div className="size-3 rounded-full bg-black ring-1 ring-offset-2 ring-black/20" />
          <div className="size-3 rounded-full bg-red-500" />
          <div className="size-3 rounded-full bg-orange-400" />
          <div className="size-3 rounded-full bg-yellow-400" />
          <div className="size-3 rounded-full bg-green-400" />
          <div className="size-3 rounded-full bg-blue-400" />
          <div className="size-3 rounded-full bg-purple-500" />
          <div className="size-3 rounded-full bg-white border border-gray-200" />
        </div>
      </div>

      {/* Combined Player Controls */}
      <div className="flex flex-col gap-1 w-full">
        <Timeline>
          <AnnotationTrack />
          <RiskTrack />
          <ChapterTrack />
        </Timeline>

        {/* Control Bar */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-foreground/80">
            {/* Play Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="size-10 rounded-full hover:bg-foreground/10"
            >
              <Icon
                name={isPlaying ? "Pause" : "Play"}
                className="size-6 fill-current"
              />
            </Button>

            {/* Volume Control */}
            <div className="group flex items-center">
              <Button
                variant="ghost"
                size="inline"
                className="hover:bg-foreground/10 rounded-full w-9 h-9 p-0"
                onClick={toggleMute}
              >
                <Icon name={getVolumeIcon()} className="size-5" />
              </Button>

              <div
                className={cn(
                  "overflow-hidden transition-[width] duration-200 ease-in-out flex items-center",
                  isDraggingVolume ? "w-24" : "w-0 group-hover:w-24"
                )}
              >
                <div
                  ref={volumeRef}
                  className="relative h-4 w-20 mx-2 cursor-pointer touch-none select-none flex items-center"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setVolume(
                      Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                    );
                    setIsDraggingVolume(true);
                  }}
                >
                  <div className="w-full h-1 bg-foreground/20 rounded-full" />
                  <div
                    className="absolute left-0 h-1 bg-foreground rounded-full"
                    style={{ width: `${displayVolume * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2 bg-foreground rounded-full shadow-sm"
                    style={{ left: `${displayVolume * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Time Display */}
            <div className="flex items-center gap-3 text-sm font-medium tabular-nums ml-2">
              <span>{formatDuration(currentTime)}</span>
              <span className="text-foreground/40">/</span>
              <span>{formatDuration(duration)}</span>
            </div>

            {/* Chapter Display: Hides completely if currentChapter is null (in a gap) */}
            {currentChapter && (
              <>
                <div className="h-1 w-1 rounded-full bg-foreground/40 mx-2" />
                <div
                  className="flex items-center gap-1 text-sm font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => {
                    handleChapterSelect(currentChapter.id);
                    setActivePanelTab("chapters");
                  }}
                >
                  <span>{currentChapter.title}</span>
                  <Icon name="ChevronRight" className="size-4 opacity-50" />
                </div>
              </>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 text-foreground/80">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-foreground/10 rounded-full"
            >
              <Icon name="Settings" className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullScreen}
              className="hover:bg-foreground/10 rounded-full"
            >
              <Icon name="Maximize" className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}