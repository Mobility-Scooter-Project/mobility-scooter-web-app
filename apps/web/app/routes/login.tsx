// routes/login.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState, type KeyboardEventHandler } from "react";
import { Form, Link, useActionData } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { redirect, type ActionFunctionArgs } from "react-router";
import { userAuthStore } from "~/lib/auth";
import { API_BASE_URL } from "~/config/constants";

// TODO: make util to set JWT auth token before redirecting
// read token from query params, saves to local storage, redirects to dashboard

// handle if refresh token is invalidated, start by checking status of token
// AFTER validate if token is expired

// add rate limiting?
export async function loginAction({ request }: ActionFunctionArgs) {
  const fd = await request.formData();
  const email = fd.get("email") ?? "";
  const password = fd.get("password") ?? "";

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}/api/v1/auth/email/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    console.error("Error contacting API:", err);
    return { error: "Unable to contact API" };
  }

  if (!res.ok) {
    let msg = "";
    try {
      msg = (await res.json())?.error ?? "";
    } catch {}
    return { error: msg || "Invalid email or password." };
  }

  // Success: API returns JSON { token, refreshToken }
  const { data } = await res.json();
  const accessToken: string = data?.token;
  const refreshToken: string = data?.refreshToken ?? data?.refresh;

  // Only store access token in memory, refresh token goes to HttpOnly cookie
  userAuthStore.getState().signIn(accessToken);

  // Save refresh token as HttpOnly cookie with security flags
  return redirect("/", {
    headers: {
      "Set-Cookie": `refreshToken=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`, // 1 hour
    },
  });
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const disabled = email.trim() === "" || password.trim() === "";

  const toggleVisibility = () => setShowPassword((p) => !p);

  const onPwKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta && e.shiftKey && e.key === "Backspace") {
      e.preventDefault();
      toggleVisibility();
    }
  };

  const actionData = useActionData() as { error?: string } | undefined;

  return (
    <Form
      method="post"
      className="bg-card flex p-4.5 gap-9 flex-col items-start rounded-lg w-full max-w-lg"
    >
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">Sign In</h2>
        <p className="text-base text-muted-foreground">
          Sign in to access your organization resources.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <TextInput
          label="Email"
          id="email"
          name="email"
          type="email"
          placeholder="Enter email..."
          variant="form"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextInput
          label="Password"
          id="password"
          name="password"
          placeholder="Enter password..."
          variant="form"
          type={showPassword ? "text" : "password"}
          onKeyDown={onPwKeyDown}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightElement={
            <Button
              onClick={toggleVisibility}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              variant={"ghost"}
              size={"inline"}
              className="mr-2.5"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          }
        />
      </div>

      {actionData?.error && (
        <p role="alert" className="text-base text-destructive">
          {actionData.error}
        </p>
      )}

      <Button className="text-label" variant={"link"} size={"none"} asChild>
        <Link to={"/forgot-password"}>Forgot password?</Link>
      </Button>

      <Button size={"fill"} type={"submit"} disabled={disabled}>
        Sign In
      </Button>
    </Form>
  );
}
