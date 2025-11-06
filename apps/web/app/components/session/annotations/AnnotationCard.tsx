import { Card } from "~/components/ui/card";
import { Button } from "~/components/Button";
import { Icon } from "~/components/ui/icon";
import { Textarea } from "~/components/ui/textarea";

interface AnnotationCardProps {
  title: string;
  timestamp: string;
  author: string;
  date: string;
  description?: string;
}

export function AnnotationCard({
  title,
  timestamp,
  author,
  date,
  description,
}: AnnotationCardProps) {
  return (
    <Card className="bg-background flex flex-col gap-1 p-4 rounded-md shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <span className="text-headline text-muted-foreground">{title}</span>
        <Button
          variant="ghost"
          size="inline"
          className="text-muted-foreground hover:bg-accent/30"
        >
          <Icon name="EllipsisVertical" />
        </Button>
      </header>

      <p className="text-label text-muted-foreground">
        {timestamp} • {author} • {date}
      </p>

      <Textarea
        placeholder={description || "Write here..."}
        defaultValue={description}
        className="border-0 rounded-none focus-within:shadow-none p-0 placeholder:text-foreground/70"
      />
    </Card>
  );
}
