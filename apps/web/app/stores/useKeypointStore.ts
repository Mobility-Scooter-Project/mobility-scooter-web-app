import { create } from "zustand";
import type { KeypointRow } from "~/services/keypoints";
import type { VideoFrameData } from "~/types/overlay";

/** Pose-estimation processing status as tracked by the video-worker. */
export type PoseStatus =
  | "unknown"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

type KeypointStore = {
  /** The video these keypoints belong to. */
  videoId: string | null;
  /** In-memory cache keyed by `frameIndex` for O(1) dedup / upsert. */
  cache: Map<number, KeypointRow>;
  /** Sorted frame data derived from the cache, ready for overlay consumption. */
  frames: VideoFrameData[];
  /** Highest `frameIndex` received so far — used as the `since` cursor. */
  cursor: number;
  /** Current pose-estimation processing status. */
  poseStatus: PoseStatus;

  actions: {
    /**
     * Resets the store for a new video. Clears all cached data and
     * sets the cursor back to -1 (fetch from start).
     */
    reset: (videoId: string) => void;
    /**
     * Merges new keypoint rows into the cache and rebuilds the sorted
     * frame list. Advances the cursor to the highest `frameIndex` seen.
     */
    mergeRows: (rows: KeypointRow[]) => void;
    /** Updates the pose-estimation processing status. */
    setPoseStatus: (status: PoseStatus) => void;
  };
};

/** Rebuilds the sorted `VideoFrameData[]` array from the cache map. */
function buildSortedFrames(cache: Map<number, KeypointRow>): VideoFrameData[] {
  return Array.from(cache.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((row) => ({ timestamp: row.timestamp, keypoints: row.keypoints }));
}

/**
 * Manages the in-memory keypoint cache for the active video.
 *
 * Data flows in via `mergeRows` (from `since` polling or `nearest` lookups)
 * and is consumed as sorted `VideoFrameData[]` by overlay components.
 */
export const useKeypointStore = create<KeypointStore>((set, get) => ({
  videoId: null,
  cache: new Map(),
  frames: [],
  cursor: -1,
  poseStatus: "unknown",

  actions: {
    reset: (videoId) =>
      set({
        videoId,
        cache: new Map(),
        frames: [],
        cursor: -1,
        poseStatus: "unknown",
      }),

    mergeRows: (rows) => {
      if (rows.length === 0) return;

      const { cache, cursor } = get();
      const next = new Map(cache);
      let maxIndex = cursor;

      for (const row of rows) {
        next.set(row.frameIndex, row);
        if (row.frameIndex > maxIndex) maxIndex = row.frameIndex;
      }

      set({
        cache: next,
        frames: buildSortedFrames(next),
        cursor: maxIndex,
      });
    },

    setPoseStatus: (status) => set({ poseStatus: status }),
  },
}));
