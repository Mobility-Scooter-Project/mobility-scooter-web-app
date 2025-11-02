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
    <main className="bg-card flex p-4.5 gap-9 flex-col w-full rounded-lg max-w-[750px] items-start">
      {/* Header */}
      <div>
        <h2 className="text-title-2 font-semibold mb-3">Join Organization</h2>
        <p>
          Welcome, {`{Full Name}`}! You’ve been invited to join{" "}
          {`{Hospital Name}`}. Review your assigned details and complete your
          account setup to continue.
        </p>
      </div>

      {/* Hospital Information */}
      <div className="flex flex-col gap-4.5">
        <h3 className="font-semibold">Hospital Information</h3>
        <p>
          These details were assigned by your organization’s administrator and
          cannot be changed. If anything looks incorrect, please contact your
          hospital admin.
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-label mb-2">Organization</p>
            <p className="pl-4 pr-3 py-2">Pee Pee Poo Poo Medical Center</p>
          </div>

          <div>
            <p className="text-label mb-2">Department</p>
            <p className="pl-4 pr-3 py-2">Poo Poo Department</p>
          </div>

          <div>
            <p className="text-label mb-2">Role</p>
            <p className="pl-4 pr-3 py-2">Researcher</p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Account Information</h3>

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
