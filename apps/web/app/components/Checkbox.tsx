"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "~/lib/utils";

type Props = React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  children?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
};

function Checkbox({
  className,
  children,
  containerClassName,
  labelClassName,
  id,
  ...props
}: Props) {
  const generatedId = React.useId();
  const checkboxId = id ?? generatedId;
  const hasLabel = !!children;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "group inline-flex w-fit mx-4 items-start gap-3 cursor-pointer select-none",
        hasLabel && "",
        containerClassName
      )}
    >
      <div className="size-10 flex items-center shrink-0 justify-center">
        <CheckboxPrimitive.Root
          id={checkboxId}
          {...props}
          className={cn(
            "peer grid place-items-center size-6 rounded-full border-[1.5px] border-foreground cursor-pointer group-hover:shadow-sm",
            className
          )}
        >
          <CheckboxPrimitive.Indicator>
            <span className="block size-4 rounded-full bg-foreground" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
      </div>

      {hasLabel && (
        <span className={cn("text-base pt-[9px]", labelClassName)}>
          {children}
        </span>
      )}
    </label>
  );
}

export { Checkbox };
