// routes/joinorgapp.tsx
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function JoinOrgAppPage() {
  return (
    <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-[750px] justify-start items-start">
      {/* Header */}
      <div className="flex flex-col">
        <h2 className="text-title-2 font-semibold mb-3">
          Request to Join Organization
        </h2>
        <p>
          Request access to your organization’s workspace. Once approved, you’ll
          get a one-time magic link to register your account.
        </p>
      </div>

      {/* Applicant Information */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Applicant Information</h3>

        <div className="flex flex-col gap-3">
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
            label="Email"
            id="email"
            type="email"
            placeholder="Enter email..."
            variant="form"
          />
        </div>
      </div>

      {/* Organization Information */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Organization Information</h3>

        <div className="flex flex-col gap-3">
          <TextInput
            label="Hospital"
            id="hospital"
            type="text"
            placeholder="Search for your organization..."
            variant="form"
          />

          <TextInput
            label="Department (Optional)"
            id="department"
            type="text"
            placeholder="Enter department..."
            variant="form"
          />

          <TextInput
            label="Intended Role (Optional)"
            id="role"
            type="text"
            placeholder="Enter role..."
            variant="form"
          />

          <TextInput
            label="Message (Optional)"
            id="message"
            type="text"
            placeholder="Enter message..."
            variant="form"
          />
        </div>
      </div>

      {/* CTA */}
      <Button className="text-label" variant={"link"} size={"none"} asChild>
        <Link to={"/create-org-app"}>
          Can’t find your organization? Apply to create one here.
        </Link>
      </Button>

      <Button asChild>
        <Link to={"/verify-email"}>Submit Application</Link>
      </Button>
    </main>
  );
}
