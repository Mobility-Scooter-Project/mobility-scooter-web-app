import { Link } from "react-router";
import { Button } from "~/components/Button";

export default function LinkExpiredPage() {
  return (
    <div className="bg-card flex p-4.5 gap-4.5 flex-col rounded-lg w-full max-w-md">
      <div className="flex flex-col gap-9 items-start">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Link Expired</h2>
          <p className="text-base text-muted-foreground">
            This link has expired or is no longer valid. Please contact your
            hospital administrator to request a new access link.
          </p>
        </div>

        <Button asChild>
          <Link to={"/"}>Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
