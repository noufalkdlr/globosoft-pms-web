import {
  Briefcase,
  CalendarDays,
  House,
  LayoutDashboard,
  SquareKanban,
  type LucideIcon,
} from "lucide-react";

import { can, type Permission } from "../permissions";
import { ROUTES } from "../routes";

import type { AuthUser, UserRole } from "../../features/auth/types/authTypes";

export interface NavItem {
  label: string;
  // Used in the narrow mobile bottom bar when the label is too long
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
  // Omit to show the item to every logged-in user
  roles?: UserRole[];
  // Show the item only to users who have this permission (admins always do)
  permission?: Permission;
}

// Add a new page to the sidebar / mobile bar by adding one entry here
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: ROUTES.home, icon: House, roles: ["member"] },
  {
    label: "Content calendar",
    shortLabel: "Calendar",
    href: ROUTES.calendar,
    icon: CalendarDays,
    permission: "can_create_content",
  },
  { label: "Clients", href: ROUTES.clients, icon: Briefcase },
  { label: "Board", href: ROUTES.board, icon: SquareKanban },
  {
    label: "Dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    roles: ["admin"],
  },
];

export function getNavItems(user: AuthUser): NavItem[] {
  return NAV_ITEMS.filter(
    (item) =>
      (!item.roles || item.roles.includes(user.role)) &&
      (!item.permission || can(user, item.permission)),
  );
}
