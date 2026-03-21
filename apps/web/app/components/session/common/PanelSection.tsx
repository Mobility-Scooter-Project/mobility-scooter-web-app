import * as React from "react";
import { cn } from "~/lib/utils";

interface PanelSectionProps extends React.ComponentProps<"div"> {}

interface PanelSectionHeaderProps extends React.ComponentProps<"div"> {}

interface PanelSectionBodyProps extends React.ComponentProps<"div"> {}

interface PanelScrollAreaProps extends React.ComponentProps<"div"> {
  /* Adds extra bottom padding to prevent content from being hidden behind floating action buttons */
  bottomSpacing?: boolean;
}

export function PanelSection({
  className,
  ...props
}: PanelSectionProps) {
  return (
    <div
      className={cn("flex h-full flex-col gap-y-9", className)}
      {...props}
    />
  );
}

export function PanelSectionHeader({
  className,
  ...props
}: PanelSectionHeaderProps) {
  return <div className={cn("shrink-0", className)} {...props} />;
}

export function PanelSectionBody({
  className,
  ...props
}: PanelSectionBodyProps) {
  return <div className={cn("flex-1 min-h-0", className)} {...props} />;
}

export function PanelScrollArea({
  className,
  bottomSpacing = false,
  ...props
}: PanelScrollAreaProps) {
  return (
    <div
      className={cn(
        "h-full overflow-y-auto custom-scrollbar scroll-fade -mt-2 pt-3 -mr-4.5 pr-4.5",
        className,
      )}
      {...props}
    />
  );
}