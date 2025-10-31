import { Link } from "react-router";
import { Button } from "~/components/Button";
import { TextInput } from "~/components/TextInput";
import { Share } from "lucide-react";

export default function CreateOrgAppPage() {
  return (
    <main className="bg-card flex my-auto p-4.5 gap-9 flex-col rounded-lg w-full max-w-3xl items-start">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">
          Create Organization Application
        </h2>
        <p className="text-base text-muted-foreground">
          Complete this form to apply for your hospital or organization
          registration. All applications are reviewed and verified before
          approval.
        </p>
      </div>

      {/* Organization Information */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">Organization Information</h3>

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

      {/* Upload Verification Documents */}
      <div className="flex w-full flex-col gap-4.5">
        <h3 className="text-base font-semibold">
          Upload Verification Documents
        </h3>
        <p className="text-sm text-muted-foreground">
          License, credential letter, ID, or other proof of authorization.
        </p>

        <div className="border-dashed border-2 border-accent-foreground rounded-lg p-4 flex flex-col justify-center items-center gap-2 bg-white h-[200px]">
          <Share className="text-muted-foreground" size={48} />
          <p className="text-sm text-muted-foreground">
            Drag and drop files here or click to upload (.pdf, .docx, .png,
            .jpg)
          </p>
        </div>
      </div>

      {/* CTA */}
      <Button asChild>
        <Link to="/verify-email">Submit Application</Link>
      </Button>
    </main>
  );
}
