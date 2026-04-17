import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { Tabs, TabsList, TabsTrigger } from "~/components/Tabs";
import type { View } from "~/data/mock-session-data";
import { AddViewDialog } from "./AddViewDialog";

import { useWorkerSyncStore } from "~/hooks/useWorkerSync";
import { videoWorkerService } from "~/services/video-worker";
import { hasWorkerFailure, isWorkerTerminal } from "~/lib/video-worker-status";

const INACTIVE_STATUS_POLL_MS = 15_000;

interface PlayerViewListProps {
  views: View[];
  activeViewId: string;
  onChangeView: (viewId: string) => void;
  sessionId: string | null;
}

export function PlayerViewList({
  views,
  activeViewId,
  onChangeView,
  sessionId,
}: PlayerViewListProps) {
  const [isAddViewOpen, setIsAddViewOpen] = useState(false);

  if (!sessionId) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <Tabs
          value={activeViewId}
          onValueChange={onChangeView}
          className="min-w-0 flex-1"
        >
          <TabsList className="custom-scrollbar horizontal-scroll-fade w-full flex-nowrap justify-start gap-2 overflow-x-auto rounded-none pb-2 -mb-2 mr-2">
            {views.map((view) => (
              <TabsTrigger
                key={view.id}
                value={view.id}
                title={view.label}
                className="max-w-30 shrink-0 px-4 py-2 text-base"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <ViewTabIndicator view={view} />
                  <span className="truncate">
                    {view.label || "Untitled View"}
                  </span>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Add new view"
          onClick={() => setIsAddViewOpen(true)}
        >
          <Icon name="Plus" />
        </Button>
      </div>

      <AddViewDialog
        open={isAddViewOpen}
        onOpenChange={setIsAddViewOpen}
        sessionId={sessionId}
        onViewCreated={onChangeView}
      />
    </>
  );
}

/**
 * Isolates the loading/error state logic per tab so background tabs can
 * recover their statuses after reload without hammering the worker API.
 */
function ViewTabIndicator({ view }: { view: View }) {
  const syncVideoId = useWorkerSyncStore((state) => state.videoId);
  const latestStatus = useWorkerSyncStore((state) => state.latestStatus);
  const isActive = Boolean(view.videoId && view.videoId === syncVideoId);
  const activeStatus = isActive ? latestStatus : null;

  const [status, setStatus] = useState<{ loading: boolean; error: boolean }>({
    loading: view.uploading ?? false,
    error: view.uploadError ?? false,
  });

  useEffect(() => {
    if (view.uploading || view.uploadError) {
      setStatus({
        loading: view.uploading ?? false,
        error: view.uploadError ?? false,
      });
      return;
    }

    if (isActive) {
      if (!activeStatus) {
        setStatus({ loading: !view.videoUrl, error: false });
        return;
      }

      setStatus({
        loading: !hasWorkerFailure(activeStatus) && !isWorkerTerminal(activeStatus),
        error: hasWorkerFailure(activeStatus),
      });
      return;
    }

    if (!view.videoId) {
      setStatus({ loading: false, error: false });
      return;
    }

    let mounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const ensurePolling = () => {
      if (!pollTimer) {
        pollTimer = setInterval(() => {
          void syncFromSnapshot();
        }, INACTIVE_STATUS_POLL_MS);
      }
    };

    const syncFromSnapshot = async () => {
      try {
        const snapshot = await videoWorkerService.getStatus(view.videoId!);
        if (!mounted) return;

        const isEmptySnapshot =
          snapshot.overallStatus === null && snapshot.steps.length === 0;

        if (isEmptySnapshot) {
          const loading = !view.videoUrl;
          setStatus({ loading, error: false });

          if (loading) {
            ensurePolling();
          } else {
            stopPolling();
          }
          return;
        }

        const error = hasWorkerFailure(snapshot);
        const loading = !error && !isWorkerTerminal(snapshot);

        setStatus({ loading, error });

        if (loading) {
          ensurePolling();
        } else {
          stopPolling();
        }
      } catch {
        if (!mounted) return;

        const loading = !view.videoUrl;
        setStatus({ loading, error: false });

        if (loading) {
          ensurePolling();
        } else {
          stopPolling();
        }
      }
    };

    void syncFromSnapshot();

    return () => {
      mounted = false;
      stopPolling();
    };
  }, [view.videoId, view.videoUrl, view.uploading, view.uploadError, isActive, activeStatus]);

  if (status.error) {
    return <AlertCircle className="size-3 shrink-0 text-destructive" />;
  }
  if (status.loading) {
    return <Loader2 className="size-3 shrink-0 animate-spin" />;
  }
  return null;
}