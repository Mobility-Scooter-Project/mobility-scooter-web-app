// routes/login.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState, type KeyboardEventHandler } from "react";
import { Form, Link, useActionData } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { loginAction } from "~/lib/loginAction";

export const action = loginAction;

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
