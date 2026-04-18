import { Eye, EyeOff, Lock } from "lucide-react";
import { useState, type KeyboardEventHandler } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
} from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { API_BASE_URL } from "~/config/constants";

type LoaderData = {
  token: string;
  email: string | null;
  error: string | null;
};

export async function clientLoader({
  request,
}: {
  request: Request;
}): Promise<LoaderData> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return {
      token: "",
      email: null,
      error: "This link is missing required information.",
    };
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/auth/email/sign-up/create-account/preview`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      },
    );

    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = raw.message;
      return {
        token,
        email: null,
        error:
          typeof msg === "string"
            ? msg
            : Array.isArray(msg)
              ? msg.join(", ")
              : "This link is invalid or has expired.",
      };
    }

    const data = raw as { email?: string };
    return {
      token,
      email: typeof data.email === "string" ? data.email : null,
      error: null,
    };
  } catch {
    return {
      token,
      email: null,
      error: "Network error. Try again.",
    };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const token = (formData.get("token") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { error: "Missing reset token." };
  }
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/auth/email/sign-up/create-account/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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
              : "Could not save your password.",
      };
    }

    return redirect("/auth-success?flow=create-account");
  } catch {
    return { error: "Network error occurred." };
  }
}

export default function CreateAccountPage() {
  const loaderData = useLoaderData() as LoaderData;
  const navigation = useNavigation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [show, setShow] = useState({ password: false, confirm: false });
  const actionData = useActionData() as { error?: string } | undefined;

  const toggleVisibility = (field: "password" | "confirm") =>
    setShow((s) => ({ ...s, [field]: !s[field] }));

  const onPwKeyDown =
    (
      field: "password" | "confirm",
    ): KeyboardEventHandler<HTMLInputElement> =>
    (e) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.shiftKey && e.key === "Backspace") {
        e.preventDefault();
        toggleVisibility(field);
      }
    };

  const emailLabel = loaderData.email ?? "";

  const hasClientValidationError =
    password.length < 8 || confirm.length < 8 || password !== confirm;
  const disabled = !loaderData.token || loaderData.error !== null;
  const isSubmitting = navigation.state === "submitting";

  if (loaderData.error && !loaderData.email) {
    return (
      <div className="bg-card flex p-4.5 gap-9 flex-col items-start rounded-lg w-full max-w-lg">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Link not usable</h2>
          <p className="text-base text-muted-foreground">{loaderData.error}</p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/join-org-app">Back to application</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form
      method="post"
      onSubmit={() => setAttemptedSubmit(true)}
      className="bg-card flex p-4.5 gap-9 flex-col items-start rounded-lg w-full max-w-lg"
    >
      <input type="hidden" name="token" value={loaderData.token} />

      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">Create your password</h2>
        <p className="text-base text-muted-foreground">
          Finish your organization application. Use the password you choose here when
          you sign in.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-2">
          <TextInput
            label="Email"
            id="join-complete-email"
            type="email"
            variant="form"
            readOnly
            value={emailLabel}
            autoComplete="email"
            className="bg-muted/45 border-accent/70 text-muted-foreground cursor-default"
          >
            <Lock className="size-4 shrink-0 opacity-70" aria-hidden />
          </TextInput>
          <p className="text-sm text-muted-foreground pl-0.5">
            Locked to the address on your application—you cannot change it here.
          </p>
        </div>

        <TextInput
          label="Password"
          id="password"
          name="password"
          placeholder="Enter password..."
          variant="form"
          type={show.password ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onPwKeyDown("password")}
          autoComplete="new-password"
          required
          minLength={8}
          rightElement={
            <Button
              type="button"
              onClick={() => toggleVisibility("password")}
              aria-pressed={show.password}
              aria-label={show.password ? "Hide password" : "Show password"}
              title={show.password ? "Hide password" : "Show password"}
              variant={"ghost"}
              size={"inline"}
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
          label="Confirm password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Re-enter password..."
          variant="form"
          type={show.confirm ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={onPwKeyDown("confirm")}
          autoComplete="new-password"
          required
          minLength={8}
          rightElement={
            <Button
              type="button"
              onClick={() => toggleVisibility("confirm")}
              aria-pressed={show.confirm}
              aria-label={show.confirm ? "Hide password" : "Show password"}
              title={show.confirm ? "Hide password" : "Show password"}
              variant={"ghost"}
              size={"inline"}
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
        <div className="flex w-full flex-col gap-3" role="alert">
          <p className="text-base text-destructive">{actionData.error}</p>
        </div>
      ) : null}

      {!actionData?.error && attemptedSubmit && hasClientValidationError ? (
        <p className="text-sm text-destructive" role="status">
          Enter matching passwords with at least 8 characters to create your
          account.
        </p>
      ) : null}

      <Button className="text-label" variant={"link"} size={"none"} asChild>
        <Link to="/login">Cancel and return to sign in</Link>
      </Button>

      <Button size={"fill"} type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </Form>
  );
}
