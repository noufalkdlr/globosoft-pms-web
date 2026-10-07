import { NavLink, Outlet } from "react-router";

import { cn } from "../../utils/cn";
import { getNavItems, type NavItem } from "../../lib/navigation/navItems";
import { useAuthStore } from "../../stores/authStore";
import { LogoMark } from "../ui/LogoMark";
import { AppHeader } from "./AppHeader";
import { GlowBackground } from "./GlowBackground";

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
  items: NavItem[];
}

// Desktop: floating glass sidebar, inset from the screen edges. It holds the
// name of the app and the menu; the bell and the signed-in person are in the header.
function Sidebar({ items }: NavProps) {
  return (
    <aside className="glass fixed bottom-4 left-4 top-4 z-30 hidden w-60 flex-col rounded-3xl p-4 md:flex">
      <div className="flex items-center gap-3 px-2 py-1">
        <LogoMark />
        {/* Two lines on purpose: the name, and under it what the app is */}
        <div className="min-w-0 leading-tight">
          <p className="font-semibold">Globosoft</p>
          <p className="text-xs text-muted-foreground">PMS</p>
        </div>
      </div>

      <nav aria-label="Main" className="mt-6 flex flex-col gap-1">
        {items.map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}

// Mobile: floating glass bar at the bottom of the screen
function MobileBar({ items }: NavProps) {
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
    </nav>
  );
}

// Layout for every logged-in page: glow background, navigation, and the
// active page rendered through <Outlet />
export function AppShell() {
  const user = useAuthStore((state) => state.user);

  // ProtectedRoute guarantees a user; this only narrows the type
  if (!user) {
    return null;
  }

  const items = getNavItems(user);

  return (
    <GlowBackground>
      {/* Each one hides itself at the other size (CSS), so neither needs a media query here */}
      <Sidebar items={items} />
      <MobileBar items={items} />

      <AppHeader user={user} />

      {/* Left padding clears the sidebar (w-60 + left-4 + gap); bottom padding clears the mobile bar.
          No top padding: the header above has its own height. */}
      <main className="px-5 pb-28 pt-1 md:pb-8 md:pl-[17.5rem] md:pr-8">
        <Outlet />
      </main>
    </GlowBackground>
  );
}
