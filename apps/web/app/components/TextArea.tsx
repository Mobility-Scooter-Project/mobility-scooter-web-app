import * as React from "react";
import { cn } from "~/lib/utils";

export function TextArea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const rafId = React.useRef<number | null>(null);

  const fit = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      // account for border-box so borders aren’t clipped
      const borderOffset = el.offsetHeight - el.clientHeight;
      el.style.height = "auto"; // allow shrink on rewrap
      el.style.overflowY = "hidden"; // avoid flicker during measure
      el.style.height = `${el.scrollHeight + borderOffset}px`;
    });
  }, []);

  // Initial measure + on input + when width changes
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    fit();

    const onInput = () => fit();
    el.addEventListener("input", onInput);

    // Re-measure when the element’s box changes (e.g., parent Resizable changes width)
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);

    // In case fonts load after mount and change metrics
    if (document.fonts && "ready" in document.fonts) {
      (document.fonts as any).ready?.then(() => fit()).catch(() => {});
    }

    return () => {
      el.removeEventListener("input", onInput);
      ro.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [fit]);

  React.useEffect(() => {
    fit();
  }, [props.value, props.placeholder, fit]);

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
