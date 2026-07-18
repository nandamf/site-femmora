import { LayoutDashboard, type LucideIcon } from "lucide-react";

export type AdminNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: string;
  exact?: boolean;
};

export type AdminNavigationSection = {
  label: string;
  items: AdminNavigationItem[];
};

export const adminNavigation: AdminNavigationSection[] = [
  {
    label: "Principal",
    items: [
      {
        label: "Visão geral",
        href: "/admin",
        icon: LayoutDashboard,
        permission: "admin.access",
        exact: true,
      },
    ],
  },
];

export function filterAdminNavigation(
  sections: AdminNavigationSection[],
  permissions: readonly string[],
) {
  const allowed = new Set(permissions);
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowed.has(item.permission)),
    }))
    .filter((section) => section.items.length > 0);
}
