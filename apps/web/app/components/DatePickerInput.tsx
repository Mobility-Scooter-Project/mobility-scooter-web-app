"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "~/components/Button";
import { Calendar } from "~/components/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/Popover";
import { TextInput } from "./TextInput";

/* ---------- helpers ---------- */

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function maskMMDDYYYY(digits: string) {
  const d = digits.slice(0, 8); // MMDDYYYY
  const mm = d.slice(0, 2);
  const dd = d.slice(2, 4);
  const yyyy = d.slice(4, 8);
  if (d.length <= 2) return mm;
  if (d.length <= 4) return `${mm}/${dd}`;
  return `${mm}/${dd}/${yyyy}`;
}

function parseMMDDYYYY(
  value: string
): { y: number; m: number; d: number } | null {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);
  return { y: yyyy, m: mm, d: dd };
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate(); // m is 1-based
}

function isValidYMD(y: number, m: number, d: number) {
  if (y < 1000 || y > 2100) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > daysInMonth(y, m)) return false;
  return true;
}

function toDateUTC(y: number, m: number, d: number) {
  // Use local Date construction so it matches Calendar usage
  return new Date(y, m - 1, d);
}

/* ---------- component ---------- */

export function DatePickerInput() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [month, setMonth] = React.useState<Date | undefined>(undefined);
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string>("");

  const commitIfCompleteAndValid = (masked: string) => {
    const parts = parseMMDDYYYY(masked);
    if (!parts) {
      setError(masked.length === 10 ? "Use MM/DD/YYYY." : "");
      return;
    }
    const { y, m, d } = parts;
    if (!isValidYMD(y, m, d)) {
      setError("That date doesn’t exist.");
      return;
    }
    const next = toDateUTC(y, m, d);
    setDate(next);
    setMonth(next);
    setError("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <TextInput
        label="Date Picker With Input"
        id="date"
        className="w-60"
        value={value}
        variant="form"
        placeholder="MM/DD/YYYY"
        inputMode="numeric"
        aria-invalid={error ? "true" : "false"}
        onChange={(e) => {
          // Keep only digits, apply mask
          const digits = onlyDigits(e.target.value);
          const masked = maskMMDDYYYY(digits);
          setValue(masked);

          // If fully typed (10 chars), validate and sync date
          if (masked.length === 10) {
            commitIfCompleteAndValid(masked);
          } else {
            // Incomplete input shouldn’t show an error
            setError("");
          }
        }}
        onBlur={() => {
          // On blur, if something is typed but not valid, show a gentle warning
          if (value.length === 0) {
            setError("");
            return;
          }
          if (value.length !== 10 || !parseMMDDYYYY(value)) {
            setError("Use MM/DD/YYYY.");
            return;
          }
          // Fully formatted—validate existence
          commitIfCompleteAndValid(value);
        }}
        onKeyDown={(e) => {
          // Arrow down opens the calendar
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        rightElement={
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="mr-2.5" asChild>
              <Button id="date-picker" variant="ghost" size="inline">
                <CalendarIcon className="size-3.5" />
                <span className="sr-only">Select date</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={date}
                captionLayout="label"
                month={month}
                onMonthChange={setMonth}
                onSelect={(d) => {
                  setDate(d);
                  setMonth(d);
                  if (d) {
                    // Always write as MM/DD/YYYY
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");
                    const yyyy = String(d.getFullYear());
                    const masked = `${mm}/${dd}/${yyyy}`;
                    setValue(masked);
                    setError("");
                  }
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        }
      />

      {/* tiny inline warning */}
      {error ? (
        <p
          className="text-destructive/90 text-[13px] leading-snug"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
