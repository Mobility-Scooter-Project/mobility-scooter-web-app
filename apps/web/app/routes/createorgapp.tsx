import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { Share } from "lucide-react";
import { FileUpload } from "~/components/FileUpload";

export default function CreateOrgAppPage() {
  return (
    <main className="bg-card flex p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl items-start">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">
          Create Organization Application
        </h2>
        <p>
          Complete this form to apply for your hospital or organization
          registration. All applications are reviewed and verified before
          approval.
        </p>
      </div>

      {/* Organization Information */}
      <div className="flex flex-col w-full gap-4.5">
        <h3 className="font-semibold">Organization Information</h3>
        <div className="flex flex-col gap-3">
          <TextInput
            label="Organization legal name"
            id="org-name"
            type="text"
            placeholder="e.g., Pee Pee Poo Poo Medical Center"
            variant="form"
          />

          <TextInput
            label="Organization web domain"
            id="org-domain"
            type="text"
            placeholder="e.g., peepeepoopoo.org"
            variant="form"
          />

          <TextInput
            label="Admin contact email"
            id="admin-email"
            type="email"
            placeholder="Enter email..."
            variant="form"
          />
        </div>
      </div>

      {/* Upload Verification Documents */}
      <div className="flex flex-col w-full gap-4.5">
        <h3 className="font-semibold">Upload Verification Documents</h3>
        <FileUpload
          label="License, credential letter, ID, or other proof of authorization."
          size={200}
        />
      </div>

      {/* CTA */}
      <Button size={"fill"} asChild>
        <Link to="/verify-email">Submit Application</Link>
      </Button>
    </main>
  );
}
