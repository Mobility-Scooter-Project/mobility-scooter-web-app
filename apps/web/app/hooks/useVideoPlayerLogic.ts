import { useCallback, useEffect, type PointerEvent, type RefObject } from "react";
import type { VideoFrameData } from "~/types/overlay";
import { useChapterStore } from "~/stores/useChapterStore";
import { useKeypointStore } from "~/stores/useKeypointStore";
import { useSessionStore } from "~/stores/useSessionStore";
import { useVideoStore } from "~/stores/useVideoStore";
import {
  VIDEO_SHORTCUT_FEEDBACK,
  VIDEO_SHORTCUT_SETTINGS,
  buildFullscreenFeedback,
  buildJumpFeedback,
  buildMuteFeedback,
  buildPlaybackRateFeedback,
  buildSeekFeedback,
  buildVolumeFeedback,
  clamp,
  getNextPlaybackRate,
  isDigitKey,
  isRepeatSensitiveShortcut,
  isShortcutActivationTarget,
  isShortcutEditingTarget,
  isSpaceKey,
  type ShortcutFeedback,
} from "~/hooks/videoPlayerShortcuts";

function getTargetElement(target: EventTarget | null): HTMLElement | null {
  return target instanceof HTMLElement ? target : null;
}

function findFrameIndex(frames: VideoFrameData[], currentTime: number): number {
  if (frames.length === 0) return -1;
  if (currentTime <= frames[0].timestamp) return 0;
  if (currentTime >= frames[frames.length - 1].timestamp) {
    return frames.length - 1;
  }

  let low = 0;
  let high = frames.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (frames[mid].timestamp <= currentTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.max(0, high);
}

function resolveFrameStepSeconds(currentTime: number): number {
  const { fallbackFrameStepSeconds } = VIDEO_SHORTCUT_SETTINGS;
  const { frames } = useKeypointStore.getState();

  if (frames.length < 2) {
    return fallbackFrameStepSeconds;
  }

  const index = findFrameIndex(frames, currentTime);
  const deltas: number[] = [];

  if (index > 0) {
    deltas.push(frames[index].timestamp - frames[index - 1].timestamp);
  }

  if (index >= 0 && index < frames.length - 1) {
    deltas.push(frames[index + 1].timestamp - frames[index].timestamp);
  }

  if (index === 0) {
    deltas.push(frames[1].timestamp - frames[0].timestamp);
  }

  const positiveDeltas = deltas.filter(
    (delta) => Number.isFinite(delta) && delta > 0,
  );

  return positiveDeltas.length > 0
    ? Math.min(...positiveDeltas)
    : fallbackFrameStepSeconds;
}

function navigateChapter(direction: -1 | 1, seekTo: (time: number) => void) {
  const { chapterEpsilonSeconds } = VIDEO_SHORTCUT_SETTINGS;
  const chapters = [...useChapterStore.getState().chapters].sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  if (chapters.length === 0) {
    return false;
  }

  const { currentTime, duration } = useVideoStore.getState();

  if (direction > 0) {
    const nextChapter = chapters.find(
      (chapter) => chapter.timestamp > currentTime + chapterEpsilonSeconds,
    );

    if (!nextChapter) {
      return false;
    }

    seekTo(Math.min(duration, nextChapter.timestamp));
    return true;
  }

  const previousChapter = [...chapters]
    .reverse()
    .find((chapter) => chapter.timestamp < currentTime - chapterEpsilonSeconds);

  const startCountsAsChapter = currentTime > chapterEpsilonSeconds;
  const targetTime = previousChapter?.timestamp ?? (startCountsAsChapter ? 0 : null);

  if (targetTime === null) {
    return false;
  }

  seekTo(targetTime);
  return true;
}

function navigateView(
  direction: -1 | 1,
  setActiveViewId: (id: string) => void,
) {
  const { sessions, activeSessionId, activeViewId } = useSessionStore.getState();
  const activeSession = sessions.find((session) => session.id === activeSessionId);

  if (!activeSession || activeSession.views.length < 2) {
    return false;
  }

  const currentIndex = activeSession.views.findIndex(
    (view) => view.id === activeViewId,
  );

  if (currentIndex < 0) {
    return false;
  }

  const nextView = activeSession.views[currentIndex + direction];
  if (!nextView) {
    return false;
  }

  setActiveViewId(nextView.id);
  return true;
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return false;
  }

  await document.documentElement.requestFullscreen();
  return true;
}

