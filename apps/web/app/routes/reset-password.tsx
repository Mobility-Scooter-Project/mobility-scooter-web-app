import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function ResetPasswordPage() {
  return (
    <div className="bg-card flex p-4.5 gap-4.5 flex-col rounded-lg w-full max-w-lg">
      <div className="flex flex-col gap-9 items-start">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Reset Password</h2>
          <p className="text-base text-muted-foreground">
            Enter and confirm a new password for {`{email@email.com}`}.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <TextInput
            label="Password"
            id="password"
            type="password"
            placeholder="Enter password..."
            variant="form"
          />
          <TextInput
            label="Confirm password"
            id="confirm-password"
            type="password"
            placeholder="Re-enter password..."
            variant="form"
          />
        </div>

        <Button asChild>
          <Link to={"/reset-confirmation"}>Update Password</Link>
        </Button>
      </div>
    </div>
  );
}
