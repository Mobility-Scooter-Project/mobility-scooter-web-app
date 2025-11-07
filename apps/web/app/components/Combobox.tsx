"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/Popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/Command";

/* ---------------- helpers ---------------- */

type KeyFn<T> = (item: T) => React.Key;
type StrFn<T> = (item: T) => string;

function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue?: T;
  onChange?: (v: T) => void;
}) {
  const [internal, setInternal] = React.useState<T | undefined>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : (internal as T);

  const set = React.useCallback(
    (v: T) => {
      if (!isControlled) setInternal(v);
      onChange?.(v);
    },
    [isControlled, onChange]
  );

  return [current, set] as const;
}

/* ---------------- props ---------------- */

export type ComboboxProps<T> = {
  /** Data to render */
  items: T[];

  /** Selection (single) */
  value?: T | null;
  defaultValue?: T | null;
  onChange?: (next: T | null) => void;

  /** Open state (optional controlled) */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  /** Extractors (defaults assume { value, label }) */
  getKey?: KeyFn<T>;
  getValue?: StrFn<T>; // canonical value used for equality
  getLabel?: StrFn<T>; // text shown for each item
  getSearchText?: StrFn<T>; // text Command filters on

  /** Copy / behavior */
  searchPlaceholder?: string;
  emptyText?: string;

  /** Custom item renderer (else label + checkmark) */
  renderItem?: (item: T, selected: boolean) => React.ReactNode;

  /** Class hooks for popover content & list */
  contentClassName?: string;
  listClassName?: string;

  /** Your trigger (button, input, whatever). Will be wrapped by <PopoverTrigger asChild>. */
  children: React.ReactNode;
};

/* ---------------- component ---------------- */

export function Combobox<T>({
  items,
  value,
  defaultValue = null,
  onChange,

  open,
  defaultOpen,
  onOpenChange,

  getKey = (i: any) => (i?.id ?? i?.value ?? JSON.stringify(i)) as React.Key,
  getValue = (i: any) => (i?.value ?? String(getKey(i))) as string,
  getLabel = (i: any) => (i?.label ?? getValue(i)) as string,
  getSearchText,

  searchPlaceholder = "Search…",
  emptyText = "No results.",
  renderItem,

  contentClassName,
  listClassName,

  children,
}: ComboboxProps<T>) {
  // selection (T | null)
  const [selected, setSelected] = useControllableState<T | null>({
    value: value ?? null,
    defaultValue,
    onChange,
  });

  // open state (boolean)
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });

  const selectedVal = selected ? getValue(selected) : "";

  const searchOf =
    getSearchText ??
    ((i: T) => {
      const v = getValue(i);
      const l = getLabel(i);
      return v === l ? v : `${l} ${v}`;
    });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent className={cn("p-0", contentClassName)}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className={listClassName}>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const key = getKey(item);
                const val = getValue(item);
                const label = getLabel(item);
                const isSelected = selectedVal === val;

                return (
                  <CommandItem
                    key={key}
                    // Command filters by this string
                    value={searchOf(item)}
                    onSelect={() => {
                      const next = isSelected ? null : item;
                      setSelected(next);
                      setIsOpen(false);
                    }}
                  >
                    {renderItem ? (
                      renderItem(item, isSelected)
                    ) : (
                      <>
                        {label}
                        <Check
                          className={cn(
                            "ml-auto",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
