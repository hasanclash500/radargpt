import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  BellRing,
  Building2,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  PanelsTopLeft,
  Search,
  Settings,
  UserRoundSearch,
  UserRound,
  UsersRound,
  Play,
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
      to: "/dashboard/leads",
      label: "متقاضی‌ها",
      icon: UserRoundSearch,
      show:
        role.role === "manager" ||
        role.role === "admin" ||
        role.role === "consultant",
    },
    {
      to: "/dashboard/chat",
      label: "گفتگو",
      icon: MessageCircle,
      show: true,
    },
    {
      to: "/dashboard/reminders",
      label: "پیگیری",
      icon: BellRing,
      show: role.isPrivileged,
    },
    {
      to: "/dashboard/matches",
      label: "تطبیق",
      icon: ClipboardList,
      show: role.canManageListings,
    },
    {
      to: "/dashboard/assistant",
      label: "جستجو",
      icon: Search,
      show: true,
    },
    {
      to: "/dashboard/profile",
      label: "پروفایل",
      icon: UserRound,
      show: role.role === "manager" || role.role === "consultant",
    },
    {
      to: "/dashboard/stories",
      label: "استوری",
      icon: Play,
      show: role.role === "manager" || role.role === "consultant",
    },
    {
      to: "/dashboard/pages",
      label: "صفحات",
      icon: PanelsTopLeft,
      show: role.canManageSite,
    },
    {
      to: "/admin?tab=users",
      label: "کاربران",
      icon: UsersRound,
      show: role.canManageSite,
    },
    {
      to: "/admin?tab=source",
      label: "تنظیمات",
      icon: Settings,
      show: role.canManageListings,
    },
  ];

  return (
    <nav className="z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur dark:border-white/10 dark:bg-[#071a2a]/92">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] sm:px-6">
        <Link
          to="/dashboard"
          className="me-1 hidden shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 sm:flex dark:border-white/10 dark:bg-white/5"
          aria-label="داشبورد دیوساز"
        >
          <img src="/divsaz-icon.svg" alt="" className="size-7 rounded-lg" />
          <span className="text-[11px] font-black">دیوساز</span>
        </Link>

        {items
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            const [itemPath, itemQuery = ""] = item.to.split("?");
            const itemTab = new URLSearchParams(itemQuery).get("tab");
            const currentTab = new URLSearchParams(location.search).get("tab");
            const active =
              itemPath === "/dashboard"
                ? location.pathname === "/dashboard"
                : itemPath === "/admin"
                  ? location.pathname === "/admin" &&
                    (itemTab === "source"
                      ? !currentTab || currentTab === "source"
                      : currentTab === itemTab)
                  : location.pathname === itemPath ||
                    location.pathname.startsWith(itemPath + "/");

            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[11px] font-black transition-colors " +
                  (active
                    ? "bg-[#082f54] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white")
                }
              >
                <Icon
                  className={
                    "size-3.5 " +
                    (active ? "text-[#e0b458]" : "text-current")
                  }
                />
                {item.label}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
