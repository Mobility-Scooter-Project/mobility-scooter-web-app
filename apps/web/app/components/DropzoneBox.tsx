"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

/* dashed overlay (radius-aware) */
const DASH = 8,
  GAP = 8,
  STROKE = 1.5;
function roundedRectPath(w: number, h: number, r: number, inset: number) {
  const rx = Math.max(0, Math.min(r, (w - inset * 2) / 2));
  const ry = Math.max(0, Math.min(r, (h - inset * 2) / 2));
  const x0 = inset,
    y0 = inset,
    x1 = w - inset,
    y1 = h - inset;
  return [
    `M ${x0 + rx} ${y0}`,
    `H ${x1 - rx}`,
    `A ${rx} ${ry} 0 0 1 ${x1} ${y0 + ry}`,
    `V ${y1 - ry}`,
    `A ${rx} ${ry} 0 0 1 ${x1 - rx} ${y1}`,
    `H ${x0 + rx}`,
    `A ${rx} ${ry} 0 0 1 ${x0} ${y1 - ry}`,
    `V ${y0 + ry}`,
    `A ${rx} ${ry} 0 0 1 ${x0 + rx} ${y0}`,
    "Z",
  ].join(" ");
}

export type DropzoneBoxProps = {
  id?: string;
  size?: number; // min-height in px (full width)
  disabled?: boolean;
  className?: string;
  onPick: () => void;
  onFiles: (files: FileList) => void;
  children?: React.ReactNode;
};

export function DropzoneBox({
  id,
  size,
  disabled,
  className,
  onPick,
  onFiles,
  children,
}: DropzoneBoxProps) {
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [metrics, setMetrics] = React.useState({ w: 0, h: 0, r: 0 });

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      
      const cs = getComputedStyle(el);
      const rPx = parseFloat(cs.borderTopLeftRadius || "0");
      setMetrics({
        w,
        h,
        r: Number.isFinite(rPx) ? rPx : 0,
      });
    };
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const inset = STROKE / 2;
  const { w, h, r } = metrics;
  const hasSize = mounted && w > 0 && h > 0;
  const d = hasSize ? roundedRectPath(w, h, r, inset) : "";

  return (
    <div
      ref={boxRef}
      id={id}
      role="button"
      tabIndex={0}
      className={cn(
        "relative rounded-md p-4.5 flex w-full flex-col items-center justify-center gap-3 bg-background",
        "cursor-pointer outline-none transition-shadow group",
        disabled ? "opacity-60 cursor-default" : "hover:shadow-sm",
        dragOver && "ring-2 ring-foreground/50",
        className
      )}
      style={size !== undefined ? { minHeight: `${size}px` } : undefined}
      aria-disabled={disabled}
      onClick={() => !disabled && onPick()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (!disabled && e.dataTransfer?.files?.length)
          onFiles(e.dataTransfer.files);
      }}
    >
      {hasSize && (
        <svg
          className="pointer-events-none absolute inset-0 z-0 block text-foreground/70"
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          aria-hidden="true"
        >
          <path
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            vectorEffect="non-scaling-stroke"
            strokeDasharray={`${DASH} ${GAP}`}
            strokeLinecap="butt"
          />
        </svg>
      )}
      <div className="relative z-10 flex flex-col items-center gap-3">
        {children}
      </div>
    </div>
  );
}