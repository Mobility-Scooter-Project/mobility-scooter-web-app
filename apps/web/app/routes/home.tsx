import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { SessionList } from "~/components/SessionList";
import { SearchInput } from "~/components/SearchInput";
import { userAuthStore } from "~/lib/authStore";
import type { Route } from "./+types/home";
import { Button } from "~/components/Button";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home" },
    { name: "description", content: "insert description" },
  ];
}

export default function Home() {
  // TODO: use clearAccessToken when implementing logout button
  const { accessToken, clearAccessToken } = userAuthStore();

  // TODO: This is just a placeholder, replace with fallback UI for user not logged in
  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Button size={"fill"} asChild>
          <Link to={"/login"}>User Not Logged In. Please Go back</Link>
        </Button>
      </div>
    );
  }

  return (
    <main>
      <section>
        <div className="font-bold">Bold</div>
        <div className="font-semibold">Semibold</div>
        <div className="font-normal">Regular</div>
        <div className="font-light">Light</div>
      </section>
      <Card>
        <p className="text-display">Display</p>
        <p className="text-title-1">Title 1</p>
        <p className="text-title-2">Title 2</p>
        <p className="text-title-3">Title 3</p>
        <p className="text-headline font-semibold">Headline</p>
        <p className="text-base">Base</p>
        <p className="text-subhead">Subhead</p>
        <p className="text-label">Label</p>
      </Card>
      <section>
        <Icon name="House" size="primary" />
        <Icon name="Settings" size="secondary" />
      </section>
      <Card>
        <SessionList sessions={[{ id: "1", date: "2023-01-01" }]} />
      </Card>
      <section>
        <SearchInput placeholder="Search" />
      </section>
    </main>
  );
}
