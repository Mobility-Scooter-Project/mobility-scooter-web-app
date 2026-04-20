"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleIcon,
} from "lucide-react";

import { textInputVariants } from "~/components/TextInput";
import { cn } from "~/lib/utils";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-background text-foreground rounded-md border-1.5 border-accent shadow-sm p-3 z-50",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "flex flex-col text-label",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10",
        "dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive!",
        "relative flex cursor-pointer items-start justify-start gap-2 rounded-sm px-4 py-[9px] outline-hidden select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent text-foreground relative flex cursor-pointer items-center gap-2 rounded-sm py-[9px] pr-2 pl-8 outline-hidden select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-disabled:cursor-default data-[state=checked]:cursor-default",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-[13px] items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent relative flex cursor-pointer items-center gap-2 rounded-sm py-[9px] pr-2 pl-8 outline-hidden select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-disabled:cursor-default data-[state=checked]:cursor-default",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-[13px] items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn("px-4 py-[9px] font-medium data-inset:pl-8", className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-card my-1 h-px", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("ml-auto tracking-widest", className)}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent text-foreground",
        "relative flex cursor-default items-center gap-2 rounded-sm px-4 py-[9px] outline-hidden select-none",
        "data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-background text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95",
        "data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 min-w-32",
        "origin-(--radix-context-menu-content-transform-origin) overflow-hidden",
        "rounded-md border-1.5 border-accent shadow-sm p-3 z-50 text-label",
        className
      )}
      {...props}
    />
  );
}

type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type DropdownFieldProps = {
  label: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownOption[];
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  ariaDescribedBy?: string;
  emptyText?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

function DropdownField({
  label,
  name,
  value,
  onValueChange,
  options,
  id,
  placeholder = "Select an option...",
  disabled = false,
  required = false,
  ariaDescribedBy,
  emptyText = "No options available.",
  triggerClassName,
  contentClassName,
}: DropdownFieldProps) {
  const triggerId = id ?? React.useId();
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={triggerId} className="text-label text-foreground">
        {label}
      </label>

      <input type="hidden" name={name} value={value} />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            id={triggerId}
            type="button"
            disabled={disabled}
            aria-required={required}
            aria-describedby={ariaDescribedBy}
            className={cn(
              textInputVariants({ variant: "form" }),
              "cursor-pointer justify-between gap-2 pr-4.5 text-left",
              !selectedOption && "text-accent",
              disabled && "cursor-not-allowed opacity-50",
              triggerClassName
            )}
          >
            <span className="min-w-0 flex-1 truncate text-base">
              {selectedOption?.label ?? placeholder}
            </span>
            <ChevronDownIcon className="size-4 shrink-0 text-accent" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className={cn("p-1", contentClassName)}
          style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
        >
          {options.length === 0 ? (
            <DropdownMenuItem disabled>{emptyText}</DropdownMenuItem>
          ) : (
            <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
              {options.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value || option.label}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export {
  DropdownField,
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  type DropdownOption,
};
