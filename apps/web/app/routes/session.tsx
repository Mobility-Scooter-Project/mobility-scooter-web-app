import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Card } from "~/components/ui/card";
import { AnalysisPanel } from "~/components/session/analysis/AnalysisPanel";

export default function SessionPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex shrink-0 items-start justify-between gap-4">
        <div className="bg-card text-card-foreground flex h-10 flex-1 items-center rounded-full border p-4 text-sm">
          {/* Empty container for session details */}
        </div>

        <div className="bg-card text-card-foreground h-10 w-64 rounded-full border p-4">
          {/* Empty container for search */}
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={15}>
          <Card className="h-full">
            {/* todo */}
          </Card>
        </ResizablePanel>

        <ResizableHandle className="w-4 bg-background" />

        <ResizablePanel defaultSize={55} minSize={30}>
          <Card className="h-full">
            {/* todo */}
          </Card>
        </ResizablePanel>

        <ResizableHandle className="w-4 bg-background" />

        <ResizablePanel defaultSize={25} minSize={20}>
          <Card className="h-full">
            <AnalysisPanel />
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}