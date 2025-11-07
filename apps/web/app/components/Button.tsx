import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
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
        default:
          "bg-foreground text-background hover:bg-foreground/80 shadow-sm",
        secondary: "bg-background hover:bg-background/80 shadow-sm",
        ghost: "hover:bg-accent/40",
        outline: "hover:bg-accent/40 border-1.5 border-accent",
        link: "text-foreground underline-offset-1.5 hover:underline hover:opacity-60",
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

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
