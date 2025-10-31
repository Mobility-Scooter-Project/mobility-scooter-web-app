import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
import { Textarea } from "~/components/ui/textarea";

interface ChapterCardProps {
  thumbnailUrl: string;
  title: string;
  timestamp: string;
  author: string;
  lastUpdated: string; // currently set as a full string (e.g., "Last Updated Sep 25"), to be changed ?
  score?: number | null;
  description?: string;
  onScoreChange: (newScore: number) => void;
  onShowMenuClick: () => void;
  onTimestampClick: () => void;
}

export function ChapterCard({
  thumbnailUrl,
  title,
  timestamp,
  author,
  lastUpdated,
  score,
  description,
  onScoreChange,
  onShowMenuClick,
}: ChapterCardProps) {
  return (
    <Card className="relative bg-background flex flex-col gap-1 p-4 rounded-md shadow-sm">
      {/* settings */}
      <Button
        variant="ghost"
        size="inline"
        className="absolute top-3 right-3 text-muted-foreground hover:bg-accent/30" // currently using absolute positioning
        onClick={onShowMenuClick}
      >
        <Icon name="EllipsisVertical" />
      </Button>

      {/* thumbnail */}
      <img
        src={thumbnailUrl}
        alt={title}
        className="rounded-sm object-cover aspect-video max-w-[240px]"
      />

      {/* title */}
      <p className="text-headline font-semibold text-foreground mt-4">
        {title}
      </p>

      {/* timestamp info */}
      <section className="flex items-center gap-2 text-label text-muted-foreground">
        <div className="bg-card rounded-full px-3 py-1">{timestamp}</div>
        <span>•</span>
        <span>{author}</span>
        <span>•</span>
        <span>{lastUpdated}</span>
      </section>

      {/* score */}
      <div className="flex flex-col gap-1.5 mt-4">
        <span className="text-label text-muted-foreground">Score</span>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <Button
              key={num}
              size="inline"
              variant="outline"
              className={cn(score === num && "bg-accent hover:bg-accent")}
              onClick={() => onScoreChange(num)}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      {/* description */}
      <Textarea
        placeholder="Write here..."
        defaultValue={description}
        className="border-0 rounded-none focus-within:shadow-none p-0 placeholder:text-foreground/70 mt-2"
      />
    </Card>
  );
}
