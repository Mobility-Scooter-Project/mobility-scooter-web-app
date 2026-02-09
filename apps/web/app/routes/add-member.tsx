// routes/add-member.tsx
import { Link } from "react-router";
import { Plus, PlusIcon, Trash2 } from "lucide-react";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { OverlayCard } from "~/components/OverlayCard";
import OverlayModal from "~/components/OverlayModal";
import { useState } from "react";

export default function AddMemberPage() {
  const [openOverlay, setOpenOverlay] = useState(false);

  return (
    <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl items-start">
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

        <Button variant="ghost" onClick={() => setOpenOverlay(true)}>
          <PlusIcon className="size-4" />
          New Department
        </Button>

        <div>
          {/* Department row 1 */}
          <TextInput
            type="text"
            value="Department 1"
            variant="form"
            className="bg-white p-4.5 h-14 mb-3"
            readOnly
            rightElement={
              <Button variant="ghost" className="h-4 w-4 m-1" asChild>
                <Trash2 className="size-4" />
              </Button>
            }
          />

          {/* Department row 2 */}
          <TextInput
            type="text"
            value="Department 2"
            variant="form"
            className="bg-white p-4.5 h-14"
            readOnly
            rightElement={
              <Button variant="ghost" className="h-4 w-4 m-1" asChild>
                <Trash2 className="size-4" />
              </Button>
            }
          />
        </div>
      </div>

      {/* Members Section */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="font-semibold">Members</h3>

        <Button variant="ghost" onClick={() => setOpenOverlay(true)}>
          <PlusIcon className="size-4" />
          New Member
        </Button>

        <OverlayCard
          open={openOverlay}
          onClose={() => setOpenOverlay(false)}
          title="Invite Member"
          subtitle="Invite a team member to join your organization. The recipient will get a one-time magic link to create their account. Embedded information will not be editable by recipient."
          contentClassName="max-w-3xl rounded-lg w-full"
          bodyClassName="gap-9"
        >
          <OverlayModal />
        </OverlayCard>

        <div>
          {/* Member row 1 */}
          <TextInput
            type="email"
            value="email@domain.com"
            variant="form"
            className="bg-white h-14 mb-3 p-4.5"
            readOnly
            rightElement={<p className="text-foreground">role here</p>}
          />

          {/* Member row 2 */}
          <TextInput
            type="email"
            value="email@domain.com"
            variant="form"
            className="bg-white h-14 p-4.5"
            readOnly
            rightElement={<p className="text-foreground">role here</p>}
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
