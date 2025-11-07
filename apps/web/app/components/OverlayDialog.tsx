"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "~/lib/utils";

type OverlayDialogProps = {
  open: boolean;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  containerClassName?: string;
  backdropClassName?: string;
  contentClassName?: string;
  children?: React.ReactNode;
};

export function OverlayDialog({
  open,
  onClose,
  closeOnBackdrop = true,
  closeOnEsc = true,
  containerClassName,
  backdropClassName,
  contentClassName,
  children,
}: OverlayDialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay
          className={cn("fixed inset-0 bg-black/65", backdropClassName)}
        />

        {/* Full-screen centering layer (NOT Content) */}
        <div
          className={cn(
            "fixed inset-0 z-1000 grid place-items-center",
            containerClassName
          )}
        >
          {/* Content = the actual panel/card only */}
          <DialogPrimitive.Content
            className={cn("relative outline-none", contentClassName)}
            onEscapeKeyDown={(e) => {
              if (!closeOnEsc) e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              if (!closeOnBackdrop) e.preventDefault();
            }}
          >
            {children}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
