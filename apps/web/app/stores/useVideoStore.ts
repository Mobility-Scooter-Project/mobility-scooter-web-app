import { create } from "zustand";
import type { IconProps } from "~/components/Icon";

const MIN_VOLUME = 0;
const MAX_VOLUME = 1;
const MIN_PLAYBACK_RATE = 0.25;
const MAX_PLAYBACK_RATE = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export interface VideoInteractionFeedback {
  id: number;
  icon?: IconProps["name"];
  label: string;
  detail?: string;
}

interface VideoStore {
  isPlaying: boolean;
  isVideoLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  interactionFeedback: VideoInteractionFeedback | null;
  /** Monotonic id that changes only for explicit user seek actions. */
  seekRequestId: number;
  /** The target time associated with the latest explicit user seek. */
  lastSeekTime: number;

  actions: {
    setIsPlaying: (isPlaying: boolean) => void;
    setIsVideoLoading: (isLoading: boolean) => void;
    setCurrentTime: (time: number) => void;
    seekTo: (time: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    setPlaybackRate: (playbackRate: number) => void;
    toggleMute: () => void;
    showInteractionFeedback: (
      feedback: Omit<VideoInteractionFeedback, "id">,
    ) => void;
  };
}

/**
 * Manages video playback state, including time, volume, playback speed,
 * transient loading/buffering, explicit user seek requests, and shortcut feedback.
 */
export const useVideoStore = create<VideoStore>((set) => ({
  isPlaying: false,
  isVideoLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  interactionFeedback: null,
  seekRequestId: 0,
  lastSeekTime: 0,

  actions: {
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setIsVideoLoading: (isVideoLoading) => set({ isVideoLoading }),
    setCurrentTime: (currentTime) => set({ currentTime }),
    seekTo: (currentTime) =>
      set((state) => ({
        currentTime,
        lastSeekTime: currentTime,
        seekRequestId: state.seekRequestId + 1,
      })),
    setDuration: (duration) => set({ duration }),
    setVolume: (volume) => {
      const nextVolume = clamp(volume, MIN_VOLUME, MAX_VOLUME);
      set({ volume: nextVolume, isMuted: nextVolume === 0 });
    },
    setPlaybackRate: (playbackRate) =>
      set({
        playbackRate: clamp(
          playbackRate,
          MIN_PLAYBACK_RATE,
          MAX_PLAYBACK_RATE,
        ),
      }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    showInteractionFeedback: (feedback) =>
      set((state) => ({
        interactionFeedback: {
          id: (state.interactionFeedback?.id ?? 0) + 1,
          ...feedback,
        },
      })),
  },
}));