// routes/joinorg.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function JoinrgAppPage() {
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
    <main className="bg-card flex my-auto p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl items-start">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">Join Organization</h2>
        <p className="text-base">
          Welcome, {`{Full Name}`}! You’ve been invited to join{" "}
          {`{Hospital Name}`}. Review your assigned details and complete your
          account setup to continue.
        </p>
      </div>

      {/* Hospital Information */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Hospital Information</h3>

        <div className="flex w-full flex-col gap-3">
          <p className="text-base">
            These details were assigned by your organization’s administrator and
            cannot be changed. If anything looks incorrect, please contact your
            hospital admin.
          </p>

          <div className="flex flex-col gap-2">
            <p className="text-label">Organization</p>
            <div className="flex h-10 px-4 items-center justify-start">
              <p className="text-base">Pee Pee Poo Poo Medical Center</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-label">Department</p>
            <div className="flex h-10 px-4 items-center justify-start">
              <p className="text-base">Poo Poo Department</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-label">Role</p>
            <div className="flex h-10 px-4 items-center justify-start">
              <p className="text-base">Researcher</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Account Information</h3>

        <div className="flex w-full flex-col gap-3">
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

          <div className="flex flex-col gap-2">
            <p className="text-label">Primary Email</p>
            <div className="flex h-10 px-4 items-center justify-start">
              <p className="text-base">johnpoo@gmail.com</p>
            </div>
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
      </div>

      {/* CTA */}
      <Button asChild>
        <Link to="/terms">Continue</Link>
      </Button>
    </main>
  );
}
