import { useNavigate } from "react-router";
import { TextInput } from "~/components/TextInput";
import { ChevronDown, X } from "lucide-react";
import { Button } from "~/components/Button";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type OverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

function Overlay({ isOpen, onClose, children }: OverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);

    // Lock background scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overscroll-contain"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-[750px] rounded-2xl bg-card p-6
        max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function OverlayModal() {
  const navigate = useNavigate();
  const close = () => navigate(-1);

  return (
    <Overlay isOpen onClose={close}>
      <main className="bg-transparent rounded-none flex p-4.5 gap-9 flex-col w-full items-start">
        {/* Header */}
        <div>
          <div className="flex justify-between mb-3">
            <h2 className="text-title-2 font-semibold">Invite Member</h2>
            {/* X Close Button */}
            <Button variant="ghost" className="w-auto h-auto" onClick={close}>
              <X className="text-foreground size-4" />
            </Button>
          </div>
          <p>
            Invite a team member to join your organization. The recipient will
            get a one-time magic link to create their account. Embedded
            information will not be editable by recipient.
          </p>
        </div>

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
        <Button onClick={() => navigate(-1)}>Send Invite</Button>
      </main>
    </Overlay>
  );
}
