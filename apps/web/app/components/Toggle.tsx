"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const toggleVariants = cva(
  `
    inline-flex cursor-pointer items-center justify-center gap-3 transition-all
    disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none 
    [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none 
    focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-1.5
    aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
  `,
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-accent/40 data-[state=on]:bg-accent",
        outline:
          "bg-transparent border-1.5 border-accent hover:bg-accent/40 data-[state=on]:bg-accent",
      },
      size: {
        default: "h-10 rounded-md px-4 self-start",
        fill: "h-10 w-full rounded-md px-4",
        inline: "size-8 rounded-full",
        icon: "size-10 shrink-0 rounded-md",
        expand: "h-full w-full rounded-md",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
