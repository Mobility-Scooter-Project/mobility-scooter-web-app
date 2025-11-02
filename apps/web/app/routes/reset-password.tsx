import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function ResetPasswordPage() {
  const [show, setShow] = useState({ password: false, confirm: false });

  const toggle = (field: "password" | "confirm") =>
    setShow((s) => ({ ...s, [field]: !s[field] }));

  const onPwKeyDown =
    (
      field: "password" | "confirm"
    ): React.KeyboardEventHandler<HTMLInputElement> =>
    (e) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.shiftKey && e.key === "Backspace") {
        e.preventDefault();
        toggle(field);
      }
    };

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
            placeholder="Enter password..."
            variant="form"
            type={show.password ? "text" : "password"}
            onKeyDown={onPwKeyDown("password")}
            rightElement={
              <Button
                onClick={() => toggle("password")}
                aria-pressed={show.password}
                aria-label={show.password ? "Hide password" : "Show password"}
                title={show.password ? "Hide password" : "Show password"}
                variant="inline"
                size="inline"
                className="mr-2.5"
              >
                {show.password ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            }
          />

          <TextInput
            label="Confirm Password"
            id="confirm-password"
            placeholder="Re-enter password..."
            variant="form"
            type={show.confirm ? "text" : "password"}
            onKeyDown={onPwKeyDown("confirm")}
            rightElement={
              <Button
                onClick={() => toggle("confirm")}
                aria-pressed={show.confirm}
                aria-label={show.confirm ? "Hide password" : "Show password"}
                title={show.confirm ? "Hide password" : "Show password"}
                variant="inline"
                size="inline"
                className="mr-2.5"
              >
                {show.confirm ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            }
          />
        </div>

        <Button asChild>
          <Link to="/reset-confirmation">Update Password</Link>
        </Button>
      </div>
    </div>
  );
}
