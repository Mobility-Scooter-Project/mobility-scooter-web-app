import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/Button";

export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const flow = searchParams.get("flow");

  const copy =
    flow === "reset-password"
      ? {
          title: "Password reset successful!",
          message:
            "Your password has been updated. You can now sign in using your new password.",
        }
      : {
          title: "Account created successfully!",
          message:
            "Your account has been created successfully. You can now sign in with your email and password.",
        };

  return (
    <div className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-lg">
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">{copy.title}</h2>
        <p>{copy.message}</p>
      </div>

      <Button asChild>
        <Link to="/login">Return to sign in</Link>
      </Button>
    </div>
  );
}
