import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";
import React from "react";

const labelVariants = cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      form: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const wrapperVariants = cva(
  "flex flex-row h-10 w-full pl-4.5 gap-3 items-center justify-start rounded-md border-1.5 box-border",
  {
    variants: {
      variant: {
        default:
          "text-foreground border-accent transition-shadow focus-within:shadow-focus",
        form: "text-foreground border-accent transition-shadow focus-within:shadow-focus",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconVariants = cva(
  "h-4 w-4 flex-shrink-0 [&>svg]:h-full [&>svg]:w-full",
  {
    variants: {
      variant: {
        default: "text-foreground",
        form: "text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const inputVariants = cva(
  "c-input h-full w-full flex-1 cursor-text bg-transparent focus-visible:outline-none disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "text-foreground placeholder:text-foreground",
        form: "text-foreground placeholder:text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TextInputProps
  extends Omit<React.ComponentProps<"input">, "children">,
    VariantProps<typeof wrapperVariants> {
  label?: string;
  children?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    { className, variant, label, children, id, rightElement, ...props },
    ref
  ) => {
    const internalId = React.useId();
    const inputId = id || internalId;

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Optional Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={"text-label " + cn(labelVariants({ variant }))}
          >
            {label}
          </label>
        )}

        {/* Wrapper */}
        <label
          htmlFor={inputId}
          className={cn(
            wrapperVariants({ variant }),
            "cursor-text",
            rightElement ? "pr-0" : "pr-4.5",
            className
          )}
        >
          {/* Left Icon */}
          {children && (
            <span className={cn(iconVariants({ variant }))}>{children}</span>
          )}

          {/* The Input Element */}
          <input
            id={inputId}
            className={"text-base " + cn(inputVariants({ variant }))}
            ref={ref}
            {...props}
          />

          {/* Right Element Slot */}
          {rightElement && <span>{rightElement}</span>}
        </label>
      </div>
    );
  }
);
TextInput.displayName = "TextInput";

export { TextInput, wrapperVariants as textInputVariants };