export function useVideoPlayerLogic(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const setIsPlaying = useVideoStore((state) => state.actions.setIsPlaying);
  const seekTo = useVideoStore((state) => state.actions.seekTo);
  const setVolume = useVideoStore((state) => state.actions.setVolume);
  const setPlaybackRate = useVideoStore(
    (state) => state.actions.setPlaybackRate,
  );
  const toggleMute = useVideoStore((state) => state.actions.toggleMute);
  const showInteractionFeedback = useVideoStore(
    (state) => state.actions.showInteractionFeedback,
  );
  const setActiveViewId = useSessionStore((state) => state.actions.setActiveViewId);

  const showFeedback = useCallback(
    (feedback: ShortcutFeedback) => {
      showInteractionFeedback(feedback);
    },
    [showInteractionFeedback],
  );

  const togglePlayback = useCallback(
    (isPlaying: boolean) => {
      const nextPlaying = !isPlaying;
      setIsPlaying(nextPlaying);
      showFeedback(
        nextPlaying ? VIDEO_SHORTCUT_FEEDBACK.play : VIDEO_SHORTCUT_FEEDBACK.pause,
      );
    },
    [setIsPlaying, showFeedback],
  );

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    showFeedback(VIDEO_SHORTCUT_FEEDBACK.stop);
  }, [setIsPlaying, showFeedback]);

  const seekBy = useCallback(
    (state: ReturnType<typeof useVideoStore.getState>, amount: number) => {
      const direction = amount < 0 ? "back" : "forward";
      const nextTime = clamp(state.currentTime + amount, 0, state.duration);
      seekTo(nextTime);
      showFeedback(buildSeekFeedback(direction, Math.abs(amount)));
    },
    [seekTo, showFeedback],
  );

  const jumpToPercent = useCallback(
    (state: ReturnType<typeof useVideoStore.getState>, digit: number) => {
      const ratio = digit === 0 ? 0 : digit / 10;
      seekTo(state.duration * ratio);
      showFeedback(buildJumpFeedback(digit));
    },
    [seekTo, showFeedback],
  );

  const stepFrame = useCallback(
    (state: ReturnType<typeof useVideoStore.getState>, direction: -1 | 1) => {
      const step = resolveFrameStepSeconds(state.currentTime);
      const nextTime = clamp(state.currentTime + step * direction, 0, state.duration);
      seekTo(nextTime);
    },
    [seekTo],
  );

  const changeVolume = useCallback(
    (state: ReturnType<typeof useVideoStore.getState>, delta: number) => {
      const nextVolume = clamp(state.volume + delta, 0, 1);
      setVolume(nextVolume);
      showFeedback(buildVolumeFeedback(nextVolume));
    },
    [setVolume, showFeedback],
  );

  const toggleMutedWithFeedback = useCallback(
    (state: ReturnType<typeof useVideoStore.getState>) => {
      const nextMuted = !state.isMuted;
      toggleMute();
      showFeedback(buildMuteFeedback(nextMuted, state.volume));
    },
    [toggleMute, showFeedback],
  );

  const changePlaybackRate = useCallback(
    (state: ReturnType<typeof useVideoStore.getState>, direction: -1 | 1) => {
      const nextRate = getNextPlaybackRate(state.playbackRate, direction);
      setPlaybackRate(nextRate);
      showFeedback(buildPlaybackRateFeedback(nextRate));
    },
    [setPlaybackRate, showFeedback],
  );

  const jumpToBoundary = useCallback(
    (state: ReturnType<typeof useVideoStore.getState>, boundary: "start" | "end") => {
      seekTo(boundary === "start" ? 0 : state.duration);
      showFeedback(
        boundary === "start"
          ? VIDEO_SHORTCUT_FEEDBACK.beginning
          : VIDEO_SHORTCUT_FEEDBACK.end,
      );
    },
    [seekTo, showFeedback],
  );

  const navigateChapterWithFeedback = useCallback(
    (direction: -1 | 1) => {
      if (!navigateChapter(direction, seekTo)) {
        return false;
      }

      showFeedback(
        direction < 0
          ? VIDEO_SHORTCUT_FEEDBACK.previousChapter
          : VIDEO_SHORTCUT_FEEDBACK.nextChapter,
      );
      return true;
    },
    [seekTo, showFeedback],
  );

  const navigateViewWithFeedback = useCallback(
    (direction: -1 | 1) => {
      if (!navigateView(direction, setActiveViewId)) {
        return false;
      }

      showFeedback(
        direction < 0
          ? VIDEO_SHORTCUT_FEEDBACK.previousVideo
          : VIDEO_SHORTCUT_FEEDBACK.nextVideo,
      );
      return true;
    },
    [setActiveViewId, showFeedback],
  );

  const handlePointerDownCapture = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const target = getTargetElement(event.target);
      if (isShortcutEditingTarget(target) || isShortcutActivationTarget(target)) {
        return;
      }

      containerRef.current?.focus({ preventScroll: true });
    },
    [containerRef],
  );

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || event.defaultPrevented || event.metaKey) {
        return;
      }

      const target = getTargetElement(event.target);
      if (isShortcutEditingTarget(target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const code = event.code;
      const hasPrimaryModifiers = event.altKey || event.ctrlKey;
      const hasNoPrimaryModifiers = !hasPrimaryModifiers;

      if (isShortcutActivationTarget(target) && (isSpaceKey(key) || key === "enter")) {
        return;
      }

      if (event.repeat && isRepeatSensitiveShortcut(key)) {
        return;
      }

      if (
        hasPrimaryModifiers &&
        !event.shiftKey &&
        (key === "arrowleft" || key === "arrowright")
      ) {
        if (navigateChapterWithFeedback(key === "arrowleft" ? -1 : 1)) {
          event.preventDefault();
        }
        return;
      }

      if (event.shiftKey && hasNoPrimaryModifiers && (key === "p" || key === "n")) {
        if (navigateViewWithFeedback(key === "p" ? -1 : 1)) {
          event.preventDefault();
        }
        return;
      }

      const state = useVideoStore.getState();

      if (!event.shiftKey && hasNoPrimaryModifiers && isDigitKey(key)) {
        event.preventDefault();
        jumpToPercent(state, Number(key));
        return;
      }

      if (
        hasNoPrimaryModifiers &&
        !event.shiftKey &&
        code === "Comma" &&
        !state.isPlaying
      ) {
        event.preventDefault();
        stepFrame(state, -1);
        return;
      }

      if (
        hasNoPrimaryModifiers &&
        !event.shiftKey &&
        code === "Period" &&
        !state.isPlaying
      ) {
        event.preventDefault();
        stepFrame(state, 1);
        return;
      }

      if (hasNoPrimaryModifiers && (key === "<" || key === ">")) {
        event.preventDefault();
        changePlaybackRate(state, key === "<" ? -1 : 1);
        return;
      }

      const mediaKeyActions: Partial<Record<string, () => boolean>> = {
        mediaplaypause: () => {
          togglePlayback(state.isPlaying);
          return true;
        },
        mediastop: () => {
          stopPlayback();
          return true;
        },
        mediatrackprevious: () => navigateViewWithFeedback(-1),
        mediatracknext: () => navigateViewWithFeedback(1),
      };

      const mediaKeyAction = mediaKeyActions[key];
      if (mediaKeyAction) {
        if (mediaKeyAction()) {
          event.preventDefault();
        }
        return;
      }

      if (!hasNoPrimaryModifiers || event.shiftKey) {
        return;
      }

      const plainShortcutActions: Partial<Record<string, () => void>> = {
        " ": () => togglePlayback(state.isPlaying),
        spacebar: () => togglePlayback(state.isPlaying),
        k: () => togglePlayback(state.isPlaying),
        arrowleft: () => seekBy(state, -VIDEO_SHORTCUT_SETTINGS.seekSmallSeconds),
        arrowright: () => seekBy(state, VIDEO_SHORTCUT_SETTINGS.seekSmallSeconds),
        j: () => seekBy(state, -VIDEO_SHORTCUT_SETTINGS.seekLargeSeconds),
        l: () => seekBy(state, VIDEO_SHORTCUT_SETTINGS.seekLargeSeconds),
        home: () => jumpToBoundary(state, "start"),
        end: () => jumpToBoundary(state, "end"),
        m: () => toggleMutedWithFeedback(state),
        f: () => {
          void toggleFullscreen().then((isFullscreen) => {
            showFeedback(buildFullscreenFeedback(isFullscreen));
          });
        },
        arrowup: () => changeVolume(state, VIDEO_SHORTCUT_SETTINGS.volumeStep),
        arrowdown: () => changeVolume(state, -VIDEO_SHORTCUT_SETTINGS.volumeStep),
      };

      const plainShortcutAction = plainShortcutActions[key];
      if (!plainShortcutAction) {
        return;
      }

      event.preventDefault();
      plainShortcutAction();
    },
    [
      enabled,
      changePlaybackRate,
      changeVolume,
      jumpToBoundary,
      jumpToPercent,
      navigateChapterWithFeedback,
      navigateViewWithFeedback,
      seekBy,
      showFeedback,
      stepFrame,
      stopPlayback,
      toggleMutedWithFeedback,
      togglePlayback,
    ],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [enabled, handleGlobalKeyDown]);

  return {
    handlePointerDownCapture,
  };
}