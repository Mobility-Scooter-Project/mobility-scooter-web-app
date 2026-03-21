import { Card } from "~/components/Card";
import { Icon } from "~/components/Icon";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home" },
    { name: "description", content: "insert description" },
  ];
}

export default function Home() {
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
    </main>
  );
}
