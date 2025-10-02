import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { icons } from "lucide-react";
import { cn } from "~/lib/utils";

const iconVariants = cva("inline-flex items-center justify-center", {
  variants: {
    size: {
      primary: "size-4",
      secondary: "size-[13px]",
    },
  },
  defaultVariants: {
    size: "primary",
  },
});

export interface IconProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof iconVariants> {
  name: keyof typeof icons;
}

const Icon = ({ name, className, size, ...props }: IconProps) => {
  const LucideIcon = icons[name];

  if (!LucideIcon) {
    return null;
  }

  return (
    <LucideIcon
      className={cn(iconVariants({ size, className }))}
      strokeWidth={1.5}
      {...props}
    />
  );
};

export { Icon };