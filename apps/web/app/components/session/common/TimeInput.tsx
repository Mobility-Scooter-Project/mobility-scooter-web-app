import * as React from "react";
import { cn } from "~/lib/utils";
import { formatDuration } from "~/lib/formatters";

interface TimeInputProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "onChange"
> {
  valueSeconds: number;
  onChangeSeconds: (seconds: number) => void;
}

export function TimeInput({
  valueSeconds,
  onChangeSeconds,
  className,
  onBlur,
  onKeyDown,
  ...props
}: TimeInputProps) {
  const [localValue, setLocalValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setLocalValue(formatDuration(valueSeconds));
    }
  }, [valueSeconds, isFocused]);

  const applyTimeMask = (value: string) => {
    const cleaned = value.replace(/[^0-9:]/g, "");
    const segments = cleaned.split(":");

    const processedSegments = segments.map((seg, index) => {
      if (index < segments.length - 1) return seg; // colon handled
      if (index >= 2) return seg.slice(0, 2); // max 2 digits for seconds
      if (seg.length <= 2) return seg; // no need to chunk
      return seg.match(/.{1,2}/g)?.join(":") || "";
    });

    let joined = processedSegments.join(":").replace(/:{2,}/g, ":");
    let finalSegments = joined.split(":");

    if (finalSegments.length > 3) {
      const seconds = finalSegments.pop();
      const minutes = finalSegments.pop();
      const hours = finalSegments.join("");
      return `${hours}:${minutes}:${seconds}`;
    }

    return joined;
  };

  const commitChange = () => {
    const val = localValue.replace(/:$/, "");
    if (!val) {
      onChangeSeconds(0);
      return;
    }

    const parts = val.split(":").map((p) => parseInt(p || "0", 10));
    let newSeconds = valueSeconds;

    if (parts.length === 1) {
      newSeconds = parts[0];
    } else if (parts.length === 2) {
      newSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      newSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    if (isNaN(newSeconds)) newSeconds = 0;

    onChangeSeconds(newSeconds);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    commitChange();
    onBlur?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
    onKeyDown?.(e);
  };

  return (
    <input
      type="text"
      className={cn(
        "bg-card rounded-full px-2 py-0.5 text-label text-center",
        "outline-none focus:ring-0 transition-all tabular-nums box-content",
        className,
      )}
      style={{ width: `${Math.max(4, localValue.length)}ch` }}
      value={localValue}
      onChange={(e) => setLocalValue(applyTimeMask(e.target.value))}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      {...props}
    />
  );
}
