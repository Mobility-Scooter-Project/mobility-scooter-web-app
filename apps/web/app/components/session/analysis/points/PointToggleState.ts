import type { IconProps } from "~/components/Icon";
import type { PointStatus } from "~/data/mock-session-data";

/**
 * Presentational state for a point card.
 * This defines the visual appearance and accessibility attributes of a point card based on its status.
 */
export interface PointToggleState {
  /** Whether the point behaves like a selectable active point. */
  isSelectable: boolean;
  /** Accessible label for the trailing action button. */
  actionLabel: string;
  /** Icon shown in the trailing action button. */
  iconName: IconProps["name"];
  /** Additional class names applied to the outer card. */
  cardClassName?: string;
  /** Additional class names applied to the point label. */
  labelClassName?: string;
  /** Additional class names applied to the trailing action button. */
  actionClassName?: string;
}

/**
 * Returns the presentational state for a point toggle based on its status.
 */
export function getPointToggleState(
  status: PointStatus,
  pointName: string,
): PointToggleState {
  switch (status) {
    case "visible":
      return {
        isSelectable: true,
        actionLabel: `Hide point ${pointName}`,
        iconName: "Eye",
        cardClassName: "border-transparent text-foreground",
        labelClassName: "font-semibold",
        actionClassName: "text-primary hover:bg-primary/10",
      };

    case "hidden":
      return {
        isSelectable: true,
        actionLabel: `Show point ${pointName}`,
        iconName: "EyeOff",
        cardClassName: "border-transparent text-foreground/80 opacity-70",
        labelClassName: "font-medium",
        actionClassName: "text-muted-foreground hover:bg-accent/50",
      };

    case "inactive":
    default:
      return {
        isSelectable: false,
        actionLabel: `Enable point ${pointName}`,
        iconName: "Plus",
        cardClassName:
          "cursor-pointer border-2 border-dashed bg-muted/30 text-muted-foreground grayscale hover:bg-muted/50",
        labelClassName: "font-semibold",
        actionClassName:
          "text-muted-foreground/80 hover:bg-accent hover:text-foreground",
      };
  }
}
