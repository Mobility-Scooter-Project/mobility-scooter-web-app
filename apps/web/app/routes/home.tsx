import { Icon } from "~/components/Icon";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home" },
    {
      name: "description",
      content: "Nothing in the home page for now, navigate to the sessions page.",
    },
  ];
}

export default function Home() {
  return (
    <main className="flex h-full items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Icon name="HousePlug" className="size-10" />
        <p className="text-center text-title-3">
          Nothing in the home page for now, navigate to the sessions page.
        </p>
      </div>
    </main>
  );
}
