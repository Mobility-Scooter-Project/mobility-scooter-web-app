import { useState } from "react";

import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { Tabs, TabsList, TabsTrigger } from "~/components/Tabs";
import { useSessionDataSync } from "~/hooks/useSessionDataSync";

import { AddViewDialog } from "./AddViewDialog";

export function PlayerViewList() {
  const { activeSession, activeViewId, setActiveViewId } = useSessionDataSync();
  const [isAddViewOpen, setIsAddViewOpen] = useState(false);

  if (!activeSession) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* View Tabs */}
        <Tabs
          value={activeViewId}
          onValueChange={setActiveViewId}
          className="min-w-0 flex-1"
        >
          <TabsList className="custom-scrollbar horizontal-scroll-fade w-full flex-nowrap justify-start gap-2 overflow-x-auto rounded-none pb-2 -mb-2 mr-2">
            {activeSession.views.map((view) => (
              <TabsTrigger
                key={view.id}
                value={view.id}
                title={view.label}
                className="max-w-30 shrink-0 px-4 py-2 text-base"
              >
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                  {view.label || "Untitled View"}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Add View Button */}
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
        sessionId={activeSession.id}
        onViewCreated={setActiveViewId}
      />
    </>
  );
}