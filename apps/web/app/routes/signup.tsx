// routes/login.tsx
import { Home, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/Button";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => setShowPassword((p) => !p);

  const onPwKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta && e.shiftKey && e.key === "Backspace") {
      e.preventDefault();
      toggleVisibility();
    }
  };

  return (
    <main className="bg-card flex p-4.5 gap-4.5 flex-col rounded-lg w-full max-w-3xl md:h-[500px]">
      <div className="flex flex-col gap-9 items-start">
        <div className="flex flex-col gap-3">
          <h2 className="text-title-2 font-semibold">Sign Up Applications</h2>
          <p className="text-base">
            Choose an application form to create or join an organization.
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col md:flex-row gap-4.5">
        <Button variant={"secondary"} size={"fill"}>
          <Link
            to={"/"}
            className="flex flex-col w-full h-full p-4.5 gap-8 justify-center items-center"
          >
            <h2 className="text-title-2 font-semibold">Create Organization</h2>
            <Home className="size-11" />
            <p className="text-label text-center md:max-w-[70%]">
              For organization owners establishing a new workspace.
            </p>
          </Link>
        </Button>
        <Button variant={"secondary"} size={"fill"}>
          <Link
            to={"/"}
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
