// routes/add-member.tsx
import { Link } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function AddMemberPage() {
  return (
    <main className="bg-card flex my-auto p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl items-start">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">
          Department and Member Setup
        </h2>
        <p className="text-base">
          Add your hospital’s main departments and invite key team members to
          get started. You can edit these later in the admin dashboard.
        </p>
      </div>

      {/* Departments Section */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Departments</h3>

        <Button
          variant="link"
          size="none"
          className="flex items-center py-2 px-4 gap-2 text-foreground self-start"
        >
          <Plus className="size-4" /> New Department
        </Button>

        <div className="flex flex-col gap-3">
          {/* Department row 1 */}
          <TextInput
            type="text"
            value="Department 1"
            variant="form"
            className="bg-white h-14"
            readOnly
            rightElement={
              <div className="flex items-center gap-2 mr-1.5">
                <button
                  type="button"
                  aria-label="Delete Department 1"
                  className="rounded-full p-1 hover:bg-muted"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </div>
            }
          />

          {/* Department row 2 */}
          <TextInput
            type="text"
            value="Department 2"
            variant="form"
            className="bg-white h-14"
            readOnly
            rightElement={
              <div className="flex items-center gap-2 mr-1.5">
                <button
                  type="button"
                  aria-label="Delete Department 2"
                  className="rounded-full p-1 hover:bg-muted"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Members Section */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Members</h3>

        <Button
          variant="link"
          size="none"
          className="flex items-center py-2 px-4 gap-2 text-foreground self-start"
        >
          <Plus className="size-4" /> New Member
        </Button>

        <div className="flex flex-col gap-3">
          {/* Member row 1 */}
          <TextInput
            type="email"
            value="email@domain.com"
            variant="form"
            className="bg-white h-14"
            readOnly
            rightElement={
              <div className="flex items-center gap-2 mr-1.5">
                <p className="text-base text-muted-foreground mr-2">
                  role here
                </p>
                <button
                  type="button"
                  aria-label="Remove Member"
                  className="rounded-full p-1 hover:bg-muted"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </div>
            }
          />

          {/* Member row 2 */}
          <TextInput
            type="email"
            value="email@domain.com"
            variant="form"
            className="bg-white h-14"
            readOnly
            rightElement={
              <div className="flex items-center gap-2 mr-1.5">
                <p className="text-base text-muted-foreground mr-2">
                  role here
                </p>
                <button
                  type="button"
                  aria-label="Remove Member"
                  className="rounded-full p-1 hover:bg-muted"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex w-full gap-3 mt-4">
        <Button variant="secondary" className="flex-1" asChild>
          <Link to="/create-org">Back</Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link to="/terms">Continue</Link>
        </Button>
      </div>
    </main>
  );
}
