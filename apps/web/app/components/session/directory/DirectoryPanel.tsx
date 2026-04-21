"use client";

import { useState } from "react";
import { Icon } from "~/components/Icon";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { useSessionStore } from "~/stores/useSessionStore";
import { SessionList } from "~/components/session/directory/SessionList";
import { NewSessionDialog } from "~/components/session/directory/NewSessionDialog";
import { formatSessionTime } from "~/lib/session-date-time";
import {
  PanelScrollArea,
  PanelSection,
  PanelSectionBody,
} from "~/components/session/common/PanelSection";

/**
 * Left panel of the Session Page
 * Displays the list of sessions and allows creating new sessions.
 */
export function DirectoryPanel() {
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const { setActiveSessionId, markAsRead } = useSessionStore(
    (state) => state.actions,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.toLowerCase();
  const filteredSessions = sessions.filter((session) => {
    const searchText = [
      session.date,
      formatSessionTime(session.time),
      session.time ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(normalizedQuery);
  });

  return (
    <PanelSection className="p-4.5">
      <TextInput
        id="search-sessions"
        placeholder="Search Here..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        children={<Icon name="Search" />}
      />

      <Button variant="ghost" onClick={() => setIsModalOpen(true)}>
        <Icon name="SquarePen" />
        <span>New Session</span>
      </Button>

      <PanelSectionBody>
        <PanelScrollArea>
          <SessionList
            sessions={filteredSessions}
            activeSessionId={activeSessionId}
            onSelect={(id, hadNotification) => {
              setActiveSessionId(id);
              if (hadNotification) markAsRead(id);
            }}
          />
        </PanelScrollArea>
      </PanelSectionBody>

      <NewSessionDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </PanelSection>
  );
}