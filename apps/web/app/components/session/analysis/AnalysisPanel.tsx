"use client";

import {
  Tabs,
  TabsBody,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/Tabs";
import { usePanelStore } from "~/stores/usePanelStore";
import { ANALYSIS_TABS, type AnalysisTabKey } from "~/config/session-constants";

import { ChapterContent } from "./chapters/ChapterContent";
import { PointsContent } from "./points/PointsContent";
import { AnnotationContent } from "./annotations/AnnotationContent";

/**
 * Right panel of the Session Page
 * Displays analysis tools (Chapters, Points, Annotations) controlled via tabs.
 */
export function AnalysisPanel() {
  const activeTab = usePanelStore((state) => state.activeTab);
  const setActiveTab = usePanelStore((state) => state.setActiveTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => setActiveTab(val as AnalysisTabKey)}
      className="h-full gap-y-9 px-4.5 pt-4.5"
    >
      <TabsList className="flex flex-wrap justify-start gap-3">
        {ANALYSIS_TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="px-4 py-2 text-base"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsBody>
        <TabsContent value="chapters">
          <ChapterContent />
        </TabsContent>

        <TabsContent value="points">
          <PointsContent />
        </TabsContent>

        <TabsContent value="annotations">
          <AnnotationContent />
        </TabsContent>
      </TabsBody>
    </Tabs>
  );
}