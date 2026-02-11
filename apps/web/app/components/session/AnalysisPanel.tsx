import { Tabs, TabsContent } from "~/components/Tabs";
import { PanelNav } from "~/components/session/PanelNav";
import { ScrollArea } from "~/components/ScrollArea";
import { AnnotationContent } from "./annotations/AnnotationContent";
import { ChapterContent } from "./chapters/ChapterContent";
import { PointsContent } from "./points/PointsContent";
import { usePanelStore } from "~/stores/usePanelStore";
import { cn } from "~/lib/utils";

const panelTabs = [
  { value: "chapters", label: "Chapters" },
  { value: "points", label: "Points" },
  { value: "annotations", label: "Annotations" },
];

export function AnalysisPanel() {
  const activeTab = usePanelStore((state) => state.activeTab);
  const setActiveTab = usePanelStore((state) => state.setActiveTab);

  // Symmetric padding to center content while keeping scrollbar at edge
  const contentClass = "h-full px-4";

  return (
    // Removed p-2 from root
    <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="flex flex-col h-full py-2 gap-2">
      <div className="px-4">
        <PanelNav tabs={panelTabs} />
      </div>

      <TabsContent value="chapters" className="overflow-hidden">
        <ScrollArea className="h-full">
            <div className={contentClass}>
                <ChapterContent />
            </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="points" className="overflow-hidden">
        <ScrollArea className="h-full">
            <div className={contentClass}>
                <PointsContent />
            </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="annotations" className="overflow-hidden">
        <ScrollArea className="h-full">
            <div className={contentClass}>
                <AnnotationContent />
            </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}