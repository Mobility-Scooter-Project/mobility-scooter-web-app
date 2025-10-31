// routes/terms.tsx
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { Checkbox } from "~/components/Checkbox";

export default function TermsPage() {
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
      <div className="flex w-full flex-col gap-3">
        <h3 className="text-base font-semibold">Agreement Summary</h3>

        {/* Indented content */}
        <div className="flex flex-col gap-3 px-[18px]">
          <p className="text-sm text-muted-foreground">
            Terms and conditions yada yada dummy text here
          </p>

          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>Can you believe it guys?</li>
            <li>Christmas!</li>
            <li>Just a week away!</li>
            <li>Christmas is in a week!</li>
            <li>Woohoo!</li>
            <li>I am so happy about this information.</li>
          </ul>

          <p className="text-sm text-muted-foreground">
            Christmas just a week away!
          </p>

          <Button
            variant="link"
            size="none"
            className="text-sm self-start text-muted-foreground"
          >
            View full terms here.
          </Button>
        </div>
      </div>

      {/* Confirmation Section */}
      <div className="flex w-full flex-col gap-3">
        <h3 className="text-base font-semibold">Confirmation</h3>

        <Checkbox
          className="size-4 border-border shrink-0"
          containerClassName="flex items-center gap-3 cursor-pointer select-none"
          labelClassName="text-base leading-none"
        >
          I have read and agree to the Terms and Conditions.
        </Checkbox>
      </div>

      {/* Navigation Buttons */}
      <div className="flex w-full gap-3 mt-3">
        <Button variant="secondary" className="flex-1 min-w-0" asChild>
          <Link to="/add-member">Back</Link>
        </Button>
        <Button className="flex-1 min-w-0" asChild>
          <Link to="/confirmation">Finish Setup</Link>
        </Button>
      </div>
    </main>
  );
}
