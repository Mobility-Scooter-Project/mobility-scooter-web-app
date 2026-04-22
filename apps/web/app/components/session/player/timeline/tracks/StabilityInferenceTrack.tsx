import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getWorkerStepStatus, type WorkerLifecycleStatus } from "~/lib/video-worker-status";
import { useWorkerStatus } from "~/hooks/useWorkerSync";
import {
  stabilityService,
  type StabilityInference,
} from "~/services/stability";
import { clamp, getSafeDuration } from "./timeline-track";

interface StabilityInferenceTrackProps {
  videoId?: string;
  duration: number;
}

const STABILITY_STEP = "stability_classification";

function getSegmentColor(predictedClass: number) {
  return predictedClass === 0 ? "bg-[#22C55E]" : "bg-[#DF2A51]";
}

function getSegmentLabel(predictedClass: number) {
  return predictedClass === 0 ? "Stable" : "Unstable";
}

export function StabilityInferenceTrack({
  videoId,
  duration,
}: StabilityInferenceTrackProps) {
  const [segments, setSegments] = useState<StabilityInference[]>([]);
  const [stepStatus, setStepStatus] = useState<WorkerLifecycleStatus>("unknown");
  const previousStepStatusRef = useRef<WorkerLifecycleStatus>("unknown");

  const fetchStability = useCallback(async (activeVideoId: string) => {
    try {
      const next = await stabilityService.getAll(activeVideoId);
      setSegments(next);
    } catch (error) {
      console.error("[StabilityInferenceTrack] Failed to load inferences:", error);
      setSegments([]);
    }
  }, []);

  useEffect(() => {
    previousStepStatusRef.current = "unknown";
    setStepStatus("unknown");
    setSegments([]);

    if (!videoId) return;
  }, [fetchStability, videoId]);

  useWorkerStatus(
    videoId,
    useCallback(
      (status) => {
        if (!videoId) return;

        const nextStepStatus = getWorkerStepStatus(status, STABILITY_STEP);
        setStepStatus(nextStepStatus);
        const previousStepStatus = previousStepStatusRef.current;
        previousStepStatusRef.current = nextStepStatus;

        if (
          nextStepStatus === "completed" &&
          previousStepStatus !== "completed"
        ) {
          void fetchStability(videoId);
        }

        if (nextStepStatus === "failed") {
          setSegments([]);
        }
      },
      [fetchStability, videoId],
    ),
  );

  const safeDuration = getSafeDuration(duration);
  const trackSegments = useMemo(
    () =>
      segments
        .map((segment, index) => {
          const startPercent = clamp((segment.startTime / safeDuration) * 100, 0, 100);
          const endPercent = clamp((segment.endTime / safeDuration) * 100, 0, 100);
          const widthPercent = Math.max(0, endPercent - startPercent);
          return {
            id: `${segment.startFrame}-${segment.endFrame}-${index}`,
            left: startPercent,
            width: widthPercent,
            predictedClass: segment.predictedClass,
            confidence: segment.confidence,
            startTime: segment.startTime,
            endTime: segment.endTime,
          };
        })
        .filter((segment) => segment.width > 0),
    [safeDuration, segments],
  );

  if (!videoId) {
    return null;
  }

  if (stepStatus !== "completed" || trackSegments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-foreground/65">
        <span>Stability inference</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-[#22C55E]" />
            Stable
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-[#DF2A51]" />
            Unstable
          </span>
        </div>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-foreground/15">
        {trackSegments.map((segment) => (
          <div
            key={segment.id}
            className={`absolute top-0 h-full ${getSegmentColor(segment.predictedClass)}`}
            style={{
              left: `${segment.left}%`,
              width: `${segment.width}%`,
            }}
            title={`${getSegmentLabel(segment.predictedClass)} (${segment.startTime.toFixed(2)}s-${segment.endTime.toFixed(2)}s, confidence ${(segment.confidence * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
    </div>
  );
}
