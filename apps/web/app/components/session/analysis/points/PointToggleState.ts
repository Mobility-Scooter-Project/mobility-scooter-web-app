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
        cardClassName: "border-transparent",
        labelClassName: "",
        actionClassName: "",
      };

    case "hidden":
      return {
        isSelectable: true,
        actionLabel: `Show point ${pointName}`,
        iconName: "EyeOff",
        cardClassName: "border-transparent text-foreground/50",
        labelClassName: "",
        actionClassName: "text-foreground hover:bg-accent/50",
      };

    case "inactive":
    default:
      return {
        isSelectable: false,
        actionLabel: `Enable point ${pointName}`,
        iconName: "Plus",
        cardClassName: "cursor-not-allowed bg-transparent border-2 border-foreground/25",
        labelClassName: "",
        actionClassName: "",
      };
  }
}
