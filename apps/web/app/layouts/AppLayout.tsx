import { Outlet } from "react-router";
import { Sidebar } from "~/components/layout/Sidebar";
import { requireAuthLoader } from "~/lib/auth";

// Enforce authentication every time before page in this layout reloads
// redirect unauthenticated users to login on layout reloads
export async function loader({ request }: { request: Request }) {
  return await requireAuthLoader({ request });
}
export default function AppLayout() {
  return (
    <div className="h-full p-4">
      <div className="flex h-full gap-4">
        <Sidebar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
