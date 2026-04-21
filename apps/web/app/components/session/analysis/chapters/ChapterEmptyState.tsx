import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

interface ChapterEmptyStateProps extends ComponentProps<"div"> {
  icon: ReactNode;
  title: string;
  description: string;
}

export function ChapterEmptyState({
  icon,
  title,
  description,
  className,
  ...props
}: ChapterEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-1 flex-col items-center justify-center gap-2 text-center",
        className,
      )}
      {...props}
    >
      {icon}
      <p className="text-sm text-foreground">{title}</p>
      <p className="max-w-60 text-xs text-foreground">{description}</p>
    </div>
  );
}
