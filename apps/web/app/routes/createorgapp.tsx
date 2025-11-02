import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { Share } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ---- Config ----
const DASH = 8; // dash length in px
const GAP = 8; // gap length in px
const STROKE = 1.5; // border thickness in px

// Build a rounded-rectangle SVG path that fits the box
function roundedRectPath(w: number, h: number, r: number, inset: number) {
  const rx = Math.max(0, Math.min(r, (w - inset * 2) / 2));
  const ry = Math.max(0, Math.min(r, (h - inset * 2) / 2));
  const x0 = inset,
    y0 = inset;
  const x1 = w - inset,
    y1 = h - inset;

  return [
    `M ${x0 + rx} ${y0}`,
    `H ${x1 - rx}`,
    `A ${rx} ${ry} 0 0 1 ${x1} ${y0 + ry}`,
    `V ${y1 - ry}`,
    `A ${rx} ${ry} 0 0 1 ${x1 - rx} ${y1}`,
    `H ${x0 + rx}`,
    `A ${rx} ${ry} 0 0 1 ${x0} ${y1 - ry}`,
    `V ${y0 + ry}`,
    `A ${rx} ${ry} 0 0 1 ${x0 + rx} ${y0}`,
    "Z",
  ].join(" ");
}

export default function CreateOrgAppPage() {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState({ w: 0, h: 0, r: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!boxRef.current) return;

    const el = boxRef.current;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const rPx = parseFloat(cs.borderTopLeftRadius || "0");
      setMetrics({
        w: Math.max(0, rect.width),
        h: Math.max(0, rect.height),
        r: Number.isFinite(rPx) ? rPx : 0,
      });
    };

    // first measure after layout settles
    const raf = requestAnimationFrame(measure);

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const inset = STROKE / 2;
  const { w, h, r } = metrics;
  const hasSize = mounted && w > 0 && h > 0; // gate by mount + size
  const d = hasSize ? roundedRectPath(w, h, r, inset) : "";

  return (
    <main className="bg-card flex my-auto p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl items-start">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">
          Create Organization Application
        </h2>
        <p className="text-base text-muted-foreground">
          Complete this form to apply for your hospital or organization
          registration. All applications are reviewed and verified before
          approval.
        </p>
      </div>

      {/* Organization Information */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Organization Information</h3>

        <TextInput
          label="Organization legal name"
          id="org-name"
          type="text"
          placeholder="e.g., Pee Pee Poo Poo Medical Center"
          variant="form"
        />

        <TextInput
          label="Organization web domain"
          id="org-domain"
          type="text"
          placeholder="e.g., peepeepoopoo.org"
          variant="form"
        />

        <TextInput
          label="Admin contact email"
          id="admin-email"
          type="email"
          placeholder="Enter email..."
          variant="form"
        />
      </div>

      {/* Upload Verification Documents */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">
          Upload Verification Documents
        </h3>

        <div className="flex w-full flex-col gap-2 cursor-pointer group">
          <p className="text-label text-foreground">
            License, credential letter, ID, or other proof of authorization.
          </p>

          {/* Precise dashed rounded border that matches computed radius */}
          <div
            ref={boxRef}
            className="relative rounded-md p-4.5 flex flex-col justify-center items-center gap-3 bg-background h-[200px] group-hover:shadow-sm"
          >
            {/* SVG overlay (below content) */}
            {hasSize && (
              <svg
                className="pointer-events-none absolute inset-0 z-0 block text-foreground"
                width={w}
                height={h}
                viewBox={`0 0 ${w} ${h}`}
                aria-hidden="true"
              >
                <path
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={STROKE}
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray={`${DASH} ${GAP}`}
                  strokeLinecap="butt"
                />
              </svg>
            )}

            {/* Content (above) */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <Share className="size-[34px] text-foreground" />
              <p className="text-label text-foreground">
                Drag and drop files here or click to upload (.pdf, .docx, .png,
                .jpg)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button asChild>
        <Link to="/verify-email">Submit Application</Link>
      </Button>
    </main>
  );
}
