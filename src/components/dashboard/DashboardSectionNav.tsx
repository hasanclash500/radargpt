import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  BellRing,
  Bot,
  BrainCircuit,
  Building2,
  LayoutDashboard,
  PanelsTopLeft,
  Settings,
  UserRoundSearch,
} from "lucide-react";
import { Link, useLocation } from "react-router";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  show: boolean;
};

export default function DashboardSectionNav() {
  const role = useQuery(api.roles.myRole, {});
  const location = useLocation();

  if (!role) return null;

  const items: NavItem[] = [
    {
      to: "/dashboard",
      label: "خانه",
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: "/dashboard/listings",
      label: "آگهی‌ها",
      icon: Building2,
      show: role.isPrivileged,
    },
    {
      to: "/dashboard/assistant",
      label: "دستیار",
      icon: Bot,
      show: true,
    },
    {
      to: "/dashboard/leads",
      label: "متقاضی‌ها",
      icon: UserRoundSearch,
      show: role.canManageListings,
    },
    {
      to: "/dashboard/matches",
      label: "مچ هوشمند",
      icon: BrainCircuit,
      show: role.canManageListings,
    },
    {
      to: "/dashboard/reminders",
      label: "یادآوری",
      icon: BellRing,
      show: role.isPrivileged,
    },
    {
      to: "/dashboard/pages",
      label: "صفحه‌ساز",
      icon: PanelsTopLeft,
      show: role.canManageSite,
    },
    {
      to: "/admin",
      label: "مدیریت",
      icon: Settings,
      show: role.canManageListings,
    },
  ];

  return (
    <nav className="z-30 border-b border-border/60 bg-background/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] sm:px-6">
        {items
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/dashboard"
                ? location.pathname === "/dashboard"
                : location.pathname === item.to ||
                  location.pathname.startsWith(item.to + "/");

            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-extrabold transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
