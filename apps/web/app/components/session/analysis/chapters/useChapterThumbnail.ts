import * as React from "react";
import { videoService } from "~/services/videos";

interface UseChapterThumbnailOptions {
  videoId?: string | null;
  timestamp: number;
  fallbackUrl: string;
  enabled?: boolean;
}

export function useChapterThumbnail({
  videoId,
  timestamp,
  fallbackUrl,
  enabled = true,
}: UseChapterThumbnailOptions) {
  const objectUrlRef = React.useRef<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = React.useState(fallbackUrl);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!objectUrlRef.current) {
      setThumbnailUrl(fallbackUrl);
    }
  }, [fallbackUrl]);

  React.useEffect(() => {
    if (!videoId || !enabled || !Number.isFinite(timestamp) || timestamp < 0) {
      setIsLoading(false);
      if (!objectUrlRef.current) {
        setThumbnailUrl(fallbackUrl);
      }
      return;
    }

    const abortController = new AbortController();
    setIsLoading(true);

    void videoService
      .getThumbnail(videoId, timestamp, abortController.signal)
      .then((blob) => {
        if (abortController.signal.aborted) {
          return;
        }

        const nextObjectUrl = URL.createObjectURL(blob);
        const previousObjectUrl = objectUrlRef.current;

        objectUrlRef.current = nextObjectUrl;
        setThumbnailUrl(nextObjectUrl);
        setIsLoading(false);

        if (previousObjectUrl) {
          URL.revokeObjectURL(previousObjectUrl);
        }
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        console.error("Failed to load chapter thumbnail:", error);
        setIsLoading(false);

        if (!objectUrlRef.current) {
          setThumbnailUrl(fallbackUrl);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [enabled, fallbackUrl, timestamp, videoId]);

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  return {
    thumbnailUrl,
    isLoading,
  };
}
