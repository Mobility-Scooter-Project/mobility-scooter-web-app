import { useState, useEffect } from "react";
import type { VideoFrameData } from "~/types/overlay";

/**
 * Fetches a CSV file from a given URL, parses the rows, and extracts the
 * timestamp (column 5) and JSON keypoints (column 7).
 * * @param csvUrl - The path to the CSV file (e.g., "/data/videos_keypoint.csv")
 * @returns An array of parsed and chronologically sorted VideoFrameData objects.
 */
export function useCsvFrames(csvUrl?: string): VideoFrameData[] {
  const [frames, setFrames] = useState<VideoFrameData[]>([]);

  useEffect(() => {
    if (!csvUrl) {
      setFrames([]);
      return;
    }

    let isMounted = true;

    fetch(csvUrl)
      .then((res) => res.text())
      .then((csvText) => {
        const lines = csvText
          .split("\n")
          .filter((line) => line.trim().length > 0);
        const parsedFrames: VideoFrameData[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];

          const firstQuoteIdx = line.indexOf('"{');
          const lastQuoteIdx = line.lastIndexOf('}"');

          if (firstQuoteIdx !== -1 && lastQuoteIdx !== -1) {
            const metadata = line.slice(0, firstQuoteIdx).split(",");
            const timestamp = parseFloat(metadata[5]);

            const jsonStr = line
              .slice(firstQuoteIdx + 1, lastQuoteIdx + 1)
              .replace(/""/g, '"');

            try {
              const keypoints = JSON.parse(jsonStr);
              parsedFrames.push({ timestamp, keypoints });
            } catch (e) {
              console.error(`Failed to parse keypoints JSON at line ${i}`, e);
            }
          }
        }

        parsedFrames.sort((a, b) => a.timestamp - b.timestamp);

        if (isMounted) {
          setFrames(parsedFrames);
        }
      })
      .catch((err) => console.error("Failed to fetch CSV", err));

    return () => {
      isMounted = false;
    };
  }, [csvUrl]);

  return frames;
}
