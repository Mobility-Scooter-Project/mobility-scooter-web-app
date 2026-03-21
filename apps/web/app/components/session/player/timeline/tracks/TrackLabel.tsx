import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Icon, type IconProps } from "~/components/Icon";
import { cn } from "~/lib/utils";

const trackLabelVariants = cva(
  `absolute top-0 inline-flex h-6.5 select-none items-center justify-start rounded-full px-2 py-1
  transition-shadow duration-150
  `,
  {
    variants: {
      variant: {
        annotation: "bg-[#30A3CD]",
        warning: "bg-[#ECA855]",
        danger: "bg-[#DF2A51]",
      },
      selected: {
        true: "z-20 inset-ring-2 inset-ring-foreground/40",
        false: "z-10 hover:brightness-110",
      },
      interactive: {
        true: "cursor-grab active:cursor-grabbing",
        false: "hover:brightness-100",
      },
    },
    defaultVariants: {
      selected: false,
      interactive: false,
    },
  },
);

type TrackLabelVariant = NonNullable<
  VariantProps<typeof trackLabelVariants>["variant"]
>;

const VARIANT_ICONS: Record<TrackLabelVariant, IconProps["name"]> = {
  annotation: "MessageSquareText",
  warning: "TriangleAlert",
  danger: "TriangleAlert",
};

interface ResizeHandleProps {
  side: "left" | "right";
  onMouseDown: (event: React.MouseEvent) => void;
}

function ResizeHandle({ side, onMouseDown }: ResizeHandleProps) {
  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 z-30 w-2",
        side === "left"
          ? "left-0 cursor-w-resize rounded-l-full"
          : "right-0 cursor-e-resize rounded-r-full",
      )}
      onMouseDown={(event) => {
        event.stopPropagation();
        onMouseDown(event);
      }}
    />
  );
}

export interface TrackLabelProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  variant: TrackLabelVariant;
  selected?: boolean;
  interactive?: boolean;
  onMoveStart?: (event: React.MouseEvent) => void;
  onResizeStart?: (event: React.MouseEvent) => void;
  onResizeEnd?: (event: React.MouseEvent) => void;
}

export function TrackLabel({
  variant,
  selected = false,
  interactive = false,
  onMoveStart,
  onResizeStart,
  onResizeEnd,
  className,
  children,
  ...props
}: TrackLabelProps) {
  return (
    <div
      className={cn(
        trackLabelVariants({ variant, selected, interactive }),
        className,
      )}
      onMouseDown={onMoveStart}
      {...props}
    >
      <Icon
        name={VARIANT_ICONS[variant]}
        size="secondary"
        className="pointer-events-none text-white"
      />

      {children}

      {interactive && onResizeStart && (
        <ResizeHandle side="left" onMouseDown={onResizeStart} />
      )}

      {interactive && onResizeEnd && (
        <ResizeHandle side="right" onMouseDown={onResizeEnd} />
      )}
    </div>
  );
}