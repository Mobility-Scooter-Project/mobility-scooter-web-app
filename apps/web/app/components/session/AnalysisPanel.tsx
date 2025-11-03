import { Tabs, TabsContent } from "~/components/ui/tabs";
import { PanelNav } from "~/components/session/PanelNav";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AnalysisContent } from "./analysis/AnalysisContent";
import { ChapterContent } from "./chapters/ChapterContent";
import { PointsContent } from "./points/PointsContent";

const panelTabs = [
  { value: "analysis", label: "Analysis" },
  { value: "chapters", label: "Chapters" },
  { value: "points", label: "Points" },
  { value: "annotations", label: "Annotations" },
  { value: "comments", label: "Comments" },
  { value: "logs", label: "Audit Logs" },
];

/**
 * Right-side panel component for displaying analysis, chapters, points, annotations, comments, and audit logs.
 * Name is probably subject to change
 */
export function AnalysisPanel() {
  return (
    <Tabs defaultValue="analysis" className="flex flex-col h-full p-2 gap-2">
      <PanelNav tabs={panelTabs} />

      <TabsContent value="analysis" className="overflow-hidden">
        <ScrollArea className="h-full">
          <AnalysisContent />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="chapters" className="overflow-hidden">
        <ScrollArea  className="h-full">
          <ChapterContent />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="points" className="overflow-hidden">
        <ScrollArea className="h-full">
          <PointsContent />
        </ScrollArea>
      </TabsContent>

    </Tabs>
  );
}
