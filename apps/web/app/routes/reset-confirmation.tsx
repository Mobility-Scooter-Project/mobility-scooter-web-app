import { Link } from "react-router";
import { Button } from "~/components/Button";

export default function ResetConfirmationPage() {
  return (
    <main className="bg-card flex flex-col p-4.5 gap-9 rounded-lg w-full max-w-[480px]">
      <div>
        <h2 className="text-title-2 font-semibold mb-3">Password Updated</h2>
        <p>
          Your password has successfully been reset. You can now sign in using
          your new credentials.
        </p>
      </div>

      <Button asChild>
        <Link to={"/login"}>Sign In</Link>
      </Button>
    </main>
  );
}
