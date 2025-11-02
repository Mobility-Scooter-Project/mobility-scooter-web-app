// routes/confirmation.tsx
import { Link } from "react-router";
import { Button } from "~/components/Button";

export default function ConfirmationPage() {
  return (
    <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-[480px] items-start">
      <div>
        <h2 className="text-title-2 font-semibold mb-3">
          Organization Created
        </h2>
        <p>
          Your account has been successfully created. You can now sign in and
          start using your organization’s workspace.
        </p>
      </div>

      <Button className="w-full" asChild>
        <Link to={"/login"}>Sign In</Link>
      </Button>
    </main>
  );
}
