// routes/terms.tsx
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { Checkbox } from "~/components/Checkbox";
import { useState } from "react";

export default function TermsPage() {
  // ---- content vars ----
  const TERMS_SUMMARY = "Terms and conditions yada yada dummy text here";
  const TERMS_AFTER = "Christmas just a week away!";
  const BULLETS = [
    "Can you believe it guys?",
    "Christmas!",
    "Just a week away!",
    "Christmas is in a week!",
    "Woohoo!",
    "I am so happy about this information.",
  ];

  // ---- state ----
  const [agreed, setAgreed] = useState(false);

  return (
    <main className="bg-card flex my-auto p-6 gap-6 flex-col rounded-lg w-full max-w-3xl items-start">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-title-2 font-semibold">Terms & Conditions</h2>
        <p className="text-base">
          Please review and agree to the terms and conditions for your account.
          These outline your responsibilities as a member and the platform's
          data policies.
        </p>
      </div>

      {/* Agreement Summary Section */}
      <div className="flex w-full flex-col gap-3 justify-start text-base">
        <h3 className="font-semibold">Agreement Summary</h3>

        {/* Indented content */}
        <div className="flex w-full flex-col gap-2 px-4.5 items-start">
          <p>{TERMS_SUMMARY}</p>

          <ul className="list-disc pl-6">
            {BULLETS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p>{TERMS_AFTER}</p>
        </div>
      </div>

      <Button variant="link" size="none" className="text-label">
        View full terms here.
      </Button>

      {/* Confirmation Section */}
      <div className="flex w-full flex-col gap-3">
        <h3 className="text-base font-semibold">Confirmation</h3>
        <Checkbox checked={agreed} onCheckedChange={(val) => setAgreed(!!val)}>
          I have read and agree to the Terms and Conditions.
        </Checkbox>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-row w-full gap-3">
        <Button variant="secondary" asChild>
          <Link to="">Back</Link>
        </Button>

        <Button asChild disabled={!agreed}>
          <Link
            to={agreed ? "/confirmation" : "#"}
            aria-disabled={!agreed}
            className={!agreed ? "pointer-events-none opacity-60" : ""}
          >
            Finish Setup
          </Link>
        </Button>
      </div>
    </main>
  );
}
