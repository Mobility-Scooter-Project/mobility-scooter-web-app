// routes/createorg.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function CreateOrgAppPage() {
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
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">Create Organization</h2>
        <p className="text-base">
          Your organization details have been verified. Please confirm your
          information to finish setting up your account.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Hospital Information</h3>

        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-label">Organization legal name</p>
            <div className="flex h-10 px-4 items-center justify-start">
              <p className="text-base">Pee Pee Poo Poo Medical Center</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-label">Organization web domain</p>
            <div className="flex h-10 px-4 items-center justify-start">
              <p className="text-base">peepeepoopoo.org</p>
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

      <Button asChild>
        <Link to="/add-member">Continue</Link>
      </Button>
    </main>
  );
}
