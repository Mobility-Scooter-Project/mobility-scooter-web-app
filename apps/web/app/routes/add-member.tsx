// routes/add-member.tsx
import { Link } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";

export default function AddMemberPage() {
  return (
    <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-[750px] items-start">
      {/* Header */}
      <div>
        <h2 className="text-title-2 font-semibold mb-3">
          Department and Member Setup
        </h2>
        <p>
          Add your hospital’s main departments and invite key team members to
          get started. You can edit these later in the admin dashboard.
        </p>
      </div>

      {/* Departments Section */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Departments</h3>

        <Button
          variant="link"
          size="none"
          className="flex items-center py-2 px-4 gap-2 text-foreground self-start"
        >
          <Plus className="size-4" /> New Department
        </Button>

        <div>
          {/* Department row 1 */}
          <TextInput
            type="text"
            value="Department 1"
            variant="form"
            className="bg-white h-14 mb-3"
            readOnly
            rightElement={
              <div className="flex items-center gap-2 mr-1.5">
                <button
                  type="button"
                  aria-label="Delete Department 1"
                  className="rounded-full p-1 hover:bg-muted"
                >
                  <Trash2 className="size-4 cursor-pointer" />
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
                  <Trash2 className="size-4 cursor-pointer" />
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Members Section */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Members</h3>

        <Button
          variant="link"
          size="none"
          className="flex items-center py-2 px-4 gap-2 text-foreground self-start"
        >
          <Plus className="size-4" /> New Member
        </Button>

        <div>
          {/* Member row 1 */}
          <TextInput
            type="email"
            value="email@domain.com"
            variant="form"
            className="bg-white h-14 mb-3"
            readOnly
            rightElement={
              <div className="flex items-center gap-2 mr-1.5">
                <p className="text-muted-foreground mr-2">role here</p>
                <button
                  type="button"
                  aria-label="Remove Member"
                  className="rounded-full p-1 hover:bg-muted"
                >
                  <Trash2 className="size-4 cursor-pointer" />
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
                <p className="text-muted-foreground mr-2">role here</p>
                <button
                  type="button"
                  aria-label="Remove Member"
                  className="rounded-full p-1 hover:bg-muted"
                >
                  <Trash2 className="size-4 cursor-pointer" />
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex w-full gap-3">
        <Button variant="secondary" className="flex-1" asChild>
          <Link to={"/create-org"}>Back</Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link to={"/terms"}>Continue</Link>
        </Button>
      </div>
    </main>
  );
}
