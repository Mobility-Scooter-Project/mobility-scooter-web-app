import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function ForgotPasswordPage() {
  return (
    <div className="bg-card flex p-4.5 gap-4.5 flex-col rounded-lg w-full max-w-lg">
      <div className="flex flex-col gap-9 items-start">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Forgot Password</h2>
          <p className="text-base text-muted-foreground">
            Enter your email, and we’ll send you a one-time reset link.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <TextInput
            label="Email"
            id="email"
            type="email"
            placeholder="Enter email..."
            variant="form"
          />
        </div>

        <Button asChild>
          <Link to={"/reset-password"}>Send Reset Link</Link>
        </Button>
      </div>
    </div>
  );
}
