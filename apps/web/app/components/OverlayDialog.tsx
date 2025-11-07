"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "~/lib/utils";

type OverlayDialogProps = {
  open: boolean;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  backdropClassName?: string;
  contentClassName?: string;
  children?: React.ReactNode;
};

export function OverlayDialog({
  open,
  onClose,
  closeOnBackdrop = true,
  closeOnEsc = true,
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
          className={cn(
            "fixed inset-0 z-50 bg-black/65 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            backdropClassName
          )}
        />

        {/* Content (center this directly) */}
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "z-50 outline-none w-[calc(100%-2rem)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            contentClassName
          )}
          onEscapeKeyDown={(e) => {
            if (!closeOnEsc) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (!closeOnBackdrop) e.preventDefault();
          }}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
