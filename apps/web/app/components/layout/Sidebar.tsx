import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import type { IconProps } from "~/components/ui/icon";
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

function SidebarButton({
  item,
  isCollapsed,
  ...props
}: {
  item: NavItem;
  isCollapsed: boolean;
}) {
  return (
    <Button
      size={isCollapsed ? "icon" : "default"}
      className={cn(
        "w-full",
        !isCollapsed && "justify-start",
        item.active && "bg-accent"
      )}
      {...props}
    >
      <Icon name={item.icon} />
      {!isCollapsed && <span className="ml-3">{item.name}</span>}
      <span className="sr-only">{item.name}</span>
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
        className={cn(
          "mt-1 flex items-center w-full",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        <div className="flex items-center">
          <Icon name="Droplet" />
          {!isCollapsed && (
            <span className="ml-3 text-left text-wrap text-base">
              Mobility Scooter Research Project
            </span>
          )}
        </div>

        {!isCollapsed && <Icon name="PanelLeft" />}

        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      {/* Main Navigation */}
      <div className="mt-4 flex flex-col gap-1 flex-grow">
        {navItems.map((item) => (
          <SidebarButton
            key={item.name}
            item={item}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>

      {/* Settings Button */}
      <SidebarButton
        item={{ name: "Settings", icon: "Settings" }}
        isCollapsed={isCollapsed}
      />
    </nav>
  );
}
