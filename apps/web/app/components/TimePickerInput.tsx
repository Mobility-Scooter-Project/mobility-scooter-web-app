"use client";

import * as React from "react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/Popover";
import { TextInput, textInputVariants } from "~/components/TextInput";
import { cn } from "~/lib/utils";
import {
  formatSessionTime,
  normalizeSessionTime,
} from "~/lib/session-date-time";

interface TimePickerInputProps {
  className?: string;
  id?: string;
  label: string;
  value?: string;
  onChange?: (time: string | undefined) => void;
}

const TIME_ERROR_MESSAGE = "Enter a valid time, like 2:30 PM or 14:30.";

function parseTimeInput(rawValue: string): string | null {
  const compactValue = rawValue
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "");

  if (!compactValue) {
    return null;
  }

  const periodMatch = compactValue.match(/(am|pm|a|p)$/);
  const period = periodMatch
    ? periodMatch[1].startsWith("p")
      ? "PM"
      : "AM"
    : null;
  const valueWithoutPeriod = periodMatch
    ? compactValue.slice(0, -periodMatch[1].length)
    : compactValue;

  if (!valueWithoutPeriod) {
    return null;
  }

  let hourPart = "";
  let minutePart = "";

  if (valueWithoutPeriod.includes(":")) {
    const parts = valueWithoutPeriod.split(":");

    if (
      parts.length !== 2 ||
      !/^\d{1,2}$/.test(parts[0]) ||
      !/^\d{1,2}$/.test(parts[1])
    ) {
      return null;
    }

    [hourPart, minutePart] = parts;
  } else {
    if (!/^\d{1,4}$/.test(valueWithoutPeriod)) {
      return null;
    }

    if (valueWithoutPeriod.length <= 2) {
      hourPart = valueWithoutPeriod;
      minutePart = "00";
    } else if (valueWithoutPeriod.length === 3) {
      hourPart = valueWithoutPeriod.slice(0, 1);
      minutePart = valueWithoutPeriod.slice(1);
    } else {
      hourPart = valueWithoutPeriod.slice(0, 2);
      minutePart = valueWithoutPeriod.slice(2);
    }
  }

  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  if (period) {
    if (hour < 1 || hour > 12) {
      return null;
    }

    const normalizedHour =
      period === "AM"
        ? hour === 12
          ? 0
          : hour
        : hour === 12
          ? 12
          : hour + 12;

    return `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const uses24HourFormat =
    valueWithoutPeriod.includes(":") ||
    valueWithoutPeriod.length === 4 ||
    hour > 12;

  if (!uses24HourFormat || hour < 0 || hour > 23) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatEditorValue(sessionTime?: string): string {
  return sessionTime ? formatSessionTime(sessionTime) : "";
}

export function TimePickerInput({
  className,
  id,
  label,
  value,
  onChange,
}: TimePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const normalizedValue = value ? normalizeSessionTime(value) : undefined;
  const [draftValue, setDraftValue] = React.useState(() =>
    formatEditorValue(normalizedValue),
  );
  const inputId = id ?? "time";

  React.useEffect(() => {
    if (!open) {
      setDraftValue(formatEditorValue(normalizedValue));
      setError("");
    }
  }, [normalizedValue, open]);

  const parsedDraftValue = parseTimeInput(draftValue);

  const commitDraft = (closeOnSuccess = false) => {
    if (!draftValue.trim()) {
      onChange?.(undefined);
      setError("");

      if (closeOnSuccess) {
        setOpen(false);
      }

      return true;
    }

    if (!parsedDraftValue) {
      setError(TIME_ERROR_MESSAGE);
      return false;
    }

    onChange?.(parsedDraftValue);
    setDraftValue(formatSessionTime(parsedDraftValue));
    setError("");

    if (closeOnSuccess) {
      setOpen(false);
    }

    return true;
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setDraftValue(formatEditorValue(normalizedValue));
          setError("");
          return;
        }

        setDraftValue(formatEditorValue(normalizedValue));
        setError("");
      }}
    >
      <div className="flex w-full flex-col gap-2">
        <label htmlFor={`${inputId}-trigger`} className="text-label text-foreground">
          {label}
        </label>

        <PopoverTrigger asChild>
          <button
            id={`${inputId}-trigger`}
            type="button"
            className={cn(
              textInputVariants({ variant: "form" }),
              "cursor-pointer pr-0 text-left focus-visible:shadow-focus",
              className,
            )}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
              }
            }}
          >
            <span
              className={cn(
                "flex-1 text-base",
                normalizedValue ? "text-foreground" : "text-accent",
              )}
            >
              {normalizedValue ? formatSessionTime(normalizedValue) : "Choose time"}
            </span>

            <span className="flex h-full items-center pr-2.5 text-accent">
              <Icon name="Clock3" className="size-3.5" />
            </span>
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent className="w-80 space-y-4" align="start" sideOffset={10}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-foreground">
              Type a time with AM/PM, or use 24-hour time.
            </p>
            <p className="text-sm text-foreground">
              {parsedDraftValue
                ? formatSessionTime(parsedDraftValue)
                : normalizedValue
                  ? formatSessionTime(normalizedValue)
                  : "No time selected"}
            </p>
          </div>

          {normalizedValue ? (
            <Button
              type="button"
              variant="link"
              size="none"
              className="text-xs text-foreground hover:text-foreground"
              onClick={() => {
                setDraftValue("");
                onChange?.(undefined);
                setError("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <TextInput
            id={`${inputId}-editor`}
            label="Time"
            value={draftValue}
            variant="form"
            placeholder="Enter time, like 2:30 PM"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(event) => {
              const nextValue = event.target.value;
              setDraftValue(nextValue);

              if (!nextValue.trim()) {
                onChange?.(undefined);
                setError("");
                return;
              }

              const parsedValue = parseTimeInput(nextValue);

              if (parsedValue) {
                onChange?.(parsedValue);
                setError("");
              } else if (error) {
                setError("");
              }
            }}
            onBlur={() => {
              if (!draftValue.trim()) {
                setError("");
                return;
              }

              if (parsedDraftValue) {
                setDraftValue(formatSessionTime(parsedDraftValue));
                setError("");
                return;
              }

              setError(TIME_ERROR_MESSAGE);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitDraft(true);
              }
            }}
          />

          <p className="text-xs text-foreground">
            Examples: 2:30 PM, 230p, or 14:30.
          </p>

          {error ? (
            <p
              className="text-[13px] leading-snug text-destructive/90"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
