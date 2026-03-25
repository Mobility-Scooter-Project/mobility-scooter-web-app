import {
  ResizablePanelGroup,
  ResizableHandle,
  ResizablePanel,
} from "~/components/Resizable";
import { AnalysisPanel } from "~/components/session/analysis/AnalysisPanel";
import { DirectoryPanel } from "~/components/session/directory/DirectoryPanel";
import { PlayerPanel } from "~/components/session/player/PlayerPanel";
import { useSessionDataSync } from "~/hooks/useSessionDataSync";

/**
 * The main Session Route.
 *
 * Handles the three-pane layout (Sessions directory, Video Player, Analysis tools)
 * using resizable panels.
 */
export default function SessionPage() {
  useSessionDataSync();

  return (
    <div className="h-full">
      <ResizablePanelGroup>
        {/* Sessions directory (left) */}
        <ResizablePanel defaultSize="20%" minSize="15%">
          <DirectoryPanel />
        </ResizablePanel>

        <ResizableHandle />

        {/* Video Player (center) */}
        <ResizablePanel defaultSize="50%" minSize="40%">
          <PlayerPanel />
        </ResizablePanel>

        <ResizableHandle />

        {/* Analysis tools (right) */}
        <ResizablePanel defaultSize="30%" minSize="15%">
          <AnalysisPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
