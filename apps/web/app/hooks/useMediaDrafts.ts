import { useCallback, useEffect, useRef, useState } from "react";
import type { Item } from "~/hooks/useFileUpload";
import {
  cleanupMediaDrafts,
  removeMediaDraft,
  syncMediaDrafts,
  updateMediaDraftTitle,
  type MediaDraft,
} from "~/components/session/common/mediaDrafts";

export function useMediaDrafts() {
  const [uploadItems, setUploadItems] = useState<Item[]>([]);
  const [drafts, setDrafts] = useState<MediaDraft[]>([]);
  const draftsRef = useRef(drafts);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    return () => {
      cleanupMediaDrafts(draftsRef.current);
    };
  }, []);

  const syncItems = useCallback((items: Item[]) => {
    setUploadItems(items);
    setDrafts((current) => syncMediaDrafts(items, current));
  }, []);

  const updateTitle = useCallback((draftId: string, title: string) => {
    setDrafts((current) => updateMediaDraftTitle(current, draftId, title));
  }, []);

  const remove = useCallback((draftId: string) => {
    setUploadItems((current) => current.filter((item) => item.id !== draftId));
    setDrafts((current) => removeMediaDraft(current, draftId));
  }, []);

  const reset = useCallback(() => {
    cleanupMediaDrafts(draftsRef.current);
    draftsRef.current = [];
    setUploadItems([]);
    setDrafts([]);
  }, []);

  return {
    drafts,
    uploadItems,
    syncItems,
    updateTitle,
    remove,
    reset,
  };
}
