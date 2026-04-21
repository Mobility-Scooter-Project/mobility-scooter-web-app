import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ProcessingNoticeProps extends ComponentProps<"p"> {}

export function ProcessingNotice({
  children,
  className,
  ...props
}: ProcessingNoticeProps) {
  return (
    <p
      role="status"
      className={cn(
        "inline-flex items-center gap-2 text-xs text-foreground",
        className,
      )}
      {...props}
    >
      <Loader2 className="size-3.5 shrink-0 animate-spin" />
      <span>{children}</span>
    </p>
  );
}
