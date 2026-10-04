import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { usePaginatedQuery, useQuery } from "convex/react";
import {
  BellRing,
  BookOpen,
  Bot,
  BrainCircuit,
  Building2,
  FileText,
  LayoutDashboard,
  MessageCircle,
  PanelsTopLeft,
  LogOut,
  Settings,
  Sparkles,
  UserRoundSearch,
  UserRound,
  Play,
  Users,
} from "lucide-react";
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
  to: string;
  icon: typeof Building2;
  badge?: string;
  restricted?: boolean;
};

export default function DashboardHome() {
  const roleData = useQuery(api.roles.myRole, {});
  const leadRows = useQuery(
    api.leads.listLeads,
    roleData?.canManageListings ? {} : "skip",
  );
  const { results: listingPages } = usePaginatedQuery(
    api.listings.listListings,
    {},
    { initialNumItems: 1 },
  );
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const role = roleData?.role ?? "guest";
  const isManager = roleData?.canManageSite ?? false;
  const canManageListings = roleData?.canManageListings ?? false;
  const isPrivileged = roleData?.isPrivileged ?? false;
  const listingCountKnown = listingPages.flat().length;
  const activeLeads = Array.isArray(leadRows)
    ? leadRows.filter((lead: any) => lead.status !== "closed").length
    : 0;

  const cards: DashboardCard[] = [
    {
      title: "آگهی‌ها",
      description:
        "جستجو، فیلتر، ویرایش، ثبت دستی، ورود فایل و مدیریت فایل‌های ملکی.",
      to: "/dashboard/listings",
      icon: Building2,
      badge: listingCountKnown > 0 ? "فایل‌های ملکی" : undefined,
      restricted: !isPrivileged,
    },
    {
      title: "دستیار هوشمند مکا",
      description:
        "جستجوی کلامی و صوتی در آگهی‌های خود مکا و پاسخ اطلاعات ملکی و حقوقی.",
      to: "/dashboard/assistant",
      icon: Bot,
      badge: "AI",
    },
    {
      title: "چت مشاوران",
      description:
        "گفت‌وگوی خصوصی و لحظه‌ای بین مدیر و مشاوران مکا در یک صفحه مستقل.",
      to: "/dashboard/chat",
      icon: MessageCircle,
      badge: "داخلی",
      restricted: !(role === "manager" || role === "consultant"),
    },
    {
      title: "پروفایل مشاور",
      description:
        "بیوگرافی، عکس پروفایل، تلفن، واتساپ، اینستاگرام، تلگرام و صفحه عمومی خودتان.",
      to: "/dashboard/profile",
      icon: UserRound,
      badge: "عمومی",
      restricted: !(role === "manager" || role === "consultant"),
    },
    {
      title: "مدیریت استوری",
      description:
        "ساخت استوری عکس، ویدئو ۱۵ ثانیه، متن، لینک و استیکر برای نمایش عمومی.",
      to: "/dashboard/stories",
      icon: Play,
      badge: "Story",
      restricted: !(role === "manager" || role === "consultant"),
    },
    {
      title: "متقاضی‌ها",
      description:
        "درخواست‌های خرید و اجاره ثبت‌شده از سایت، وضعیت تماس و پیگیری مشتری.",
      to: "/dashboard/leads",
      icon: UserRoundSearch,
      badge: activeLeads > 0 ? activeLeads.toLocaleString("fa-IR") + " فعال" : undefined,
      restricted: !canManageListings,
    },
    {
      title: "مچ هوشمند",
      description:
        "تطبیق خودکار متقاضی‌ها با نزدیک‌ترین فایل‌های موجود در دیتابیس مکا.",
      to: "/dashboard/matches",
      icon: BrainCircuit,
      badge: "هوشمند",
      restricted: !canManageListings,
    },
    {
      title: "یادآوری پیگیری",
      description:
        "آگهی‌های قدیمی، دو یادآوری قابل تنظیم و پرونده‌های سررسیدشده برای تماس.",
      to: "/dashboard/reminders",
      icon: BellRing,
      restricted: !isPrivileged,
    },
    {
      title: "کاربران و نقش‌ها",
      description:
        "مدیریت کاربران، مشاوران، ادمین‌ها، نقش‌ها و سطح دسترسی هر حساب.",
      to: "/admin?tab=users",
      icon: Users,
      restricted: !isManager,
    },
    {
      title: "تنظیمات سیستم",
      description:
        "منبع آگهی، اطلاعات دفتر، دسته‌بندی‌ها، فیلدها، زونکن‌ها، نقشه و اتصال‌ها؛ هر کدام در تب مستقل.",
      to: "/admin?tab=source",
      icon: Settings,
      restricted: !canManageListings,
    },
    {
      title: "صفحه‌ساز سایت",
      description:
        "ویرایش سکشن‌های لندینگ، ساخت برگه جدید، پیش‌نمایش و ساخت صفحه با هوش مصنوعی.",
      to: "/dashboard/pages",
      icon: PanelsTopLeft,
      badge: "Page Builder",
      restricted: !isManager,
    },
    {
      title: "استودیوی محتوا",
      description:
        "نوشتن و مدیریت مقاله‌های وبلاگ و تنظیمات سئوی محتوای مکا.",
      to: "/dashboard/blog",
      icon: FileText,
      restricted: !isManager,
    },
  ];

  const visibleCards = cards.filter((card) => !card.restricted);

  const logout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-muted/30">
      <header className="glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <LayoutDashboard className="size-5" />
            </span>
            <div>
              <h1 className="text-sm font-black sm:text-base">داشبورد مکا</h1>
              <p className="text-[10px] text-muted-foreground">
                {ROLE_LABELS[role] || role}
                {roleData?.displayName ? " · " + roleData.displayName : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void logout()}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-3 py-5 sm:px-6 sm:py-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-2 rounded-3xl border border-border/70 bg-card p-3 shadow-sm">
            <div className="px-2 pb-2 pt-1">
              <p className="text-[10px] font-extrabold text-primary">پنل کاری مکا</p>
              <p className="mt-1 text-xs text-muted-foreground">
                هر ابزار در بخش مستقل
              </p>
            </div>
            {visibleCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.to}
                  to={card.to}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-colors hover:bg-muted"
                >
                  <Icon className="size-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{card.title}</span>
                </Link>
              );
            })}
            <Link
              to="/"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <BookOpen className="size-4" />
              سایت عمومی مکا
            </Link>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-extrabold text-primary">
                  <Sparkles className="size-3.5" />
                  مرکز کنترل مکا
                </span>
                <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                  امروز روی چه بخشی کار می‌کنید؟
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                  بخش‌های عملیاتی از هم جدا شده‌اند تا آگهی‌ها، مشتری‌ها،
                  هوش مصنوعی و تنظیمات در یک صفحه شلوغ روی هم قرار نگیرند.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 md:w-64">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-center">
                  <Building2 className="mx-auto size-5 text-primary" />
                  <p className="mt-2 text-[10px] text-muted-foreground">آگهی‌ها</p>
                  <p className="mt-1 text-sm font-black">مدیریت مستقل</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-center">
                  <Users className="mx-auto size-5 text-primary" />
                  <p className="mt-2 text-[10px] text-muted-foreground">نقش</p>
                  <p className="mt-1 text-sm font-black">{ROLE_LABELS[role] || role}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.to}
                  to={card.to}
                  className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                      <Icon className="size-5" />
                    </span>
                    {card.badge && (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[9px] font-extrabold text-muted-foreground">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-black">{card.title}</h3>
                  <p className="mt-2 min-h-12 text-xs leading-6 text-muted-foreground">
                    {card.description}
                  </p>
                  <div className="mt-4 text-xs font-extrabold text-primary">
                    ورود به بخش ←
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
