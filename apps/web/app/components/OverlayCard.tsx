// OverlayCard.tsx
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "~/lib/utils";
import { OverlayDialog } from "./OverlayDialog";
import { Button } from "./Button";
import { X } from "lucide-react";

type OverlayCardProps = React.ComponentProps<typeof OverlayDialog> & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  cardClassName?: string;
  bodyClassName?: string;
};

export function OverlayCard({
  open,
  onClose,
  closeOnBackdrop,
  closeOnEsc,
  containerClassName,
  backdropClassName,
  contentClassName,
  cardClassName,
  bodyClassName,
  title,
  subtitle,
  children,
}: OverlayCardProps) {
  return (
    <OverlayDialog
      open={open}
      onClose={onClose}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEsc={closeOnEsc}
      containerClassName={containerClassName}
      backdropClassName={backdropClassName}
      contentClassName={contentClassName}
    >
      <main
        className={cn(
          "bg-card flex flex-col pb-4.5 gap-9 rounded-lg items-start w-full shadow-sm",
          cardClassName
        )}
      >
        {/* Header */}
        {(title || subtitle || onClose) && (
          <div className="flex w-full items-start">
            <div className="flex w-full min-w-0 flex-col mt-4.5 mx-4.5 gap-2">
              {title ? (
                <DialogPrimitive.Title asChild>
                  <h3 className="text-title-2 font-semibold whitespace-normal wrap-break-word text-pretty">
                    {title}
                  </h3>
                </DialogPrimitive.Title>
              ) : (
                // Provide an accessible name even if no visible title
                <DialogPrimitive.Title className="sr-only">
                  Dialog
                </DialogPrimitive.Title>
              )}

              {subtitle ? (
                <DialogPrimitive.Description asChild>
                  <p className="text-base text-foreground/80 whitespace-normal wrap-break-word text-pretty leading-relaxed">
                    {subtitle}
                  </p>
                </DialogPrimitive.Description>
              ) : null}
            </div>

            {onClose && (
              <Button
                size="icon"
                variant="ghost"
                className="mt-4.5 mr-4.5 shrink-0 self-start"
                aria-label="Close overlay"
                onClick={() => onClose()}
              >
                <X className="size-4 text-foreground" />
              </Button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          className={cn(
            "flex flex-col w-full items-start px-4.5",
            bodyClassName
          )}
        >
          {children}
        </div>
      </main>
    </OverlayDialog>
  );
}
