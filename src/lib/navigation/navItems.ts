import {
  LayoutDashboard,
  SquareKanban,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "../routes";

import type { UserRole } from "../../features/auth/types/authTypes";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  // Omit to show the item to every logged-in user
  roles?: UserRole[];
}

// Add a new page to the sidebar / mobile bar by adding one entry here
export const NAV_ITEMS: NavItem[] = [
  { label: "Board", href: ROUTES.board, icon: SquareKanban },
  {
    label: "Dashboard",
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    roles: ["admin"],
  },
];

export function getNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
