import * as React from "react";
import { cn } from "~/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleInput = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    handleInput();
    el.addEventListener("input", handleInput);
    return () => el.removeEventListener("input", handleInput);
  }, []);

  return (
    <textarea
      ref={ref}
      rows={1}
      className={cn(
        "w-full rounded-md border-1.5 box-border text-foreground border-accent transition-shadow focus-within:shadow-focus",
        "resize-none overflow-hidden py-2 px-4.5 bg-transparent placeholder:text-muted-foreground focus-visible:outline-none",
        className
      )}
      {...props}
    />
  );
}
