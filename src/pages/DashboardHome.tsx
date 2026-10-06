import MekaBrand from "@/components/MekaBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { faNum, formatPrice } from "@/lib/format";
import { todayJalaliString } from "@/lib/jalali";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BellRing,
  BookOpen,
  Bot,
  Building2,
  ClipboardList,
  DatabaseBackup,
  FileText,
  Globe2,
  HandCoins,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageCircle,
  PanelsTopLeft,
  Play,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  UserRoundSearch,
  Users,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

const ROLE_LABELS: Record<string, string> = {
  manager: "مدیر",
  admin: "ادمین",
  consultant: "مشاور",
  user: "کاربر",
  guest: "مهمان",
};

type DashboardCard = {
  title: string;
  description: string;
  to?: string;
  action?: "chat";
  icon: typeof Building2;
  badge?: string;
};

type Metric = {
  label: string;
  value: string;
  icon: typeof Building2;
  to?: string;
};

const INTENT_LABELS: Record<string, string> = {
  buy: "خرید",
  rent: "اجاره",
  sell: "فروش",
  lease_out: "اجاره دادن",
};

function openSiteChat() {
  window.dispatchEvent(new CustomEvent("divsaz-open-chat"));
}

function DashboardLinkCard({ card }: { card: DashboardCard }) {
  const Icon = card.icon;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="size-5" />
        </span>
        {card.badge && (
          <span className="rounded-full bg-[color:var(--gold)]/15 px-2.5 py-1 text-[10px] font-black text-[color:var(--gold)]">
            {card.badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-sm font-black sm:text-base">{card.title}</h3>
      <p className="mt-2 min-h-12 text-xs leading-6 text-muted-foreground">
        {card.description}
      </p>
      <span className="mt-4 flex items-center gap-1 text-xs font-black text-primary">
        ورود به بخش
        <ArrowLeft className="size-3.5" />
      </span>
    </>
  );

  const className =
    "group block w-full rounded-3xl border border-border/70 bg-card p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-5";

  if (card.action === "chat") {
    return (
      <button type="button" className={className} onClick={openSiteChat}>
        {body}
      </button>
    );
  }

  return (
    <Link to={card.to || "/"} className={className}>
      {body}
    </Link>
  );
}

function ListingTrendChart({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  const width = 760;
  const height = 220;
  const padX = 28;
  const padY = 24;
  const max = Math.max(1, ...data.map((item) => item.count));
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  const points = data.map((item, index) => {
    const x =
      padX +
      (data.length <= 1 ? 0 : (index / (data.length - 1)) * usableW);
    const y = padY + usableH - (item.count / max) * usableH;
    return { ...item, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area =
    points.length > 0
      ? `${padX},${height - padY} ${polyline} ${width - padX},${height - padY}`
      : "";
  const labels = points.filter(
    (_, index) =>
      index === 0 ||
      index === points.length - 1 ||
      index % Math.max(1, Math.floor(points.length / 4)) === 0,
  );

  const dateLabel = (value: string) =>
    new Date(value + "T12:00:00").toLocaleDateString(
      "fa-IR-u-ca-persian",
      { day: "numeric", month: "short" },
    );

  return (
    <div className="mt-4 min-w-0 max-w-full">
      <div className="w-full max-w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-[170px] w-full max-w-full sm:h-[220px]"
          role="img"
          aria-label="نمودار فعالیت آگهی‌های ۳۰ روز اخیر"
        >
          <g className="text-border">
            {[0, 1, 2, 3, 4].map((line) => {
              const y = padY + (line / 4) * usableH;
              return (
                <line
                  key={line}
                  x1={padX}
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              );
            })}
          </g>

          {area && (
            <polygon
              points={area}
              fill="currentColor"
              className="text-primary opacity-[0.08]"
            />
          )}
          {polyline && (
            <polyline
              points={polyline}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            />
          )}

          {points.map((point, index) => (
            <circle
              key={point.date}
              cx={point.x}
              cy={point.y}
              r={index === points.length - 1 ? 4 : 2.3}
              fill="currentColor"
              className="text-[color:var(--gold)]"
            />
          ))}

          {labels.map((point) => (
            <text
              key={"label-" + point.date}
              x={point.x}
              y={height - 4}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {dateLabel(point.date)}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <span>بیشترین فعالیت روزانه: {faNum(max)}</span>
        <span>
          مجموع ۳۰ روز: {faNum(data.reduce((sum, item) => sum + item.count, 0))}
        </span>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const roleData = useQuery(api.roles.myRole, isAuthenticated ? {} : "skip");
  const settingsRow = useQuery(
    api.folders.getSettings,
    isAuthenticated ? {} : "skip",
  );
  const startListingMaintenance = useMutation(api.listings.startListingMaintenance);
  const [now] = useState(() => Date.now());
  const [today] = useState(() => todayJalaliString());
  const navigate = useNavigate();

  const role = roleData?.role ?? (isAuthenticated ? "user" : "guest");
  const isManager = role === "manager";
  const isAdmin = role === "admin";
  const isConsultant = role === "consultant";
  const isStaff = isManager || isAdmin || isConsultant;

  const maintenanceStartedRef = useRef(false);
  useEffect(() => {
    const needsMaintenance =
      !settingsRow?.listingKindMigrationDone ||
      !settingsRow?.listingSearchBackfillDone ||
      !settingsRow?.landingVisibilityMigrationDone ||
      !settingsRow?.listingCountsReady;

    if (
      !(isManager || isAdmin) ||
      !settingsRow ||
      !needsMaintenance ||
      maintenanceStartedRef.current
    ) {
      return;
    }

    maintenanceStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void startListingMaintenance().catch((error) => {
        maintenanceStartedRef.current = false;
        console.error("dashboard listing maintenance start failed", error);
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [
    isManager,
    isAdmin,
    settingsRow,
    startListingMaintenance,
  ]);

  const leadRows = useQuery(api.leads.listLeads, isStaff ? {} : "skip");
  const pendingPublications = useQuery(
    api.listings.listPendingPublications,
    isManager || isAdmin ? {} : "skip",
  );
  const users = useQuery(api.roles.listUsers, isManager ? {} : "skip");
  const allConversations = useQuery(
    api.advisorChat.listAllConversations,
    isManager ? {} : "skip",
  );
  const myConversations = useQuery(
    api.advisorChat.listConversations,
    isAuthenticated ? {} : "skip",
  );
  const reminderPanel = useQuery(
    api.reminders.listPanel,
    roleData?.isPrivileged ? { todayJalali: today, now } : "skip",
  );
  const memberCount = useQuery(
    api.listings.countListingsByView,
    isStaff ? { view: "member" } : "skip",
  );
  const importedCount = useQuery(
    api.listings.countListingsByView,
    isStaff ? { view: "imported" } : "skip",
  );
  const recentListings = useQuery(
    api.listings.listDashboardRecentListings,
    isStaff ? { limit: 5 } : "skip",
  );
  const listingTrend = useQuery(
    api.listings.dashboardListingTrend,
    isStaff ? { days: 30 } : "skip",
  );

  const activeLeads = Array.isArray(leadRows)
    ? leadRows.filter((lead: any) => lead.status !== "closed").length
    : 0;
  const unreadChats = Array.isArray(myConversations)
    ? myConversations.reduce(
        (sum: number, item: any) => sum + Number(item.unreadCount || 0),
        0,
      )
    : 0;
  const dueReminders = reminderPanel?.due?.length ?? 0;

  const managerCards: DashboardCard[] = [
    {
      title: "مدیریت آگهی‌ها",
      description: "فایل‌های اعضا، بانک ایمپورت، انتشار و خروجی اکسل.",
      to: "/dashboard/listings",
      icon: Building2,
    },
    {
      title: "متقاضی‌ها",
      description: "ثبت متقاضی جدید و پیگیری درخواست‌های مشتریان.",
      to: "/dashboard/leads",
      icon: UserRoundSearch,
      badge: activeLeads ? faNum(activeLeads) + " باز" : undefined,
    },
    {
      title: "گفتگوها",
      description: "پیام‌های کاربران و اعضای تیم و تاریخچه گفتگوها.",
      to: "/dashboard/chat",
      icon: MessageCircle,
      badge: unreadChats ? faNum(unreadChats) + " جدید" : undefined,
    },
    {
      title: "پیگیری‌ها",
      description: "یادآوری تماس و فایل‌هایی که موعد بررسی‌شان رسیده است.",
      to: "/dashboard/reminders",
      icon: BellRing,
      badge: dueReminders ? faNum(dueReminders) + " سررسید" : undefined,
    },
    {
      title: "تطبیق فایل و متقاضی",
      description: "فایل‌های نزدیک به نیاز ثبت‌شده مشتری را بررسی کنید.",
      to: "/dashboard/matches",
      icon: ClipboardList,
    },
    {
      title: "کاربران و مشاوران",
      description: "نقش‌ها، دسترسی‌ها و حساب‌های اعضای دیوساز.",
      to: "/admin?tab=users",
      icon: UsersRound,
    },
    {
      title: "صفحات سایت",
      description: "صفحه اصلی و برگه‌های عمومی سایت را مدیریت کنید.",
      to: "/dashboard/pages",
      icon: PanelsTopLeft,
    },
    {
      title: "محتوا و مقالات",
      description: "مقالات و محتوای راهنمای سایت را منتشر کنید.",
      to: "/dashboard/blog",
      icon: FileText,
    },
    {
      title: "پشتیبان‌گیری",
      description: "دانلود و بازیابی نسخه محلی داده‌های اصلی سایت.",
      to: "/admin?tab=backup",
      icon: DatabaseBackup,
    },
    {
      title: "تنظیمات",
      description: "اتصال‌ها، نقشه، دسته‌بندی‌ها و تنظیمات اجرایی.",
      to: "/admin?tab=source",
      icon: Settings,
    },
  ];

  const adminCards: DashboardCard[] = [
    {
      title: "مدیریت آگهی‌ها",
      description: "بانک ایمپورت، فایل‌های اعضا و انتشار عمومی.",
      to: "/dashboard/listings",
      icon: Building2,
    },
    {
      title: "متقاضی‌ها",
      description: "ثبت درخواست مشتری و پیگیری وضعیت تماس.",
      to: "/dashboard/leads",
      icon: UserRoundSearch,
      badge: activeLeads ? faNum(activeLeads) + " باز" : undefined,
    },
    {
      title: "گفتگو",
      description: "ارتباط مستقیم با مدیر و مشاوران.",
      to: "/dashboard/chat",
      icon: MessageCircle,
      badge: unreadChats ? faNum(unreadChats) + " جدید" : undefined,
    },
    {
      title: "پیگیری‌ها",
      description: "یادآوری‌ها و فایل‌های سررسیدشده را ببینید.",
      to: "/dashboard/reminders",
      icon: BellRing,
    },
    {
      title: "تطبیق فایل و متقاضی",
      description: "نیاز مشتری را با فایل‌های موجود مقایسه کنید.",
      to: "/dashboard/matches",
      icon: ClipboardList,
    },
    {
      title: "جستجو و راهنما",
      description: "فایل و اطلاعات موردنیاز را سریع پیدا کنید.",
      to: "/dashboard/assistant",
      icon: Search,
    },
  ];

  const consultantCards: DashboardCard[] = [
    {
      title: "فایل‌های من",
      description: "فایل‌های ثبت‌شده یا برداشته‌شده از بانک ایمپورت.",
      to: "/dashboard/listings",
      icon: Building2,
      badge: memberCount != null ? faNum(memberCount) + " فایل" : undefined,
    },
    {
      title: "متقاضی‌ها",
      description: "نیاز مشتری را ثبت کنید و درخواست‌های جاری را پیگیری کنید.",
      to: "/dashboard/leads",
      icon: UserRoundSearch,
      badge: activeLeads ? faNum(activeLeads) + " باز" : undefined,
    },
    {
      title: "گفتگو",
      description: "پیام‌های مشتریان، مدیر و اعضای تیم.",
      to: "/dashboard/chat",
      icon: MessageCircle,
      badge: unreadChats ? faNum(unreadChats) + " جدید" : undefined,
    },
    {
      title: "پیگیری امروز",
      description: "تماس‌ها و پرونده‌هایی که موعد پیگیری دارند.",
      to: "/dashboard/reminders",
      icon: BellRing,
      badge: dueReminders ? faNum(dueReminders) + " مورد" : undefined,
    },
    {
      title: "پروفایل من",
      description: "عکس، معرفی، تماس و صفحه عمومی مشاور.",
      to: "/dashboard/profile",
      icon: UserRound,
    },
    {
      title: "استوری",
      description: "فایل، خبر یا محتوای کوتاه برای مخاطبان منتشر کنید.",
      to: "/dashboard/stories",
      icon: Play,
    },
  ];

  const guestCards: DashboardCard[] = [
    {
      title: "آگهی‌های جدید",
      description: "فایل‌های فروش و اجاره دیوساز را ببینید.",
      to: "/listings",
      icon: Building2,
    },
    {
      title: "جستجوی ملک",
      description: "بین آگهی‌ها ملک مناسب خود را پیدا کنید.",
      to: "/listings",
      icon: Search,
    },
    {
      title: "ثبت درخواست ملک",
      description: "نیاز و بودجه خود را ثبت کنید تا پیگیری شود.",
      to: "/request",
      icon: ClipboardList,
    },
    {
      title: "ثبت آگهی",
      description: "ملک خود را برای بررسی و انتشار ثبت کنید.",
      to: "/submit-listing",
      icon: HandCoins,
    },
    {
      title: "گفتگو با مشاور",
      description: "از داخل سایت با مدیر یا مشاور دیوساز گفتگو کنید.",
      action: "chat",
      icon: MessageCircle,
    },
    {
      title: "راهنمای معاملات",
      description: "مطالب کاربردی خرید، فروش، اجاره و قرارداد.",
      to: "/blog",
      icon: BookOpen,
    },
  ];

  const cards = isManager
    ? managerCards
    : isAdmin
      ? adminCards
      : isConsultant
        ? consultantCards
        : guestCards;

  const metrics: Metric[] = isManager
    ? [
        {
          label: "کل آگهی‌ها",
          value:
            memberCount != null && importedCount != null
              ? faNum(memberCount + importedCount)
              : "…",
          icon: Building2,
          to: "/dashboard/listings",
        },
        {
          label: "بانک ایمپورت",
          value: importedCount != null ? faNum(importedCount) : "…",
          icon: DatabaseBackup,
          to: "/dashboard/listings",
        },
        {
          label: "متقاضی باز",
          value: faNum(activeLeads),
          icon: UserRoundSearch,
          to: "/dashboard/leads",
        },
        {
          label: "در انتظار انتشار",
          value: faNum(pendingPublications?.length ?? 0),
          icon: BellRing,
          to: "/dashboard/listings",
        },
        {
          label: "پیام خوانده‌نشده",
          value: faNum(unreadChats),
          icon: MessageCircle,
          to: "/dashboard/chat",
        },
        {
          label: "کاربران",
          value: faNum(users?.length ?? 0),
          icon: Users,
          to: "/admin?tab=users",
        },
      ]
    : isAdmin
      ? [
          {
            label: "کل آگهی‌ها",
            value:
              memberCount != null && importedCount != null
                ? faNum(memberCount + importedCount)
                : "…",
            icon: Building2,
            to: "/dashboard/listings",
          },
          {
            label: "بانک ایمپورت",
            value: importedCount != null ? faNum(importedCount) : "…",
            icon: DatabaseBackup,
            to: "/dashboard/listings",
          },
          {
            label: "متقاضی باز",
            value: faNum(activeLeads),
            icon: UserRoundSearch,
            to: "/dashboard/leads",
          },
          {
            label: "در انتظار انتشار",
            value: faNum(pendingPublications?.length ?? 0),
            icon: BellRing,
            to: "/dashboard/listings",
          },
        ]
      : isConsultant
        ? [
            {
              label: "فایل‌های من",
              value: memberCount != null ? faNum(memberCount) : "…",
              icon: Building2,
              to: "/dashboard/listings",
            },
            {
              label: "متقاضی باز",
              value: faNum(activeLeads),
              icon: UserRoundSearch,
              to: "/dashboard/leads",
            },
            {
              label: "پیگیری سررسید",
              value: faNum(dueReminders),
              icon: BellRing,
              to: "/dashboard/reminders",
            },
            {
              label: "پیام خوانده‌نشده",
              value: faNum(unreadChats),
              icon: MessageCircle,
              to: "/dashboard/chat",
            },
          ]
        : [];

  const sidebarCards = cards.slice(0, isManager ? 9 : 7);
  const displayName = roleData?.displayName?.trim();
  const welcomeTitle = isAuthenticated
    ? displayName
      ? displayName + "، خوش آمدید"
      : (ROLE_LABELS[role] || "کاربر") + " دیوساز، خوش آمدید"
    : "به دیوساز خوش آمدید";

  const welcomeText = isManager
    ? "وضعیت آگهی‌ها، متقاضی‌ها، پیام‌ها و کارهای در انتظار را از همین صفحه مدیریت کنید."
    : isAdmin
      ? "آگهی‌ها، متقاضی‌ها، انتشارها و پیگیری‌های روزانه در یک صفحه در دسترس شماست."
      : isConsultant
        ? "فایل‌ها، مشتری‌ها، گفتگوها و پیگیری‌های خود را از یک پنل دنبال کنید."
        : "آگهی‌ها را بررسی کنید، درخواست ملک ثبت کنید یا مستقیم با یکی از مشاوران دیوساز گفتگو کنید.";

  const logout = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || (isAuthenticated && roleData === undefined)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <img src="/divsaz-icon.svg" alt="" className="size-10 rounded-xl" />
          در حال آماده‌سازی پنل…
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-background pb-24 text-foreground lg:pb-0">
      <header className="sticky top-0 z-50 w-full max-w-[100dvw] border-b border-border/70 bg-background/90 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 w-full min-w-0 items-center justify-between gap-2 px-3 sm:px-5">
          <MekaBrand compact link />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => void logout()}
                aria-label="خروج"
              >
                <LogOut className="size-4" />
              </Button>
            ) : (
              <Button asChild size="sm" className="gap-1.5 rounded-xl">
                <Link to="/auth?mode=signIn&returnTo=/dashboard">
                  <LogIn className="size-4" />
                  ورود
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full min-w-0 max-w-full gap-0 lg:min-h-screen lg:max-w-[1600px]">
        <aside className="hidden w-[255px] shrink-0 border-l border-border/70 bg-card/70 lg:block">
          <div className="sticky top-0 flex h-screen flex-col p-4">
            <div className="px-2 py-2">
              <MekaBrand link />
            </div>

            <div className="mt-5 rounded-2xl border border-border/70 bg-background/60 p-3">
              <p className="text-xs font-black">
                {isAuthenticated ? ROLE_LABELS[role] || role : "مهمان"}
              </p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                {displayName || (isAuthenticated ? "پنل دیوساز" : "خدمات عمومی دیوساز")}
              </p>
            </div>

            <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto pe-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 rounded-xl bg-primary px-3 py-3 text-sm font-black text-primary-foreground shadow-sm"
              >
                <Home className="size-4" />
                داشبورد
              </Link>

              {sidebarCards.map((card) => {
                const Icon = card.icon;
                const className =
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-[13px] font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground";
                if (card.action === "chat") {
                  return (
                    <button
                      key={card.title}
                      type="button"
                      className={className}
                      onClick={openSiteChat}
                    >
                      <Icon className="size-4" />
                      <span className="min-w-0 flex-1 truncate">{card.title}</span>
                      {card.badge && (
                        <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[9px] text-destructive-foreground">
                          {card.badge}
                        </span>
                      )}
                    </button>
                  );
                }
                return (
                  <Link key={card.title} to={card.to || "/"} className={className}>
                    <Icon className="size-4" />
                    <span className="min-w-0 flex-1 truncate">{card.title}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-2 border-t border-border/70 pt-3">
              <Link
                to="/"
                className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2.5 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Globe2 className="size-4" />
                مشاهده سایت
              </Link>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="size-4" />
                  خروج از حساب
                </button>
              ) : (
                <Link
                  to="/auth?mode=signIn&returnTo=/dashboard"
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <LogIn className="size-4" />
                  ورود به حساب
                </Link>
              )}
            </div>
          </div>
        </aside>

        <section className="min-w-0 w-full max-w-full flex-1 overflow-x-clip px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-7">
          <div className="mb-4 hidden items-center justify-end gap-2 lg:flex">
            <ThemeToggle />
          </div>

          <section className="relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:rounded-[2rem] sm:p-7">
            <div className="pointer-events-none absolute -start-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -end-20 size-72 rounded-full bg-[color:var(--gold)]/10 blur-3xl" />
            <div className="relative grid min-w-0 gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src="/divsaz-icon.svg"
                    alt=""
                    className="size-12 rounded-2xl shadow-lg ring-1 ring-border sm:size-14"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-[color:var(--gold)]">
                      {isAuthenticated
                        ? "داشبورد " + (ROLE_LABELS[role] || role)
                        : "پنل خدمات دیوساز"}
                    </p>
                    <h1 className="mt-1 break-words text-xl font-black leading-8 sm:text-3xl">
                      {welcomeTitle}
                    </h1>
                  </div>
                </div>
                <p className="mt-5 max-w-3xl text-sm leading-8 text-muted-foreground">
                  {welcomeText}
                </p>
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-2">
                {(isStaff
                  ? [
                      {
                        title: "ثبت آگهی",
                        to: "/dashboard/listings",
                        icon: Building2,
                      },
                      {
                        title: "ثبت متقاضی",
                        to: "/dashboard/leads",
                        icon: UserRoundSearch,
                      },
                      {
                        title: "گفتگوها",
                        to: "/dashboard/chat",
                        icon: MessageCircle,
                      },
                      {
                        title: "پیگیری",
                        to: "/dashboard/reminders",
                        icon: BellRing,
                      },
                    ]
                  : [
                      { title: "آگهی‌ها", to: "/listings", icon: Search },
                      { title: "درخواست ملک", to: "/request", icon: ClipboardList },
                      { title: "ثبت آگهی", to: "/submit-listing", icon: HandCoins },
                      { title: "گفتگو", to: "#chat", icon: MessageCircle },
                    ]
                ).map((item) => {
                  const Icon = item.icon;
                  const className =
                    "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/70 p-3 text-center text-xs font-black transition hover:border-primary/30 hover:bg-muted";
                  if (item.to === "#chat") {
                    return (
                      <button key={item.title} type="button" className={className} onClick={openSiteChat}>
                        <Icon className="size-5 text-primary" />
                        {item.title}
                      </button>
                    );
                  }
                  return (
                    <Link key={item.title} to={item.to} className={className}>
                      <Icon className="size-5 text-primary" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {metrics.length > 0 && (
            <section className="mt-4 grid w-full min-w-0 grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                const body = (
                  <>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-xl font-black sm:text-2xl">
                        {metric.value}
                      </strong>
                      <span className="mt-1 block truncate text-[10px] font-bold text-muted-foreground sm:text-[11px]">
                        {metric.label}
                      </span>
                    </span>
                  </>
                );
                const cls =
                  "flex min-w-0 items-center gap-2.5 rounded-2xl border border-border/70 bg-card p-3 shadow-sm transition hover:border-primary/30 sm:gap-3 sm:p-3.5";
                return metric.to ? (
                  <Link key={metric.label} to={metric.to} className={cls}>
                    {body}
                  </Link>
                ) : (
                  <div key={metric.label} className={cls}>
                    {body}
                  </div>
                );
              })}
            </section>
          )}

          {isStaff && (
            <section className="mt-4 w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-black">روند فعالیت آگهی‌ها در ۳۰ روز اخیر</h2>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    ثبت، تکمیل و برداشتن فایل‌های اعضا؛ بر اساس داده واقعی پنل.
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black text-primary">
                  ۳۰ روز
                </span>
              </div>
              <ListingTrendChart data={listingTrend ?? []} />
            </section>
          )}

          {!isAuthenticated && (
            <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {guestCards.slice(0, 4).map((card) => (
                    <DashboardLinkCard key={card.title} card={card} />
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-5 text-[color:var(--gold)]" />
                  <h2 className="font-black">راهنمای شروع</h2>
                </div>
                <div className="mt-5 space-y-5">
                  {[
                    ["۱", "جستجو کنید", "آگهی‌های مناسب نیاز خود را بررسی کنید."],
                    ["۲", "درخواست ثبت کنید", "اگر فایل مناسب نبود مشخصات نیازتان را بفرستید."],
                    ["۳", "در تماس باشید", "از چت سایت با مشاور دیوساز گفتگو کنید."],
                  ].map(([n, title, text]) => (
                    <div key={n} className="flex gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-xs font-black text-[color:var(--gold)]">
                        {n}
                      </span>
                      <div>
                        <p className="text-xs font-black">{title}</p>
                        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" className="mt-5 w-full" onClick={openSiteChat}>
                  <MessageCircle className="size-4" />
                  شروع گفتگو
                </Button>
              </div>
            </section>
          )}

          {isStaff && (
            <>
              <section className="mt-5 grid w-full min-w-0 max-w-full gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div>
                      <h2 className="font-black">آخرین آگهی‌های اعضا</h2>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        فایل‌های تازه ثبت یا برداشته‌شده
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/dashboard/listings">مشاهده همه</Link>
                    </Button>
                  </div>

                  <div className="mt-4 min-w-0 max-w-full">
                    <div className="space-y-2 sm:hidden">
                      {(recentListings ?? []).map((item: any) => (
                        <div
                          key={item.id}
                          className="min-w-0 rounded-2xl border border-border/60 bg-background/55 p-3"
                        >
                          <strong className="block break-words text-xs leading-6">
                            {item.title || (item.propertyType + " در " + item.city)}
                          </strong>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="rounded-full bg-muted px-2 py-1">
                              {item.dealType || "—"}
                            </span>
                            <span
                              className={
                                "rounded-full px-2 py-1 font-bold " +
                                (item.isPublic
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : item.publicationStatus === "pending"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                    : "bg-muted text-muted-foreground")
                              }
                            >
                              {item.isPublic
                                ? "منتشرشده"
                                : item.publicationStatus === "pending"
                                  ? "در انتظار"
                                  : "داخلی"}
                            </span>
                            <span>{item.date || "—"}</span>
                          </div>
                          <p className="mt-2 break-words text-[10px] leading-5 text-muted-foreground">
                            {item.area ? faNum(item.area) + " متر" : "متراژ درج نشده"}
                            {item.priceMillion > 0
                              ? " · " + formatPrice(item.priceMillion)
                              : ""}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="hidden max-w-full overflow-x-auto sm:block">
                      <div className="min-w-[620px]">
                        <div className="grid grid-cols-[minmax(220px,1fr)_100px_100px_110px] gap-3 border-b border-border/70 px-2 pb-2 text-[10px] font-bold text-muted-foreground">
                          <span>عنوان</span>
                          <span>نوع</span>
                          <span>وضعیت</span>
                          <span>تاریخ</span>
                        </div>
                        {(recentListings ?? []).map((item: any) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-[minmax(220px,1fr)_100px_100px_110px] items-center gap-3 border-b border-border/50 px-2 py-3 text-xs last:border-0"
                          >
                            <span className="min-w-0">
                              <strong className="block truncate">
                                {item.title || (item.propertyType + " در " + item.city)}
                              </strong>
                              <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                                {item.area ? faNum(item.area) + " متر" : "متراژ درج نشده"}
                                {item.priceMillion > 0
                                  ? " · " + formatPrice(item.priceMillion)
                                  : ""}
                              </span>
                            </span>
                            <span>{item.dealType}</span>
                            <span>
                              <span
                                className={
                                  "rounded-full px-2 py-1 text-[10px] font-bold " +
                                  (item.isPublic
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : item.publicationStatus === "pending"
                                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                      : "bg-muted text-muted-foreground")
                                }
                              >
                                {item.isPublic
                                  ? "منتشرشده"
                                  : item.publicationStatus === "pending"
                                    ? "در انتظار"
                                    : "داخلی"}
                              </span>
                            </span>
                            <span className="text-muted-foreground">{item.date || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(recentListings ?? []).length === 0 && (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        هنوز آگهی اعضا ثبت نشده است.
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
                  <h2 className="font-black">دسترسی سریع</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {cards.slice(0, 6).map((card) => {
                      const Icon = card.icon;
                      const cls =
                        "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/60 p-3 text-center text-[11px] font-black transition hover:border-primary/30 hover:bg-muted";
                      if (card.action === "chat") {
                        return (
                          <button key={card.title} type="button" className={cls} onClick={openSiteChat}>
                            <Icon className="size-5 text-primary" />
                            {card.title}
                          </button>
                        );
                      }
                      return (
                        <Link key={card.title} to={card.to || "/"} className={cls}>
                          <Icon className="size-5 text-primary" />
                          {card.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="mt-4 grid w-full min-w-0 max-w-full gap-4 lg:grid-cols-2 xl:grid-cols-3">
                <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-black">آخرین متقاضی‌ها</h2>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/dashboard/leads">همه</Link>
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(leadRows ?? []).slice(0, 4).map((lead: any) => (
                      <div key={String(lead._id)} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                          {(lead.name || "م").slice(0, 1)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-xs">{lead.name}</strong>
                          <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                            {INTENT_LABELS[lead.intent] || lead.intent} · {lead.propertyType} · {lead.city}
                          </span>
                        </span>
                      </div>
                    ))}
                    {(leadRows ?? []).length === 0 && (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        متقاضی جدیدی ثبت نشده است.
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-black">آخرین گفتگوها</h2>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/dashboard/chat">همه</Link>
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(myConversations ?? []).slice(0, 4).map((conversation: any) => (
                      <Link
                        key={String(conversation.id)}
                        to="/dashboard/chat"
                        className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3 transition hover:bg-muted"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                          {(conversation.other?.displayName || "گ").slice(0, 1)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-xs">
                            {conversation.other?.displayName || "گفتگو"}
                          </strong>
                          <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                            {conversation.lastMessage || "بدون پیام"}
                          </span>
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-black text-destructive-foreground">
                            {faNum(conversation.unreadCount)}
                          </span>
                        )}
                      </Link>
                    ))}
                    {(myConversations ?? []).length === 0 && (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        گفتگویی وجود ندارد.
                      </p>
                    )}
                  </div>
                </div>

                <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-sm lg:col-span-2 xl:col-span-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-[color:var(--gold)]" />
                    <h2 className="font-black">وضعیت کارهای امروز</h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Link to="/dashboard/listings" className="flex items-center justify-between rounded-2xl bg-muted/50 p-3">
                      <span className="text-xs font-bold">در انتظار انتشار</span>
                      <strong>{faNum(pendingPublications?.length ?? 0)}</strong>
                    </Link>
                    <Link to="/dashboard/reminders" className="flex items-center justify-between rounded-2xl bg-muted/50 p-3">
                      <span className="text-xs font-bold">پیگیری سررسید</span>
                      <strong>{faNum(dueReminders)}</strong>
                    </Link>
                    <Link to="/dashboard/chat" className="flex items-center justify-between rounded-2xl bg-muted/50 p-3">
                      <span className="text-xs font-bold">پیام خوانده‌نشده</span>
                      <strong>{faNum(unreadChats)}</strong>
                    </Link>
                  </div>
                </div>
              </section>
            </>
          )}

          <section className="mt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">
                  {isAuthenticated ? "همه بخش‌های در دسترس" : "خدمات دیوساز"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  مستقیم وارد بخش موردنظر شوید.
                </p>
              </div>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/">
                  سایت دیوساز
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <DashboardLinkCard key={card.title} card={card} />
              ))}
            </div>
          </section>
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 w-[100dvw] max-w-[100dvw] border-t border-border/70 bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          <Link
            to="/dashboard"
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-primary/10 text-[10px] font-black text-primary"
          >
            <Home className="size-5" />
            خانه
          </Link>

          <Link
            to={isStaff ? "/dashboard/listings" : "/listings"}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Building2 className="size-5" />
            آگهی‌ها
          </Link>

          <Link
            to={isStaff ? "/dashboard/leads" : "/request"}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {isStaff ? (
              <UserRoundSearch className="size-5" />
            ) : (
              <ClipboardList className="size-5" />
            )}
            {isStaff ? "متقاضی‌ها" : "درخواست ملک"}
          </Link>

          <button
            type="button"
            onClick={openSiteChat}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <MessageCircle className="size-5" />
            گفتگو
          </button>
        </div>
      </nav>
    </main>
  );
}
