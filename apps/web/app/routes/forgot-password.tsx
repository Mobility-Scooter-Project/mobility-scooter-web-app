import { useState } from "react";
import { Form, Link, useActionData, type ActionFunctionArgs } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { API_BASE_URL } from "~/config/constants";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = (formData.get("email") as string)?.trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/auth/email/reset-password/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );

    const data = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
      token?: string;
    };

    if (response.status === 502) {
      const msg = data.message;
      return {
        error:
          typeof msg === "string"
            ? msg
            : Array.isArray(msg)
              ? msg.join(", ")
              : "Could not send reset email. Try again later.",
      };
    }

    if (!response.ok) {
      const msg = data.message;
      return {
        error:
          typeof msg === "string"
            ? msg
            : Array.isArray(msg)
              ? msg.join(", ")
              : "Something went wrong",
      };
    }

    return {
      success: true as const,
      message: typeof data.message === "string" ? data.message : "",
      devToken: typeof data.token === "string" ? data.token : undefined,
    };
  } catch {
    return { error: "Network error occurred" };
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const actionData = useActionData() as
    | {
        error?: string;
        success?: boolean;
        message?: string;
        devToken?: string;
      }
    | undefined;

  const disabled = email.trim() === "";

  if (actionData?.success) {
    return (
      <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-lg">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Check your email</h2>
          <p className="text-base text-muted-foreground">{actionData.message}</p>
          {actionData.devToken ? (
            <div className="flex flex-col gap-2 rounded-md border border-accent p-3">
              <p className="text-sm text-muted-foreground">
                SMTP is not configured on the API. For local development, use this
                reset token on the reset page (append{" "}
                <code className="text-xs">?token=…</code> to the URL or paste it when
                prompted).
              </p>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs">
                {actionData.devToken}
              </pre>
              <Button variant="link" size="none" className="text-label self-start" asChild>
                <Link
                  to={`/reset-password?token=${encodeURIComponent(actionData.devToken)}`}
                >
                  Open reset page
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
        <Button variant="link" size="none" className="text-label self-start" asChild>
          <Link to="/login">Back to sign in</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-lg">
      <Form method="post" className="flex w-full flex-col gap-9">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Forgot Password</h2>
          <p className="text-base text-muted-foreground">
            Enter your email and we will send you a link to reset your password if an
            account exists for that address.
          </p>
        </div>

        <TextInput
          label="Email"
          id="email"
          name="email"
          type="email"
          placeholder="Enter email..."
          variant="form"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        {actionData?.error ? (
          <p className="text-base text-destructive" role="alert">
            {actionData.error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button size="fill" type="submit" disabled={disabled}>
            Send reset link
          </Button>
          <Button variant="link" size="none" className="text-label self-start" asChild>
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      </Form>
    </main>
  );
}
