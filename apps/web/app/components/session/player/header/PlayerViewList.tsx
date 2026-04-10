import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { Tabs, TabsList, TabsTrigger } from "~/components/Tabs";
import type { View } from "~/data/mock-session-data";
import { AddViewDialog } from "./AddViewDialog";

import { useWorkerSyncStore } from "~/hooks/useWorkerSync";
import { videoWorkerService } from "~/services/video-worker";

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
 * Isolates the loading/error state logic per tab so orphaned background 
 * tabs can recover their states after a premature page reload.
 */
function ViewTabIndicator({ view }: { view: View }) {
  const syncVideoId = useWorkerSyncStore((s) => s.videoId);
  const workerStarted = useWorkerSyncStore((s) => s.workerStarted);
  const isActive = view.videoId && view.videoId === syncVideoId;

  const [status, setStatus] = useState<{ loading: boolean; error: boolean }>({
    loading: view.uploading ?? false,
    error: view.uploadError ?? false,
  });

  useEffect(() => {
    // 1. Trust ephemeral state first (handles standard, un-reloaded uploads natively)
    if (view.uploading || view.uploadError) return;

    // 2. If it is the active view, sync with the global store to prevent redundant API polling
    if (isActive) {
      setStatus({ loading: !workerStarted, error: false });
      return;
    }

    // 3. If it's a background tab on a fresh reload, check the backend status independently
    if (!view.videoId) return;

    let mounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const checkBackendStatus = async () => {
      try {
        const res = await videoWorkerService.getStatus(view.videoId!);
        if (!mounted) return;

        // If overallStatus is null, the worker hasn't acknowledged it yet (still uploading/pending)
        const isPending = res.overallStatus === null;
        const isFailed = res.overallStatus === "failed";

        setStatus({ loading: isPending, error: isFailed });

        // Keep checking until the worker picks it up
        if (isPending) {
          if (!pollTimer) pollTimer = setInterval(checkBackendStatus, 5000);
        } else {
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
        }
      } catch (err) {
        if (mounted) setStatus({ loading: false, error: true });
      }
    };

    checkBackendStatus();

    return () => {
      mounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [view.videoId, view.uploading, view.uploadError, isActive, workerStarted]);

  if (status.error) return <AlertCircle className="size-3 shrink-0 text-destructive" />;
  if (status.loading) return <Loader2 className="size-3 shrink-0 animate-spin" />;
  return null;
}