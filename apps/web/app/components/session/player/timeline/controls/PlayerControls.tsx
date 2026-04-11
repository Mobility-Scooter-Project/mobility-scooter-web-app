import { useMemo } from "react";

import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { PlayerVolume } from "./PlayerVolume";
import { formatDuration } from "~/lib/formatters";
import { useChapterStore } from "~/stores/useChapterStore";
import { usePanelStore } from "~/stores/usePanelStore";
import { useSelectionStore } from "~/stores/useSelectionStore";
import { useVideoStore } from "~/stores/useVideoStore";

export function PlayerControls() {
  const isPlaying = useVideoStore((state) => state.isPlaying);
  const currentTime = useVideoStore((state) => state.currentTime);
  const duration = useVideoStore((state) => state.duration);
  const { setIsPlaying } = useVideoStore((state) => state.actions);

  const chapters = useChapterStore((state) => state.chapters);
  const setActiveTab = usePanelStore((state) => state.setActiveTab);
  const setSelection = useSelectionStore((state) => state.actions.setSelection);

  const currentChapter = useMemo(() => {
    if (!chapters.length) return null;

    return (
      [...chapters]
        .sort((a, b) => a.timestamp - b.timestamp)
        .reverse()
        .find((chapter) => currentTime >= chapter.timestamp) ?? null
    );
  }, [chapters, currentTime]);

  const handleChapterClick = () => {
    if (!currentChapter) return;
    setSelection("chapter", currentChapter.id);
    setActiveTab("chapters");
  };

  const handleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4.5 text-base text-foreground">
      <div className="flex items-center gap-3">
        <Button size="icon" onClick={() => setIsPlaying(!isPlaying)}>
          <Icon name={isPlaying ? "Pause" : "Play"} />
        </Button>

        <PlayerVolume />

        <span className="tabular-nums">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>

        {currentChapter && (
          <>
            <span>•</span>
            <Button
              variant={null}
              onClick={handleChapterClick}
              className="hover:opacity-80 -ml-3"
            >
              <span className="truncate">{currentChapter.title}</span>
              <Icon name="ChevronRight" />
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Icon name="Settings" />
        </Button>

        <Button variant="ghost" size="icon" onClick={handleFullscreen}>
          <Icon name="Maximize" />
        </Button>
      </div>
    </div>
  );
}
