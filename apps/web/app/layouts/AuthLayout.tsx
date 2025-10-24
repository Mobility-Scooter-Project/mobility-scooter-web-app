import { Outlet } from "react-router";
import Underlink from "~/components/auth/Underlink";

// TODO: change underlink per route

export default function AuthLayout() {
  return (
    <div className="h-full w-full p-4.5 flex flex-col overflow-auto items-center gap-4.5">
      <Outlet />
      <Underlink />
    </div>
  );
}
