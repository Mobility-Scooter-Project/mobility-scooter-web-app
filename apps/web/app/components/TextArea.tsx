import * as React from "react";
import { cn } from "~/lib/utils";

export interface TextAreaProps extends React.ComponentProps<"textarea"> {
  disableAutoResize?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    { className, onChange, value, disableAutoResize = false, ...props },
    forwardedRef,
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(
      forwardedRef,
      () => internalRef.current as HTMLTextAreaElement,
    );

    const resize = React.useCallback(() => {
      if (disableAutoResize || !internalRef.current) return;

      const el = internalRef.current;
      el.style.height = "inherit";

      const computed = window.getComputedStyle(el);
      const borderY =
        parseInt(computed.borderTopWidth) +
        parseInt(computed.borderBottomWidth);

      el.style.height = `${el.scrollHeight + borderY}px`;
    }, [disableAutoResize]);

    // Resize when the text value changes natively
    React.useLayoutEffect(() => {
      resize();
    }, [value, resize]);

    // Resize when the parent panel width changes
    React.useLayoutEffect(() => {
      const el = internalRef.current;
      if (!el || disableAutoResize) return;

      let lastWidth = el.offsetWidth;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          if (newWidth !== lastWidth) {
            lastWidth = newWidth;
            resize();
          }
        }
      });

      observer.observe(el);

      return () => {
        observer.disconnect();
      };
    }, [resize, disableAutoResize]);

    return (
      <textarea
        ref={internalRef}
        rows={1}
        value={value}
        onChange={(e) => {
          resize();
          onChange?.(e);
        }}
        className={cn(
          "w-full resize-none border-transparent bg-transparent",
          "focus:outline-none focus:ring-0",
          className,
        )}
        {...props}
      />
    );
  },
);
