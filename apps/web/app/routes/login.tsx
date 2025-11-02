// routes/login.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => setShowPassword((p) => !p);

  const onPwKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta && e.shiftKey && e.key === "Backspace") {
      e.preventDefault();
      toggleVisibility();
    }
  };

  return (
    <div className="bg-card flex p-4.5 gap-4.5 flex-col rounded-lg w-full max-w-md">
      <div className="flex flex-col gap-9 items-start">
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
            type="email"
            placeholder="Enter email..."
            variant="form"
          />

          <TextInput
            label="Password"
            id="password"
            placeholder="Enter password..."
            variant="form"
            type={showPassword ? "text" : "password"}
            onKeyDown={onPwKeyDown}
            rightElement={
              <Button
                onClick={toggleVisibility}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                variant={"inline"}
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

        <Button className="text-label" variant={"link"} size={"none"} asChild>
          <Link to={"/forgot-password"}>Forgot password?</Link>
        </Button>

        <Button asChild>
          <Link to={"/"}>Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
