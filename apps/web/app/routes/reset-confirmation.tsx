import { Link } from "react-router";
import { Button } from "~/components/Button";

export default function ResetConfirmationPage() {
  return (
    <div className="bg-card flex p-4.5 gap-4.5 flex-col rounded-lg w-full max-w-md">
      <div className="flex flex-col gap-9 items-start">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Password Updated</h2>
          <p className="text-base text-muted-foreground">
            Your password has successfully been reset. You can now sign in using
            your new credentials.
          </p>
        </div>

        <Button asChild>
          <Link to={"/login"}>Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
