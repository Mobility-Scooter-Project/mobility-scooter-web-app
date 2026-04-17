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

type MergeRowsOptions = {
  /** When false, merge the row(s) into cache without advancing the `since` cursor. */
  advanceCursor?: boolean;
};

type KeypointStore = {
  /** The video these keypoints belong to. */
  videoId: string | null;
  /** In-memory cache keyed by `frameIndex` for O(1) dedup / upsert. */
  cache: Map<number, KeypointRow>;
  /** Sorted frame data derived from the cache, ready for overlay consumption. */
  frames: VideoFrameData[];
  /** Highest contiguous `frameIndex` fetched through the incremental `since` API. */
  cursor: number;
  /** Timestamp covered by the contiguous `since` cursor, in seconds. */
  cursorTimestamp: number;
  /** Current pose-estimation processing status. */
  poseStatus: PoseStatus;

  actions: {
    /** Resets the store for a new video. */
    reset: (videoId: string) => void;
    /** Merges rows into cache and optionally advances the incremental `since` cursor. */
    mergeRows: (rows: KeypointRow[], options?: MergeRowsOptions) => void;
    /** Updates the pose-estimation processing status. */
    setPoseStatus: (status: PoseStatus) => void;
  };
};

function buildSortedFrames(cache: Map<number, KeypointRow>): VideoFrameData[] {
  return Array.from(cache.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((row) => ({
      timestamp: row.timestamp,
      angle: row.angle,
      keypoints: row.keypoints,
    }));
}

export const useKeypointStore = create<KeypointStore>((set, get) => ({
  videoId: null,
  cache: new Map(),
  frames: [],
  cursor: -1,
  cursorTimestamp: -1,
  poseStatus: "unknown",

  actions: {
    reset: (videoId) =>
      set({
        videoId,
        cache: new Map(),
        frames: [],
        cursor: -1,
        cursorTimestamp: -1,
        poseStatus: "unknown",
      }),

    mergeRows: (rows, options) => {
      if (rows.length === 0) return;

      const { cache, cursor, cursorTimestamp } = get();
      const next = new Map(cache);
      let nextCursor = cursor;
      let nextCursorTimestamp = cursorTimestamp;
      const shouldAdvanceCursor = options?.advanceCursor !== false;

      for (const row of rows) {
        next.set(row.frameIndex, row);
        if (shouldAdvanceCursor && row.frameIndex > nextCursor) {
          nextCursor = row.frameIndex;
          nextCursorTimestamp = row.timestamp;
        }
      }

      set({
        cache: next,
        frames: buildSortedFrames(next),
        cursor: nextCursor,
        cursorTimestamp: nextCursorTimestamp,
      });
    },

    setPoseStatus: (poseStatus) => set({ poseStatus }),
  },
}));
