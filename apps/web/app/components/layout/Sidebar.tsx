import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import type { IconProps } from "~/components/Icon";
import { API_BASE_URL } from "~/config/constants";
import { userAuthStore } from "~/lib/auth";
import { cn } from "~/lib/utils";

interface NavItem {
  name: string;
  icon: IconProps["name"];
  path: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { name: "Home", icon: "House", path: "/" },
  { name: "Sessions", icon: "FilePlay", path: "/session" },
  { name: "Patients", icon: "User", path: "/patients", disabled: true },
  { name: "Reviews", icon: "CircleCheckBig", path: "/reviews", disabled: true },
  { name: "Admin", icon: "LayoutDashboard", path: "/admin", disabled: true },
];

const sidebarButtonClass = `
  h-10 w-full rounded-md px-3 overflow-hidden justify-start bg-transparent
  shadow-none text-foreground
`;

function SidebarButton({
  item,
  active,
  className,
  ...props
}: { item: Omit<NavItem, "path">; active?: boolean } & React.ComponentProps<typeof Button>) {
  const isDisabled = props["aria-disabled"];

  return (
    <Button
      variant="ghost"
      size="none"
      className={cn(
        sidebarButtonClass,
        active && !isDisabled && "bg-accent",
        !isDisabled && "hover:bg-foreground/20",
        isDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
        className
      )}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      <Icon name={item.icon} aria-hidden="true" />
      <span className="whitespace-nowrap">{item.name}</span>
    </Button>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const signOut = userAuthStore((s) => s.signOut);

  const handleToggle = () => setIsCollapsed((prev) => !prev);
  const handleSignOut = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Even if the network call fails, clear local state and send user to login.
    }
    signOut();
    setShowSettingsMenu(false);
    navigate("/login");
  };

  useEffect(() => {
    if (!showSettingsMenu) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setShowSettingsMenu(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [showSettingsMenu]);

  return (
    <nav
      aria-label="Main Navigation"
      className={cn(
        "relative flex h-full flex-col bg-card transition-all duration-250 ease-in-out overflow-visible",
        isCollapsed ? "w-14 rounded-[28px] p-2" : "w-64 rounded-xl p-3"
      )}
    >
      <Button
        variant="ghost"
        onClick={handleToggle}
        size="none"
        className={cn(sidebarButtonClass, "min-h-10 hover:bg-foreground/20")}
        aria-expanded={!isCollapsed}
        aria-controls="sidebar-menu"
      >
        <div className="flex items-center gap-3 shrink-0">
          <Icon name="Droplet" aria-hidden="true" />
          <span className="w-36 text-left text-base leading-snug">
            {"Mobility\u00A0Scooter"}
            <br />
            {"Research\u00A0Project"}
          </span>
          <Icon name="PanelLeft" aria-hidden="true" />
        </div>
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      <div id="sidebar-menu" className="mt-4.5 flex flex-col gap-1 grow">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <SidebarButton
              key={item.name}
              item={item}
              active={isActive}
              aria-disabled={item.disabled}
              onClick={item.disabled ? undefined : () => navigate(item.path)}
            />
          );
        })}
      </div>

      <div className="relative" ref={settingsMenuRef}>
        <SidebarButton
          item={{ name: "Settings", icon: "Settings" }}
          active={location.pathname.startsWith("/settings")}
          onClick={() => setShowSettingsMenu((prev) => !prev)}
        />
        {showSettingsMenu ? (
          <div
            className={cn(
              "absolute bottom-12 z-20 min-w-40 rounded-md border border-accent bg-card p-1 shadow-md",
              isCollapsed ? "left-0" : "left-3"
            )}
          >
            <Button
              className="w-full justify-start"
              variant="ghost"
              onClick={handleSignOut}
            >
              Log out
            </Button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
