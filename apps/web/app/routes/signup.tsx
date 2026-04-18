// routes/signup.tsx
import { Home, User } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/Button";

export default function SignUpPage() {
  return (
    <main className="bg-card flex p-4.5 gap-4.5 flex-col rounded-lg w-full max-w-3xl md:h-[500px] items-start">
      {/* title */}
      <div className="flex flex-col gap-3">
        <h2 className="text-title-2 font-semibold">Sign Up Applications</h2>
        <p className="text-base">
          Choose an application form to create or join an organization.
        </p>
      </div>

      {/* expand button row */}
      <div className="flex flex-1 flex-col md:flex-row gap-4.5">
        <Button
          type="button"
          variant="secondary"
          size="expand"
          disabled
          className="h-auto cursor-not-allowed"
          aria-label="Create organization (temporarily unavailable)"
        >
          <span className="flex flex-col w-full p-4.5 gap-6 justify-center items-center text-muted-foreground">
            <h2 className="text-title-2 font-semibold text-muted-foreground">
              Create Organization
            </h2>
            <Home className="size-11 shrink-0 opacity-60" aria-hidden />
            <p className="text-label text-center md:max-w-[70%]">
              For organization owners establishing a new workspace.
            </p>
            <p className="text-sm text-center text-muted-foreground/90">
              Temporarily unavailable.
            </p>
          </span>
        </Button>
        <Button variant={"secondary"} size={"expand"}>
          <Link
            to={"/join-org-app"}
            className="flex flex-col w-full h-full p-4.5 gap-8 justify-center items-center"
          >
            <h2 className="text-title-2 font-semibold">Join Organization</h2>
            <User className="size-11" />
            <p className="text-label text-center md:max-w-[80%]">
              For employees or collaborators requesting to join an existing
              organization.
            </p>
          </Link>
        </Button>
      </div>
    </main>
  );
}
