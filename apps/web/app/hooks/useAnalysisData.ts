import { useState, useEffect } from "react";
import type { VideoFrameData } from "~/types/overlay";

// --- Parsers (Can be moved to a separate utils file later) ---

const parseCsvToFrames = (csvText: string): VideoFrameData[] => {
  const lines = csvText.split('\n').filter((line) => line.trim().length > 0);
  const parsedFrames: VideoFrameData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const firstQuoteIdx = line.indexOf('"{');
    const lastQuoteIdx = line.lastIndexOf('}"');

    if (firstQuoteIdx !== -1 && lastQuoteIdx !== -1) {
      const metadata = line.slice(0, firstQuoteIdx).split(',');
      const timestamp = parseFloat(metadata[5]);
      
      const jsonStr = line
        .slice(firstQuoteIdx + 1, lastQuoteIdx + 1)
        .replace(/""/g, '"');

      try {
        parsedFrames.push({ timestamp, keypoints: JSON.parse(jsonStr) });
      } catch (e) {
        console.error(`Failed to parse keypoints JSON at line ${i}`, e);
      }
    }
  }
  return parsedFrames.sort((a, b) => a.timestamp - b.timestamp);
};

// Placeholder for when you switch to JSON/API
const parseJsonToFrames = (jsonBlob: any): VideoFrameData[] => {
  // Map your future API response to the VideoFrameData[] structure here
  return jsonBlob as VideoFrameData[]; 
};

/**
 * Adapter hook that fetches and formats analysis data regardless of source type.
 */
export function useAnalysisData(dataSourceUrl?: string, type: "csv" | "json" = "csv"): VideoFrameData[] {
  const [frames, setFrames] = useState<VideoFrameData[]>([]);

  useEffect(() => {
    if (!dataSourceUrl) {
      setFrames([]);
      return;
    }

    let isMounted = true;

    // Eventually, replace this fetch with your API client (e.g., axios or React Query)
    fetch(dataSourceUrl)
      .then((res) => type === "csv" ? res.text() : res.json())
      .then((data) => {
        const parsedFrames = type === "csv" 
          ? parseCsvToFrames(data as string) 
          : parseJsonToFrames(data);

        if (isMounted) setFrames(parsedFrames);
      })
      .catch((err) => console.error(`Failed to fetch ${type} data`, err));

    return () => {
      isMounted = false;
    };
  }, [dataSourceUrl, type]);

  return frames;
}