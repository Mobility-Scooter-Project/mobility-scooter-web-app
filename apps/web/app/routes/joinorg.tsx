// routes/joinorg.tsx
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function JoinrgAppPage() {
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
        <p className="text-base">
          These details were assigned by your organization’s administrator and
          cannot be changed. If anything looks incorrect, please contact your
          hospital admin.
        </p>

        <div className="flex flex-col gap-3">
          <h4 className="text-base text-muted-foreground">Organization</h4>
          <p className="text-base px-4">Pee Pee Poo Poo Medical Center</p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-base text-muted-foreground">Department</h4>
          <p className="text-base px-4">Poo Poo Department</p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-base text-muted-foreground">Role</h4>
          <p className="text-base px-4">Researcher</p>
        </div>
      </div>

      {/* Account Information */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Account Information</h3>

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

        <TextInput
          label="Primary Email"
          id="email"
          type="email"
          value="johnpoo@gmail.com"
          variant="form"
          readOnly
        />

        <TextInput
          label="Password (minimum 8 characters, at least one number or symbol)"
          id="password"
          type="password"
          placeholder="Create a secure password..."
          variant="form"
        />
      </div>

      {/* CTA */}
      <Button asChild>
        <Link to="/terms">Continue</Link>
      </Button>
    </main>
  );
}
