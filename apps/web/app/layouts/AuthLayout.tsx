import { Link, Outlet, useLocation } from "react-router";
import { Button } from "~/components/Button";
import { publicOnlyLoader } from "~/lib/auth";

// Prevent authenticated users from accessing public auth pages (login, signup, etc)
export async function clientLoader({ request }: { request: Request }) {
  return await publicOnlyLoader({ request });
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
