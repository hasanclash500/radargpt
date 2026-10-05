import MekaBrand from "@/components/MekaBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { todayJalaliString } from "@/lib/jalali";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  BellRing,
  BookOpen,
  Bot,
  Building2,
  ClipboardList,
  FileText,
  Globe2,
  HandCoins,
  KeyRound,
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
import { useState } from "react";
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

type StatItem = {
  label: string;
  value: string;
  icon: typeof Building2;
  to?: string;
};

function openSiteChat() {
  window.dispatchEvent(new CustomEvent("divsaz-open-chat"));
}

export default function DashboardHome() {
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const roleData = useQuery(api.roles.myRole, isAuthenticated ? {} : "skip");
  const [now] = useState(() => Date.now());
  const [today] = useState(() => todayJalaliString());
  const navigate = useNavigate();

  const role = roleData?.role ?? (isAuthenticated ? "user" : "guest");
  const isManager = role === "manager";
  const isAdmin = role === "admin";
  const isConsultant = role === "consultant";
  const isStaff = isManager || isAdmin || isConsultant;

  const leadRows = useQuery(
    api.leads.listLeads,
    isStaff ? {} : "skip",
  );
  const pendingPublications = useQuery(
    api.listings.listPendingPublications,
    isManager || isAdmin ? {} : "skip",
  );
  const users = useQuery(
    api.roles.listUsers,
    isManager ? {} : "skip",
  );
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
      description: "ثبت، ویرایش، انتشار و بررسی فایل‌های ملکی.",
      to: "/dashboard/listings",
      icon: Building2,
    },
    {
      title: "متقاضی‌ها",
      description: "درخواست‌های مشتریان، وضعیت تماس و ثبت متقاضی جدید.",
      to: "/dashboard/leads",
      icon: UserRoundSearch,
      badge: activeLeads ? `${activeLeads.toLocaleString("fa-IR")} باز` : undefined,
    },
    {
      title: "گفتگوها",
      description: "پیام‌های کاربران و مشاوران و دسترسی مدیر به تاریخچه.",
      to: "/dashboard/chat",
      icon: MessageCircle,
      badge: unreadChats ? `${unreadChats.toLocaleString("fa-IR")} خوانده‌نشده` : undefined,
    },
    {
      title: "پیگیری‌ها",
      description: "یادآوری تماس و فایل‌هایی که موعد بررسی‌شان رسیده است.",
      to: "/dashboard/reminders",
      icon: BellRing,
      badge: dueReminders ? `${dueReminders.toLocaleString("fa-IR")} سررسید` : undefined,
    },
    {
      title: "تطبیق فایل و متقاضی",
      description: "بررسی فایل‌های نزدیک به نیاز ثبت‌شده مشتری.",
      to: "/dashboard/matches",
      icon: ClipboardList,
    },
    {
      title: "کاربران و دسترسی‌ها",
      description: "مدیریت مدیر، ادمین، مشاور و حساب‌های کاربری.",
      to: "/admin?tab=users",
      icon: UsersRound,
    },
    {
      title: "صفحات سایت",
      description: "مدیریت صفحه اصلی و برگه‌های عمومی سایت.",
      to: "/dashboard/pages",
      icon: PanelsTopLeft,
    },
    {
      title: "محتوا و مقالات",
      description: "نوشتن، ویرایش و انتشار مطالب وبلاگ.",
      to: "/dashboard/blog",
      icon: FileText,
    },
    {
      title: "استوری",
      description: "انتشار و زمان‌بندی محتوای کوتاه سایت.",
      to: "/dashboard/stories",
      icon: Play,
    },
    {
      title: "پروفایل مشاور",
      description: "اطلاعات عمومی، راه‌های تماس و صفحه معرفی.",
      to: "/dashboard/profile",
      icon: UserRound,
    },
    {
      title: "جستجو و راهنما",
      description: "جستجوی سریع فایل‌ها و پاسخ به پرسش‌های ملکی.",
      to: "/dashboard/assistant",
      icon: Bot,
    },
    {
      title: "تنظیمات",
      description: "اتصال‌ها، دسته‌بندی‌ها، نقشه و تنظیمات اجرایی.",
      to: "/admin?tab=source",
      icon: Settings,
    },
  ];

  const adminCards: DashboardCard[] = [
    {
      title: "مدیریت آگهی‌ها",
      description: "ویرایش، انتشار و کنترل فایل‌های ثبت‌شده.",
      to: "/dashboard/listings",
      icon: Building2,
    },
    {
      title: "متقاضی‌ها",
      description: "ثبت درخواست مشتری و پیگیری وضعیت تماس.",
      to: "/dashboard/leads",
      icon: UserRoundSearch,
      badge: activeLeads ? `${activeLeads.toLocaleString("fa-IR")} باز` : undefined,
    },
    {
      title: "گفتگو",
      description: "ارتباط مستقیم با مدیر و مشاوران.",
      to: "/dashboard/chat",
      icon: MessageCircle,
      badge: unreadChats ? `${unreadChats.toLocaleString("fa-IR")} جدید` : undefined,
    },
    {
      title: "پیگیری‌ها",
      description: "بررسی یادآوری‌ها و فایل‌های سررسیدشده.",
      to: "/dashboard/reminders",
      icon: BellRing,
      badge: dueReminders ? `${dueReminders.toLocaleString("fa-IR")} سررسید` : undefined,
    },
    {
      title: "تطبیق فایل و متقاضی",
      description: "مقایسه نیاز مشتری با فایل‌های موجود.",
      to: "/dashboard/matches",
      icon: ClipboardList,
    },
    {
      title: "جستجو و راهنما",
      description: "پیدا کردن سریع فایل و اطلاعات موردنیاز.",
      to: "/dashboard/assistant",
      icon: Search,
    },
    {
      title: "تنظیمات آگهی",
      description: "دسته‌بندی، فیلدها، منبع داده و تنظیمات مرتبط.",
      to: "/admin?tab=source",
      icon: Settings,
    },
  ];

  const consultantCards: DashboardCard[] = [
    {
      title: "فایل‌های من",
      description: "ثبت و مدیریت فایل‌هایی که به شما اختصاص دارد.",
      to: "/dashboard/listings",
      icon: Building2,
    },
    {
      title: "متقاضی‌ها",
      description: "ثبت نیاز مشتری و پیگیری درخواست‌های جاری.",
      to: "/dashboard/leads",
      icon: UserRoundSearch,
      badge: activeLeads ? `${activeLeads.toLocaleString("fa-IR")} باز` : undefined,
    },
    {
      title: "گفتگو",
      description: "پیام‌های مشتریان، مدیر و اعضای تیم.",
      to: "/dashboard/chat",
      icon: MessageCircle,
      badge: unreadChats ? `${unreadChats.toLocaleString("fa-IR")} جدید` : undefined,
    },
    {
      title: "پیگیری امروز",
      description: "موعدهای تماس و پرونده‌هایی که نیاز به پیگیری دارند.",
      to: "/dashboard/reminders",
      icon: BellRing,
      badge: dueReminders ? `${dueReminders.toLocaleString("fa-IR")} مورد` : undefined,
    },
    {
      title: "پروفایل من",
      description: "عکس، معرفی، شماره تماس و صفحه عمومی شما.",
      to: "/dashboard/profile",
      icon: UserRound,
    },
    {
      title: "استوری",
      description: "انتشار فایل، خبر یا محتوای کوتاه برای مخاطبان.",
      to: "/dashboard/stories",
      icon: Play,
    },
    {
      title: "جستجو و راهنما",
      description: "جستجو در فایل‌ها و دسترسی سریع به اطلاعات ملکی.",
      to: "/dashboard/assistant",
      icon: Search,
    },
  ];

  const userCards: DashboardCard[] = [
    {
      title: "آگهی‌های دیوساز",
      description: "فایل‌های فروش و اجاره را بر اساس نوع ملک و محدوده ببینید.",
      to: "/listings",
      icon: Search,
    },
    {
      title: "درخواست ملک",
      description: "نیاز، محدوده و بودجه خود را ثبت کنید تا بررسی شود.",
      to: "/request",
      icon: ClipboardList,
    },
    {
      title: "ثبت آگهی",
      description: "برای فروش یا اجاره ملک، مشخصات فایل را ارسال کنید.",
      to: "/submit-listing",
      icon: HandCoins,
    },
    {
      title: "گفتگو با مشاور",
      description: "از همین سایت با مدیر یا یکی از مشاوران گفتگو کنید.",
      action: "chat",
      icon: MessageCircle,
      badge: unreadChats ? `${unreadChats.toLocaleString("fa-IR")} جدید` : undefined,
    },
    {
      title: "راهنمای معاملات",
      description: "مطالب کاربردی درباره خرید، فروش، اجاره و قراردادها.",
      to: "/blog",
      icon: BookOpen,
    },
    {
      title: "جستجو و راهنما",
      description: "ملک موردنظر را توضیح دهید یا سؤال خود را مطرح کنید.",
      to: "/assistant",
      icon: Bot,
    },
  ];

  const cards =
    isManager
      ? managerCards
      : isAdmin
        ? adminCards
        : isConsultant
          ? consultantCards
          : userCards;

  const stats: StatItem[] = isManager
    ? [
        {
          label: "متقاضی باز",
          value: activeLeads.toLocaleString("fa-IR"),
          icon: UserRoundSearch,
          to: "/dashboard/leads",
        },
        {
          label: "در انتظار انتشار",
          value: (pendingPublications?.length ?? 0).toLocaleString("fa-IR"),
          icon: Globe2,
          to: "/dashboard/listings",
        },
        {
          label: "گفتگوهای ثبت‌شده",
          value: (allConversations?.length ?? 0).toLocaleString("fa-IR"),
          icon: MessageCircle,
          to: "/dashboard/chat",
        },
        {
          label: "کاربران",
          value: (users?.length ?? 0).toLocaleString("fa-IR"),
          icon: Users,
          to: "/admin?tab=users",
        },
      ]
    : isAdmin
      ? [
          {
            label: "متقاضی باز",
            value: activeLeads.toLocaleString("fa-IR"),
            icon: UserRoundSearch,
            to: "/dashboard/leads",
          },
          {
            label: "انتشار در انتظار",
            value: (pendingPublications?.length ?? 0).toLocaleString("fa-IR"),
            icon: Globe2,
            to: "/dashboard/listings",
          },
          {
            label: "پیام خوانده‌نشده",
            value: unreadChats.toLocaleString("fa-IR"),
            icon: MessageCircle,
            to: "/dashboard/chat",
          },
          {
            label: "پیگیری سررسید",
            value: dueReminders.toLocaleString("fa-IR"),
            icon: BellRing,
            to: "/dashboard/reminders",
          },
        ]
      : isConsultant
        ? [
            {
              label: "متقاضی باز",
              value: activeLeads.toLocaleString("fa-IR"),
              icon: UserRoundSearch,
              to: "/dashboard/leads",
            },
            {
              label: "پیگیری سررسید",
              value: dueReminders.toLocaleString("fa-IR"),
              icon: BellRing,
              to: "/dashboard/reminders",
            },
            {
              label: "پیام خوانده‌نشده",
              value: unreadChats.toLocaleString("fa-IR"),
              icon: MessageCircle,
              to: "/dashboard/chat",
            },
          ]
        : [];

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

  const displayName = roleData?.displayName?.trim();
  const welcomeTitle = isAuthenticated
    ? displayName
      ? `${displayName}، خوش آمدید`
      : `${ROLE_LABELS[role] || "کاربر"} دیوساز، خوش آمدید`
    : "به دیوساز خوش آمدید";

  const welcomeText = isManager
    ? "وضعیت کارهای مهم را از همین صفحه ببینید و مستقیم وارد بخش موردنظر شوید."
    : isAdmin
      ? "کارهای مربوط به آگهی، متقاضی و پیگیری روزانه از اینجا در دسترس است."
      : isConsultant
        ? "فایل‌ها، مشتری‌ها، پیام‌ها و پیگیری‌های خود را از این صفحه دنبال کنید."
        : "برای پیدا کردن ملک از آگهی‌ها شروع کنید. اگر فایل مناسب پیدا نکردید، درخواست خود را ثبت کنید یا از گفتگوی سایت با مشاور در تماس باشید.";

  return (
    <main dir="rtl" className="min-h-screen bg-[#f6f7f9] text-slate-950 dark:bg-[#061522] dark:text-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#071a2a]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <MekaBrand compact link />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl"
                onClick={() => void logout()}
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            ) : (
              <Button asChild size="sm" className="gap-1.5 rounded-xl bg-[#082f54] text-white hover:bg-[#0b3d6d]">
                <Link to="/auth?mode=signIn&returnTo=/dashboard">
                  <LogIn className="size-4" />
                  ورود
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-3 py-5 sm:px-6 sm:py-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0a2134]">
            <div className="border-b border-slate-100 p-4 dark:border-white/10">
              <p className="text-xs font-black text-[#0a3157] dark:text-[#e0b458]">
                {isAuthenticated ? ROLE_LABELS[role] || role : "دسترسی سریع"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                {isAuthenticated ? "بخش‌های در دسترس شما" : "خدمات اصلی دیوساز"}
              </p>
            </div>

            <nav className="space-y-1 p-2">
              {cards.slice(0, 9).map((card) => {
                const Icon = card.icon;
                const className =
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5";
                if (card.action === "chat") {
                  return (
                    <button key={card.title} type="button" className={className} onClick={openSiteChat}>
                      <Icon className="size-4 text-[#b48735]" />
                      <span className="min-w-0 flex-1 truncate">{card.title}</span>
                    </button>
                  );
                }
                return (
                  <Link key={card.title} to={card.to || "/"} className={className}>
                    <Icon className="size-4 text-[#b48735]" />
                    <span className="min-w-0 flex-1 truncate">{card.title}</span>
                  </Link>
                );
              })}

              <Link
                to="/"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <Globe2 className="size-4" />
                سایت عمومی
              </Link>
            </nav>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#082f54] p-6 text-white shadow-xl sm:p-8">
            <div className="pointer-events-none absolute -start-16 -top-20 size-64 rounded-full bg-[#d8ad58]/10 blur-3xl" />
            <div className="pointer-events-none absolute -end-20 bottom-[-100px] size-72 rounded-full bg-white/5 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <img
                    src="/divsaz-icon.svg"
                    alt=""
                    className="size-12 rounded-2xl shadow-lg ring-1 ring-white/15 sm:size-14"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#e0b458]">
                      {isAuthenticated ? `پنل ${ROLE_LABELS[role] || role}` : "راهنمای مراجعه‌کنندگان"}
                    </p>
                    <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                      {welcomeTitle}
                    </h1>
                  </div>
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-200">
                  {welcomeText}
                </p>
              </div>

              {!isAuthenticated && (
                <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
                  <Button asChild className="h-12 rounded-xl bg-[#d5a84d] font-black text-[#082f54] hover:bg-[#e2ba67]">
                    <Link to="/listings">
                      <Search className="size-4" />
                      مشاهده آگهی‌ها
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl border-white/20 bg-white/5 font-black text-white hover:bg-white/10 hover:text-white"
                    onClick={openSiteChat}
                  >
                    <MessageCircle className="size-4" />
                    گفتگو با مشاور
                  </Button>
                </div>
              )}
            </div>
          </div>

          {stats.length > 0 && (
            <div className={"mt-4 grid gap-3 " + (stats.length === 3 ? "sm:grid-cols-3" : "grid-cols-2 xl:grid-cols-4")}>
              {stats.map((stat) => {
                const Icon = stat.icon;
                const body = (
                  <>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#082f54]/7 text-[#0a3157] dark:bg-[#d8ad58]/10 dark:text-[#e0b458]">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-2xl font-black">{stat.value}</span>
                      <span className="mt-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">{stat.label}</span>
                    </span>
                  </>
                );
                const className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#d8ad58]/50 dark:border-white/10 dark:bg-[#0a2134]";
                return stat.to ? (
                  <Link key={stat.label} to={stat.to} className={className}>
                    {body}
                  </Link>
                ) : (
                  <div key={stat.label} className={className}>{body}</div>
                );
              })}
            </div>
          )}

          {!isAuthenticated && (
            <div className="mt-4 rounded-2xl border border-[#d8ad58]/25 bg-[#fffaf0] p-4 dark:border-[#d8ad58]/20 dark:bg-[#d8ad58]/5">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#a87927] dark:text-[#e0b458]" />
                <div>
                  <h2 className="text-sm font-black">مسیر پیشنهادی</h2>
                  <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                    ابتدا آگهی‌ها را بررسی کنید. اگر گزینه مناسب نبود، درخواست ملک ثبت کنید. برای سؤال یا هماهنگی مستقیم هم دکمه گفتگوی سایت همیشه در دسترس است.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black sm:text-xl">
                {isAuthenticated ? "بخش‌های کاری" : "خدمات موردنیاز شما"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                مستقیم وارد بخش موردنظر شوید.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden gap-1 sm:inline-flex">
              <Link to="/">
                سایت دیوساز
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              const body = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-[#082f54] text-white shadow-sm">
                      <Icon className="size-5" />
                    </span>
                    {card.badge && (
                      <span className="rounded-full bg-[#d8ad58]/12 px-2.5 py-1 text-[9px] font-black text-[#93691e] dark:text-[#e0b458]">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-black">{card.title}</h3>
                  <p className="mt-2 min-h-12 text-xs leading-6 text-slate-500 dark:text-slate-400">
                    {card.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-black text-[#9b7127] dark:text-[#e0b458]">
                    ادامه
                    <ArrowLeft className="size-3.5" />
                  </div>
                </>
              );
              const className =
                "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#d8ad58]/55 hover:shadow-md dark:border-white/10 dark:bg-[#0a2134]";

              return card.action === "chat" ? (
                <button
                  key={card.title}
                  type="button"
                  onClick={openSiteChat}
                  className={className + " text-right"}
                >
                  {body}
                </button>
              ) : (
                <Link key={card.title} to={card.to || "/"} className={className}>
                  {body}
                </Link>
              );
            })}
          </div>

          {!isAuthenticated && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row dark:border-white/10 dark:bg-[#0a2134]">
              <div>
                <p className="text-sm font-black">حساب دیوساز دارید؟</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  برای مشاهده پیام‌ها و امکانات حساب وارد شوید.
                </p>
              </div>
              <Button asChild className="w-full gap-2 rounded-xl bg-[#082f54] text-white hover:bg-[#0b3d6d] sm:w-auto">
                <Link to="/auth?mode=signIn&returnTo=/dashboard">
                  <LogIn className="size-4" />
                  ورود به حساب
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
