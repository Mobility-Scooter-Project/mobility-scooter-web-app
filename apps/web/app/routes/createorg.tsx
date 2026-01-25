// routes/createorg.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { requireAuthLoader, userAuthStore } from "~/lib/auth";

export const loader = requireAuthLoader; // guard before page loads

export default function CreateOrgAppPage() {
  // guard during runtime of this page
  const state = userAuthStore.getState();
  if (!state.isAuthenticated()) {
    state.signOut();
    return (
      // Fallback UI if access token is expired or missing
      <div className="min-h-screen flex items-center justify-center px-4">
        <Button size={"fill"} asChild>
          <Link to={"/login"}>User Not Logged In. Please Go back</Link>
        </Button>
      </div>
    );
  }
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
    <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl items-start">
      <div>
        <h2 className="text-title-2 font-semibold mb-3">Create Organization</h2>
        <p>
          Your organization details have been verified. Please confirm your
          information to finish setting up your account.
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-4.5">Hospital Information</h3>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-label mb-2">Organization legal name</p>
            <p className="pl-4 pr-3 py-2">Pee Pee Poo Poo Medical Center</p>
          </div>

          <div>
            <p className="text-label mb-2">Organization web domain</p>
            <p className="pl-4 pr-3 py-2">peepeepoopoo.org</p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Account Information</h3>

        <TextInput
          label="First name"
          id="first-name"
          type="text"
          placeholder="Enter first name..."
          variant="form"
        />

        <TextInput
          label="Last name"
          id="last-name"
          type="text"
          placeholder="Enter last name..."
          variant="form"
        />

        <div>
          <p className="text-label mb-2">Primary Email</p>
          <p className="pl-4 pr-3 py-2">johnpoo@gmail.com</p>
        </div>

        <TextInput
          label="Password (min 8 characters, min 1 number or symbol)"
          id="password"
          placeholder="Create a secure password..."
          variant="form"
          type={showPassword ? "text" : "password"}
          onKeyDown={onPwKeyDown}
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

      <Button asChild>
        <Link to="/add-member">Continue</Link>
      </Button>
    </main>
  );
}
