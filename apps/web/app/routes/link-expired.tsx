import { Link } from "react-router";
import { Button } from "~/components/Button";

export default function LinkExpiredPage() {
  return (
    <main className="bg-card flex flex-col p-4.5 gap-9 rounded-lg w-full max-w-[480px]">
      <div>
        <h2 className="text-title-2 font-semibold mb-3">Link Expired</h2>
        <p>
          This link has expired or is no longer valid. Please contact your
          hospital administrator to request a new access link.
        </p>
      </div>

      <Button asChild>
        <Link to={"/"}>Return Home</Link>
      </Button>
    </main>
  );
}
