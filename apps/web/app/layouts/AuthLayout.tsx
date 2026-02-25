import { Link, Outlet, useLocation } from "react-router";
import { Button } from "~/components/Button";
import { requireAuthLoader } from "~/lib/auth";

// Enforce authentication every time before page in this layout reloads
export async function loader({ request }: { request: Request }) {
  return await requireAuthLoader({ request });
}

export default function AuthLayout() {
  const location = useLocation();
  const path = location.pathname;

  const underlinkMap: Record<string, { to: string; msg: string }> = {
    "/login": {
      to: "/signup",
      msg: "Don’t have an account? Apply here.",
    },
    "/forgot-password": {
      to: "/login",
      msg: "Remember your password? Sign in here.",
    },
    "/reset-password": {
      to: "/login",
      msg: "Remember your password? Sign in here.",
    },
  };

  const { to, msg } = underlinkMap[path] ?? {
    to: "/login",
    msg: "Have an account? Sign in here.",
  };

  return (
    <div className="h-full w-full px-4.5 flex">
      <main className="flex w-full items-center flex-col gap-4.5 py-9 my-auto">
        <Outlet />
        <Button className="text-label" variant="link" size="none" asChild>
          <Link to={to}>{msg}</Link>
        </Button>
      </main>
    </div>
  );
}
