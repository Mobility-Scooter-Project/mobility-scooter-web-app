import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TextInput } from "~/components/TextInput";
import { ChevronDown, X } from "lucide-react";
import { Button } from "~/components/Button";

export default function OverlayModal() {
  return (
    <main className="flex gap-9 flex-col w-full max-w-3xl items-start h-[50vh] overflow-y-auto">
      {/* User Information */}
      <div className="flex w-full flex-col gap-4.5">
        <h2 className="font-semibold">User Information</h2>
        <TextInput
          label="Full name"
          id="full-name"
          type="text"
          placeholder="Enter full name..."
          variant="form"
        />
        <TextInput
          label="Email"
          id="email"
          type="email"
          placeholder="Enter email..."
          variant="form"
        />
        <TextInput
          label="Department (optional)"
          id="department"
          type="text"
          placeholder="Select department"
          variant="form"
          rightElement={
            <Button variant="ghost" className="py-2 px-4" asChild>
              <ChevronDown className="size-4 text-foreground" />
            </Button>
          }
        />
        <TextInput
          label="Role (optional)"
          id="role"
          type="text"
          placeholder="Select role"
          variant="form"
          rightElement={
            <Button variant="ghost" className="py-2 px-4" asChild>
              <ChevronDown className="size-4 text-foreground" />
            </Button>
          }
        />
      </div>

      {/* Link Expiration */}
      <div className="flex w-full flex-col gap-4.5">
        <h2 className="font-semibold">Link Expiration</h2>
        <TextInput
          label="Expires after"
          id="expires-after"
          type="text"
          placeholder="30 days"
          variant="default"
          readOnly
          rightElement={
            <Button variant="ghost" className="py-2 px-4" asChild>
              <ChevronDown className="size-4 text-foreground" />
            </Button>
          }
        />
      </div>

      {/* CTA – close modal after sending */}
      <DialogPrimitive.Close asChild>
        <Button size={"fill"}>Send Invite</Button>
      </DialogPrimitive.Close>
    </main>
  );
}
