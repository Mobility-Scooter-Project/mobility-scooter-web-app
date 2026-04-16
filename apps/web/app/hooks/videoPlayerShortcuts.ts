import type { IconProps } from "~/components/Icon";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);
const ACTIVATION_TAGS = new Set(["BUTTON", "SUMMARY"]);
const SHORTCUT_BLOCKING_ROLES = [
  "textbox",
  "searchbox",
  "combobox",
  "listbox",
  "option",
  "menu",
  "menuitem",
  "tab",
  "tablist",
  "slider",
  "spinbutton",
  "switch",
  "checkbox",
  "radio",
  "dialog",
] as const;
const ACTIVATION_ROLES = ["button"] as const;

type ShortcutDirection = "back" | "forward";

export type ShortcutFeedback = {
  icon?: IconProps["name"];
  label: string;
  detail?: string;
};

export const VIDEO_SHORTCUT_SETTINGS = {
  seekSmallSeconds: 5,
  seekLargeSeconds: 10,
  volumeStep: 0.05,
  chapterEpsilonSeconds: 0.25,
  fallbackFrameStepSeconds: 1 / 30,
  playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const,
};

export const VIDEO_SHORTCUT_FEEDBACK = {
  play: { icon: "Play", label: "Play" },
  pause: { icon: "Pause", label: "Pause" },
  stop: { icon: "Pause", label: "Stop" },
  previousChapter: { icon: "ChevronLeft", label: "Previous chapter" },
  nextChapter: { icon: "ChevronRight", label: "Next chapter" },
  previousVideo: { icon: "ChevronLeft", label: "Previous video" },
  nextVideo: { icon: "ChevronRight", label: "Next video" },
  beginning: { label: "Beginning" },
  end: { label: "End" },
  enterFullscreen: { icon: "Maximize", label: "Full screen" },
  exitFullscreen: { icon: "Minimize", label: "Exit full screen" },
} satisfies Record<string, ShortcutFeedback>;

export const VIDEO_SEEK_FEEDBACK: Record<
  number,
  Record<ShortcutDirection, ShortcutFeedback>
> = {
  5: {
    back: { icon: "RotateCcw", label: "Back 5 seconds" },
    forward: { icon: "RotateCw", label: "Forward 5 seconds" },
  },
  10: {
    back: { icon: "RotateCcw", label: "Back 10 seconds" },
    forward: { icon: "RotateCw", label: "Forward 10 seconds" },
  },
};

function hasClosestRole(
  target: HTMLElement | null,
  roles: readonly string[],
): boolean {
  return roles.some((role) => Boolean(target?.closest(`[role='${role}']`)));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatPlaybackRate(value: number) {
  return `${Number(value.toFixed(2))}x`;
}

export function isShortcutEditingTarget(target: HTMLElement | null): boolean {
  if (!target) return false;
  if (EDITABLE_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  return hasClosestRole(target, SHORTCUT_BLOCKING_ROLES);
}

export function isShortcutActivationTarget(target: HTMLElement | null): boolean {
  if (!target) return false;
  if (ACTIVATION_TAGS.has(target.tagName)) return true;
  if (target.closest("a[href]")) return true;
  return hasClosestRole(target, ACTIVATION_ROLES);
}

export function isSpaceKey(key: string): boolean {
  return key === " " || key === "spacebar";
}

export function isDigitKey(key: string): boolean {
  return /^[0-9]$/.test(key);
}

export function isRepeatSensitiveShortcut(key: string): boolean {
  return isSpaceKey(key) || ["k", "m", "f", "n", "p", "home", "end"].includes(key);
}

export function buildJumpFeedback(digit: number): ShortcutFeedback {
  if (digit === 0) {
    return VIDEO_SHORTCUT_FEEDBACK.beginning;
  }

  return {
    label: `${digit * 10}%`,
    detail: "Jump to position",
  };
}

export function buildSeekFeedback(
  direction: ShortcutDirection,
  seconds: number,
): ShortcutFeedback {
  return (
    VIDEO_SEEK_FEEDBACK[seconds]?.[direction] ?? {
      icon: direction === "back" ? "RotateCcw" : "RotateCw",
      label: `${direction === "back" ? "Back" : "Forward"} ${seconds} seconds`,
    }
  );
}

export function buildVolumeFeedback(volume: number): ShortcutFeedback {
  return {
    icon: volume === 0 ? "VolumeX" : "Volume2",
    label: "Volume",
    detail: formatPercent(volume),
  };
}

export function buildMuteFeedback(
  isMuted: boolean,
  volume: number,
): ShortcutFeedback {
  return {
    icon: isMuted || volume === 0 ? "VolumeX" : "Volume2",
    label: isMuted ? "Mute" : "Unmute",
    detail: formatPercent(isMuted ? 0 : volume),
  };
}

export function buildPlaybackRateFeedback(rate: number): ShortcutFeedback {
  return {
    label: "Playback speed",
    detail: formatPlaybackRate(rate),
  };
}

export function buildFullscreenFeedback(
  isFullscreen: boolean,
): ShortcutFeedback {
  return isFullscreen
    ? VIDEO_SHORTCUT_FEEDBACK.enterFullscreen
    : VIDEO_SHORTCUT_FEEDBACK.exitFullscreen;
}

export function getNextPlaybackRate(
  currentRate: number,
  direction: -1 | 1,
): number {
  const { playbackRates } = VIDEO_SHORTCUT_SETTINGS;
  const exactIndex = playbackRates.findIndex(
    (rate) => Math.abs(rate - currentRate) < 0.001,
  );

  if (exactIndex >= 0) {
    return playbackRates[
      clamp(exactIndex + direction, 0, playbackRates.length - 1)
    ];
  }

  if (direction > 0) {
    return (
      playbackRates.find((rate) => rate > currentRate) ??
      playbackRates[playbackRates.length - 1]
    );
  }

  return (
    [...playbackRates].reverse().find((rate) => rate < currentRate) ??
    playbackRates[0]
  );
}