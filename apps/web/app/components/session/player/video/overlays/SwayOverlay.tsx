import type { VideoFrameData } from "~/types/overlay";

interface SwayOverlayProps {
    frames?: VideoFrameData[];
}

export function SwayOverlay({ frames }: SwayOverlayProps) {
    return (
        <div className="flex justify-center items-center h-full bg-orange-300/30 text-title-1 font-bold">
            Sway Overlay Placeholder
        </div>
    )
}