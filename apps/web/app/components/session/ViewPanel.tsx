import { ScrollArea } from "@radix-ui/react-scroll-area";
import { VideoOverlay } from "~/components/session/video/VideoOverlay";

export function ViewPanel() {
  return (
    <main className="flex flex-col gap-2 h-full">
      <header>
        <span className="text-title-2 text-foreground font-semibold">
          Sick Epic POV View
        </span>
        {/* todo: tabs stuff here */}
      </header>
      <section>
        {/* todo: more tabs stuff here, but it's actually toggles */}
        <div className="h-8"/>
      </section>
      <ScrollArea className="flex-1 flex flex-col overflow-hidden">
        <VideoOverlay />
      </ScrollArea>
    </main>
  );
}
