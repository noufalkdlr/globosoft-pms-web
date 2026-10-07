import { NavLink, Outlet } from "react-router";
import { LogOut } from "lucide-react";

import { cn } from "../../utils/cn";
import { getNavItems, type NavItem } from "../../lib/navigation/navItems";
import { useAuthStore } from "../../stores/authStore";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";
import { useLogout } from "../../features/auth/hooks/useLogout";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { LogoMark } from "../ui/LogoMark";
import { GlowBackground } from "./GlowBackground";

import type { AuthUser } from "../../features/auth/types/authTypes";

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition",
          isActive
            ? "bg-brand/15 text-foreground ring-1 ring-brand/30"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        )
      }
    >
      <Icon className="size-5" aria-hidden="true" />
      {item.label}
    </NavLink>
  );
}

function MobileLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] transition",
          isActive
            ? "bg-brand/15 text-foreground ring-1 ring-brand/30"
            : "text-muted-foreground hover:text-foreground",
        )
      }
    >
      <Icon className="size-5" aria-hidden="true" />
      {/* The bottom bar is narrow, so long names use a short label */}
      {item.shortLabel ?? item.label}
    </NavLink>
  );
}

interface NavProps {
  user: AuthUser;
  items: NavItem[];
}

// Desktop: floating glass sidebar, inset from the screen edges
function Sidebar({ user, items }: NavProps) {
  const logoutMutation = useLogout();
  const subtitle = user.role === "admin" ? "Admin" : (user.team?.name ?? "Member");

  return (
    <aside className="glass fixed bottom-4 left-4 top-4 z-30 hidden w-60 flex-col rounded-3xl p-4 md:flex">
      <div className="flex items-center gap-3 px-2 py-1">
        <LogoMark />
        {/* Two lines on purpose: the name, and under it what the app is */}
        <div className="min-w-0 leading-tight">
          <p className="font-semibold">Globosoft</p>
          <p className="text-xs text-muted-foreground">PMS</p>
        </div>
        <div className="ml-auto">
          <NotificationBell placement="side" />
        </div>
      </div>

      <nav aria-label="Main" className="mt-6 flex flex-col gap-1">
        {items.map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-3 px-1">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          fullWidth
          loading={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          className="h-11 justify-start gap-3 px-3.5 text-sm text-muted-foreground"
        >
          <LogOut className="size-5" aria-hidden="true" />
          Log out
        </Button>
      </div>
    </aside>
  );
}

// Mobile: floating glass bar at the bottom of the screen
function MobileBar({ items }: Pick<NavProps, "items">) {
  const logoutMutation = useLogout();

  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex items-center gap-1 rounded-3xl p-1.5 md:hidden"
    >
      {items
        .filter((item) => !item.hideOnMobile)
        .map((item) => (
          <MobileLink key={item.href} item={item} />
        ))}

      {/* Temporary: moves to a profile page later */}
      <button
        type="button"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] text-muted-foreground transition hover:text-foreground disabled:opacity-60"
      >
        <LogOut className="size-5" aria-hidden="true" />
        Log out
      </button>
    </nav>
  );
}

// Layout for every logged-in page: glow background, navigation, and the
// active page rendered through <Outlet />
export function AppShell() {
  const user = useAuthStore((state) => state.user);
  // One bell on screen at a time: in the sidebar on wide screens, in a slim
  // bar at the top on narrow ones
  const isWide = useMediaQuery("(min-width: 768px)");

  // ProtectedRoute guarantees a user; this only narrows the type
  if (!user) {
    return null;
  }

  const items = getNavItems(user);

  return (
    <GlowBackground>
      {isWide && <Sidebar user={user} items={items} />}
      <MobileBar items={items} />

      {/* Left padding clears the sidebar (w-60 + left-4 + gap); bottom padding clears the mobile bar */}
      <main className="px-5 pb-28 pt-6 md:pb-8 md:pl-[17.5rem] md:pr-8 md:pt-8">
        {!isWide && (
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-semibold">Globosoft PMS</span>
            </div>
            <NotificationBell placement="top" />
          </div>
        )}

        <Outlet />
      </main>
    </GlowBackground>
  );
}
