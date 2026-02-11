import { Tabs, TabsContent } from "~/components/Tabs";
import { PanelNav } from "~/components/session/PanelNav";
import { ScrollArea } from "~/components/ScrollArea";
import { AnnotationContent } from "./annotations/AnnotationContent";
import { ChapterContent } from "./chapters/ChapterContent";
import { PointsContent } from "./points/PointsContent";
import { usePanelStore } from "~/stores/usePanelStore";
import { ANALYSIS_TABS, type AnalysisTabKey } from "~/config/session-constants";

/**
 * Right-most container for analysis tools (Chapters, Points, Annotations).
 * - Contains a tabbed interface for switching between different types of session data.
 * - Each tab displays a scrollable list of items relevant to the active view.
 */
export function AnalysisPanel() {
  const activeTab = usePanelStore((state) => state.activeTab);
  const setActiveTab = usePanelStore((state) => state.setActiveTab);

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(val) => setActiveTab(val as AnalysisTabKey)} 
      className="flex flex-col h-full py-2 gap-2"
    >
      <div className="px-4">
        <PanelNav tabs={[...ANALYSIS_TABS]} />
      </div>

      {ANALYSIS_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="overflow-hidden">
          <ScrollArea className="h-full">
            <div className="h-full px-4">
              {tab.value === "chapters" && <ChapterContent />}
              {tab.value === "points" && <PointsContent />}
              {tab.value === "annotations" && <AnnotationContent />}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}