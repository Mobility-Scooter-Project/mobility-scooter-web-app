import * as React from "react";
import { cn } from "~/lib/utils";

export interface AnalysisCardProps extends React.ComponentProps<"div"> {
  /** Whether the card is currently selected */
  isActive?: boolean;
}

export const AnalysisCard = React.forwardRef<HTMLDivElement, AnalysisCardProps>(
  ({ children, isActive, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col bg-background rounded-md p-4.5 gap-2",
          "transition-shadow duration-150",
          
          isActive 
            ? "ring-2 ring-inset ring-primary/60"
            : "",
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);