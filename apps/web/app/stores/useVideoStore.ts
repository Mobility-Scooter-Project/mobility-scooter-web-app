import { create } from "zustand";

interface VideoStore {
  isPlaying: boolean;
  isVideoLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
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
    toggleMute: () => void;
  };
}

/**
 * Manages video playback state, including time, volume, play/pause,
 * transient loading/buffering, and explicit user seek requests.
 */
export const useVideoStore = create<VideoStore>((set) => ({
  isPlaying: false,
  isVideoLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
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
    setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  },
}));