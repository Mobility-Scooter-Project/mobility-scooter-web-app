// routes/confirmation.tsx
import { Link } from "react-router";
import { Button } from "~/components/Button";

export default function ConfirmationPage() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-card flex p-4.5 gap-4.5 flex-col rounded-lg w-full max-w-md">
        <div className="flex flex-col gap-9 items-start">
          <div className="flex flex-col gap-3">
            <h2 className="text-title-2 font-semibold">Organization Created</h2>
            <p className="text-base">
              Your account has been successfully created. You can now sign in
              and start using your organization’s workspace.
            </p>
          </div>

          <Button className="w-full" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
