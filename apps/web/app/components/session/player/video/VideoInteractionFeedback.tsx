import { useEffect, useState } from "react";
import { Icon } from "~/components/Icon";
import { cn } from "~/lib/utils";
import {
  useVideoStore,
  type VideoInteractionFeedback,
} from "~/stores/useVideoStore";

const FEEDBACK_HOLD_MS = 140;
const FEEDBACK_EXIT_MS = 120;

/**
 * Compact transient HUD for playback and keyboard shortcut feedback.
 */
export function VideoInteractionFeedback() {
  const feedback = useVideoStore((state) => state.interactionFeedback);
  const [activeFeedback, setActiveFeedback] =
    useState<VideoInteractionFeedback | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!feedback) return;

    setActiveFeedback(feedback);
    setIsVisible(true);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, FEEDBACK_HOLD_MS);

    const clearTimer = setTimeout(() => {
      setActiveFeedback((current) =>
        current?.id === feedback.id ? null : current,
      );
    }, FEEDBACK_HOLD_MS + FEEDBACK_EXIT_MS);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
    };
  }, [feedback]);

  if (!activeFeedback) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "inline-flex max-w-[min(18rem,70vw)] items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-white transition-all duration-300",
          isVisible ? "scale-100" : "scale-95",
        )}
      >
        {activeFeedback.icon ? (
          <Icon
            name={activeFeedback.icon}
            className="size-4.5 shrink-0"
            strokeWidth={2}
          />
        ) : null}

        <span className="font-base">
          {activeFeedback.label}
        </span>

        {activeFeedback.detail ? (
          <span className="font-base text-white tabular-nums leading-none">
            {activeFeedback.detail}
          </span>
        ) : null}
      </div>
    </div>
  );
}