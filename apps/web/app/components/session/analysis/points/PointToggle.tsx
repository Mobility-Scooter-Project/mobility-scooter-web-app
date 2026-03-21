import { memo } from "react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { AnalysisCard } from "../../common/AnalysisCard";
import { cn } from "~/lib/utils";
import type { Point } from "~/data/mock-session-data";
import { getPointToggleState } from "./PointToggleState";

interface PointToggleProps {
  /** Point data to display. */
  data: Point;
  /** Whether the point is currently selected. */
  isSelected: boolean;
  /** Select handler for selectable points. */
  onSelect: () => void;
  /** Visibility toggle handler for visible/hidden points. */
  onToggleVisibility: (e: React.MouseEvent) => void;
  /** Enable handler for available points. */
  onEnable: (e: React.MouseEvent) => void;
}

/**
 * Displays a single point row inside the points panel.
 */
export const PointToggle = memo(function PointToggle({
  data,
  isSelected,
  onSelect,
  onToggleVisibility,
  onEnable,
}: PointToggleProps) {
  const state = getPointToggleState(data.status, data.name);
  const handleActionClick = state.isSelectable ? onToggleVisibility : onEnable;

  return (
    <AnalysisCard
      isActive={state.isSelectable && isSelected}
      onClick={state.isSelectable && !isSelected ? onSelect : undefined}
      className={cn(
        "flex flex-row items-center justify-between px-4 py-3 transition-all duration-150 text-foreground",
        state.cardClassName,
      )}
    >
      <span className={cn("text-headline", state.labelClassName)}>{data.name}</span>

      <Button
        variant="ghost"
        size="icon"
        aria-label={state.actionLabel}
        className={cn("shrink-0 rounded-full", state.actionClassName)}
        onClick={handleActionClick}
      >
        <Icon name={state.iconName} />
      </Button>
    </AnalysisCard>
  );
});