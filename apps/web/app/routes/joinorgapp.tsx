// routes/joinorgapp.tsx
import { Home, Search, User } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function JoinOrgAppPage() {
  return (
    <main className="bg-card flex my-auto p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl items-start">
      <div className="flex flex-col gap-9 items-start">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">
            Request to Join Organization
          </h2>
          <p className="text-base">
            Request access to your organization’s workspace. Once approved,
            you’ll get a one-time magic link to register your account.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Applicant Information</h3>
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
          <TextInput
            label="Email"
            id="email"
            type="email"
            placeholder="Enter email..."
            variant="form"
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Organization Information</h3>
        <div className="flex w-full flex-col gap-3">
          <TextInput
            label="Hospital"
            id="hospital"
            type="search"
            placeholder="Search for your organization..."
            variant="form"
            rightElement={<Search className="size-4 mr-4.5 text-accent" />}
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

      <Button className="text-label" variant={"link"} size={"none"} asChild>
        <Link to={"/"}>
          Can’t find your organization? Apply to create one here.
        </Link>
      </Button>

      <Button>Submit Application</Button>
    </main>
  );
}
