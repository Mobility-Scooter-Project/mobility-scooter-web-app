import { cn } from "~/lib/utils";
import { formatTimeDigits } from "~/lib/formatters";

interface TimeInputProps {
  /** Raw digit string (e.g., "1230") */
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}

/**
 * A specialized input for editing time values. 
 * Displays formatted time (MM:SS) but handles raw digit changes.
 */
export function TimeInput({
  value,
  onChange,
  onBlur,
  onKeyDown,
  className,
}: TimeInputProps) {
  const displayValue = formatTimeDigits(value);
  // Auto-width calculation based on character length
  const widthClass = displayValue.length > 5 ? "w-[7ch]" : "w-[5ch]";

  return (
    <input
      className={cn(
        "bg-transparent border-b border-muted-foreground/30 hover:border-foreground focus:border-foreground rounded-none px-0 py-0 text-center outline-none focus:ring-0 transition-all tabular-nums text-label text-muted-foreground focus:text-foreground",
        widthClass,
        className
      )}
      value={displayValue}
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, "");
        // Limit length to prevent overflow (e.g. max 6 digits for H:MM:SS)
        if (raw.length <= 6) onChange(parseInt(raw || "0", 10).toString());
      }}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        onKeyDown?.(e);
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}