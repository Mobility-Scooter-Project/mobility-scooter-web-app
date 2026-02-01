import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { formatDuration } from "~/lib/formatters";
import { useVideoStore } from "~/stores/useVideoStore";
import { useChapterStore } from "~/stores/useChapterStore";
import { Timeline } from "./Timeline";
import { AnnotationTrack } from "./tracks/AnnotationTrack";
import { RiskTrack } from "./tracks/RiskTrack";
import { ChapterTrack } from "./tracks/ChapterTrack";

export function VideoControls() {
  const { isPlaying, currentTime, duration } = useVideoStore();
  const { setIsPlaying } = useVideoStore((state) => state.actions);
  const chapters = useChapterStore((state) => state.chapters);

  const currentChapterTitle = (() => {
    if (!chapters.length) return "";
    const match = chapters.find((ch) => {
      const [m, s] = ch.timestamp.split(":").map(Number);
      const start = m * 60 + s;
      return currentTime >= start;
    });
    return match ? match.title : chapters[0]?.title || "";
  })();

  const toggleFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="flex flex-col w-full gap-2 px-4 pb-4 pt-2 select-none">
      {/* Toolbar */}
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

      {/* Timeline Area */}
      <Timeline>
        <AnnotationTrack />
        <RiskTrack />
        <ChapterTrack />
      </Timeline>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4 text-foreground/80">
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
          <Button
            variant="ghost"
            size="inline"
            className="hover:bg-foreground/10 rounded-full"
          >
            <Icon name="Volume2" className="size-5" />
          </Button>
          <div className="flex items-center gap-3 text-sm font-medium tabular-nums">
            <span>{formatDuration(currentTime)}</span>
            <span className="text-foreground/40">/</span>
            <span>{formatDuration(duration)}</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-foreground/40 mx-2" />
          <div className="flex items-center gap-1 text-sm font-medium cursor-pointer hover:text-foreground">
            <span>{currentChapterTitle}</span>
            <Icon name="ChevronRight" className="size-4 opacity-50" />
          </div>
        </div>
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
  );
}
