// routes/login.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState, type KeyboardEventHandler, useEffect } from "react";
import { Form, Link, useActionData, useNavigate } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { redirect, type ActionFunctionArgs } from "react-router";
import { userAuthStore } from "~/lib/auth";
import { API_BASE_URL } from "~/config/constants";

/**
 * Server action to handle login form submission
 *
 * Flow:
 * 1. Extract email and password from form
 * 2. POST to /api/v1/auth/email to get access token
 * 3. Return token to client (server cannot use Zustand)
 * 4. Client useEffect handles Zustand store update and redirect
 *
 * @param request - Contains form data with email and password
 * @returns Object with error or success with token
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/email`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || "Login failed" };
    }

    const data = await response.json();

    return { success: true, token: data.token };
  } catch (error) {
    return { error: "Network error occurred" };
  }
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const disabled = email.trim() === "" || password.trim() === "";

  const toggleVisibility = () => setShowPassword((p) => !p);

  const onPwKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta && e.shiftKey && e.key === "Backspace") {
      e.preventDefault();
      toggleVisibility();
    }
  };

  const actionData = useActionData() as
    | { error?: string; success?: boolean; token?: string }
    | undefined;

  /**
   * Handle successful login on CLIENT side
   *
   * When server action returns success with token:
   * 1. Update Zustand store with token
   * 2. Fetch user profile
   * 3. Navigate to session page
   */
  useEffect(() => {
    if (actionData?.success && actionData?.token) {
      const { signIn, fetchUser } = userAuthStore.getState();
      signIn(actionData.token);
      fetchUser().then(() => {
        navigate("/session");
      });
    }
  }, [actionData, navigate]);

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
              type="button"
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
