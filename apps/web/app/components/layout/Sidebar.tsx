import { useState } from "react";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import type { IconProps } from "~/components/Icon";
import { cn } from "~/lib/utils";

interface NavItem {
  name: string;
  icon: IconProps["name"];
  active?: boolean;
}

const navItems: NavItem[] = [
  { name: "Home", icon: "House" },
  { name: "Sessions", icon: "FilePlay", active: true },
  { name: "Patients", icon: "User" },
  { name: "Reviews", icon: "CircleCheckBig" },
  { name: "Admin", icon: "LayoutDashboard" },
];

const sidebarButtonClass =
  "h-10 w-full rounded-md px-3 overflow-hidden justify-start bg-transparent shadow-none text-foreground hover:bg-foreground/20";

function SidebarButton({
  item,
  ...props
}: { item: NavItem } & React.ComponentProps<typeof Button>) {
  return (
    <Button
      size="none"
      className={cn(sidebarButtonClass, item.active && "bg-accent")}
      {...props}
    >
      <Icon name={item.icon} />
      <span className="whitespace-nowrap">{item.name}</span>
    </Button>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleToggle = () => setIsCollapsed((prev) => !prev);

  return (
    <nav
      className={cn(
        "relative flex h-full flex-col bg-card transition-all duration-250 ease-in-out overflow-hidden",
        isCollapsed ? "w-14 rounded-[28px] p-2" : "w-64 rounded-xl p-3"
      )}
    >
      {/* Header / Toggle Button */}
      <Button
        onClick={handleToggle}
        size="none"
        className={cn(sidebarButtonClass, "mt-1 min-h-10 py-2")}
      >
        <div className="flex items-center gap-3 shrink-0">
          <Icon name="Droplet" />
          <span className="w-36 text-left text-base leading-snug">
          {"Mobility\u00A0Scooter"}
          <br />
          {"Research\u00A0Project"}
        </span>
          <Icon name="PanelLeft" />
        </div>
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      {/* Main Navigation */}
      <div className="mt-4 flex flex-col gap-1 grow">
        {navItems.map((item) => (
          <SidebarButton key={item.name} item={item} />
        ))}
      </div>

      {/* Settings Button */}
      <SidebarButton item={{ name: "Settings", icon: "Settings" }} />
    </nav>
  );
}