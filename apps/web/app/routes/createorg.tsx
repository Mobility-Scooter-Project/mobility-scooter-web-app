// routes/createorg.tsx
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function CreateOrgAppPage() {
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
        <TextInput
          label="Organization legal name"
          id="org-name"
          type="text"
          value="Pee Pee Poo Poo Medical Center"
          variant="form"
          readOnly
        />
        <TextInput
          label="Organization web domain"
          id="org-domain"
          type="text"
          value="peepeepoopoo.org"
          variant="form"
          readOnly
        />
      </div>

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
          value="peepee@poopoo.com"
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

      <Button asChild>
        <Link to="/add-member">Continue</Link>
      </Button>
    </main>
  );
}
