import { Link } from "react-router";
import { Button } from "~/components/Button";

export default function EmailVerifiedPage() {
  return (
    <div className="bg-card flex p-4.5 gap-4.5 flex-col rounded-lg w-full max-w-lg">
      <div className="flex flex-col gap-9 items-start">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Email Verified</h2>
          <p className="text-base text-muted-foreground">
            Your application has been submitted for review. We’ll notify you
            once it’s approved.
          </p>
        </div>

        <Button asChild>
          <Link to={"/"}>Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
