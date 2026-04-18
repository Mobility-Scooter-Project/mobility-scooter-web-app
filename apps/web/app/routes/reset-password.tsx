import { Eye, EyeOff } from "lucide-react";
import { useState, type KeyboardEventHandler } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
} from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { API_BASE_URL } from "~/config/constants";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const token = (formData.get("token") as string)?.trim();
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return {
      error:
        "This reset link is missing a token. Open the link from your email or request a new reset.",
    };
  }
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/auth/email/reset-password`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      },
    );

    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };

    if (!response.ok) {
      const msg = data.message;
      return {
        error:
          typeof msg === "string"
            ? msg
            : Array.isArray(msg)
              ? msg.join(", ")
              : "Could not update password.",
      };
    }

    return redirect("/auth-success?flow=reset-password");
  } catch {
    return { error: "Network error occurred" };
  }
}

export default function ResetPasswordPage() {
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ password: false, confirm: false });

  const actionData = useActionData() as { error?: string } | undefined;

  const toggle = (field: "password" | "confirm") =>
    setShow((s) => ({ ...s, [field]: !s[field] }));

  const onPwKeyDown =
    (
      field: "password" | "confirm",
    ): KeyboardEventHandler<HTMLInputElement> =>
    (e) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.shiftKey && e.key === "Backspace") {
        e.preventDefault();
        toggle(field);
      }
    };

  const disabled = !tokenFromUrl;
  const isSubmitting = navigation.state === "submitting";

  if (!tokenFromUrl) {
    return (
      <main className="bg-card flex flex-col gap-9 p-4.5 rounded-lg w-full max-w-[480px]">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Invalid reset link</h2>
          <p className="text-base text-muted-foreground">
            This page needs a valid reset token from your email. Request a new password
            reset from the sign-in page.
          </p>
        </div>
        <Button asChild>
          <Link to="/forgot-password">Request reset link</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="bg-card flex flex-col gap-9 p-4.5 rounded-lg w-full max-w-[480px]">
      <Form
        method="post"
        className="flex flex-col gap-9"
      >
        <input type="hidden" name="token" value={tokenFromUrl} />

        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Reset Password</h2>
          <p className="text-base text-muted-foreground">
            Choose a new password for your account. This link expires after a short
            time.
          </p>
        </div>

        <div className="flex flex-col w-full gap-3">
          <TextInput
            label="Password"
            id="password"
            name="newPassword"
            placeholder="Enter password..."
            variant="form"
            type={show.password ? "text" : "password"}
            onKeyDown={onPwKeyDown("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            rightElement={
              <Button
                type="button"
                onClick={() => toggle("password")}
                aria-pressed={show.password}
                aria-label={show.password ? "Hide password" : "Show password"}
                title={show.password ? "Hide password" : "Show password"}
                variant="ghost"
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
            name="confirmPassword"
            placeholder="Re-enter password..."
            variant="form"
            type={show.confirm ? "text" : "password"}
            onKeyDown={onPwKeyDown("confirm")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            rightElement={
              <Button
                type="button"
                onClick={() => toggle("confirm")}
                aria-pressed={show.confirm}
                aria-label={show.confirm ? "Hide password" : "Show password"}
                title={show.confirm ? "Hide password" : "Show password"}
                variant="ghost"
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

        {actionData?.error ? (
          <p className="text-base text-destructive" role="alert">
            {actionData.error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button size="fill" type="submit" disabled={disabled || isSubmitting}>
            {isSubmitting ? "Resetting password..." : "Reset password"}
          </Button>
          <Button variant="link" size="none" className="text-label self-start" asChild>
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </Form>
    </main>
  );
}
