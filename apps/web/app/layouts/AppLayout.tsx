import { Outlet } from "react-router";
import { Sidebar } from "~/components/layout/Sidebar";

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
