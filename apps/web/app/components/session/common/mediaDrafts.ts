import type { Item } from "~/hooks/useFileUpload";

export type DraftMedia = {
  id: string;
  file: File;
  status: Item["status"];
  progress: number;
  previewUrl?: string;
  durationSec?: number;
  natural?: { w: number; h: number };
};

export type MediaDraft = {
  id: string;
  title: string;
  media: DraftMedia;
};

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

function toDraftMedia(item: Item): DraftMedia {
  return {
    id: item.id,
    file: item.file,
    status: item.status,
    progress: item.progress,
    previewUrl: item.previewUrl,
    durationSec: item.durationSec,
    natural: item.natural,
  };
}

function sameDraftMedia(previous: DraftMedia, next: DraftMedia) {
  return (
    previous.id === next.id &&
    previous.file === next.file &&
    previous.status === next.status &&
    previous.progress === next.progress &&
    previous.previewUrl === next.previewUrl &&
    previous.durationSec === next.durationSec &&
    previous.natural?.w === next.natural?.w &&
    previous.natural?.h === next.natural?.h
  );
}

export function defaultMediaTitle(fileName: string) {
  return stripFileExtension(fileName).trim();
}

export function cleanupMediaDrafts(drafts: MediaDraft[]) {
  for (const draft of drafts) {
    const previewUrl = draft.media.previewUrl;
    if (previewUrl?.startsWith("blob:")) {
      // Delay revocation so React can finish detaching any <video>/<img>
      // nodes still pointing at the blob URL during dialog close/removal.
      setTimeout(() => URL.revokeObjectURL(previewUrl), 0);
    }
  }
}

export function updateMediaDraftTitle(
  drafts: MediaDraft[],
  draftId: string,
  title: string,
) {
  let changed = false;

  const next = drafts.map((draft) => {
    if (draft.id !== draftId || draft.title === title) {
      return draft;
    }

    changed = true;
    return { ...draft, title };
  });

  return changed ? next : drafts;
}

export function removeMediaDraft(drafts: MediaDraft[], draftId: string) {
  const removed = drafts.find((draft) => draft.id === draftId);
  if (!removed) {
    return drafts;
  }

  cleanupMediaDrafts([removed]);
  return drafts.filter((draft) => draft.id !== draftId);
}

export function syncMediaDrafts(items: Item[], previous: MediaDraft[]) {
  const previousById = new Map(previous.map((draft) => [draft.id, draft]));
  const next = items.map((item) => ({
    id: item.id,
    title: previousById.get(item.id)?.title ?? defaultMediaTitle(item.file.name),
    media: toDraftMedia(item),
  }));

  if (next.length !== previous.length) {
    return next;
  }

  const unchanged = next.every((draft, index) => {
    const prev = previous[index];
    return (
      prev?.id === draft.id &&
      prev.title === draft.title &&
      sameDraftMedia(prev.media, draft.media)
    );
  });

  return unchanged ? previous : next;
}

export function areMediaDraftsReady(drafts: MediaDraft[]) {
  return (
    drafts.length > 0 &&
    drafts.every((draft) => draft.media.status === "done")
  );
}

export function areMediaDraftTitlesFilled(drafts: MediaDraft[]) {
  return (
    drafts.length > 0 &&
    drafts.every((draft) => draft.title.trim().length > 0)
  );
}
