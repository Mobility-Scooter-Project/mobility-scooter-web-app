import { Icon } from "~/components/Icon";
import { Button } from "~/components/Button";
import { cn } from "~/lib/utils";

interface SessionCardProps {
  /* Display date for the session (e.g. "08/15/2024") */
  date: string;
  /* Whether this session is currently active (selected) */
  isActive: boolean;
  /* Whether this session has an unread notification (e.g. new data since last viewed) */
  hasNotification: boolean;
  /* Callback when the card is clicked */
  onClick: () => void;
}

/**
 * Displays a single session in the session list with its date, active state, and notification status.
 * 
 * @param date - Display date for the session (e.g. "08/15/2024")
 * @param isActive - Whether this session is currently active (selected)
 * @param hasNotification - Whether this session has an unread notification (e.g. new data since last viewed)
 * @param onClick - Callback when the card is clicked
 * 
 * @returns 
 */
export function SessionCard({
  date,
  isActive,
  hasNotification,
  onClick,
}: SessionCardProps) {
  return (
    <Button
      variant="ghost"
      size="fill"
      className={cn(
        "flex justify-between shrink-0",
        isActive
          ? "bg-foreground/15 hover:bg-foreground/15"
          : "hover:bg-accent/40",
      )}
      aria-selected={isActive}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Icon name="FilePlay" strokeWidth={hasNotification ? 2 : 1} />
        <span
          className={cn("text-headline", !hasNotification && "font-normal")}
        >
          {date}
        </span>
      </div>

      {hasNotification && (
        <div className="h-2 w-2 rounded-full bg-foreground shrink-0" />
      )}
    </Button>
  );
}
