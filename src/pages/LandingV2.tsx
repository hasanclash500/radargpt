import FavoriteButton from "@/components/listings/FavoriteButton";
import ListingPlaceholder from "@/components/listings/ListingPlaceholder";
import MekaBrand from "@/components/MekaBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { formatArea, formatPrice, formatRooms } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  Building2,
  Factory,
  FilePlus2,
  Heart,
  Home,
  Info,
  KeyRound,
  LogIn,
  MapPin,
  Menu,
  PhoneCall,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Warehouse,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";

const INTENTS = [
  {
    label: "می‌خرم",
    to: "/listings?deal=فروش",
    icon: Home,
    tone:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300",
  },
  {
    label: "اجاره می‌کنم",
    to: "/listings?deal=رهن و اجاره",
    icon: KeyRound,
    tone:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300",
  },
  {
    label: "می‌فروشم",
    to: "/submit-listing?deal=فروش",
    icon: Tag,
    tone:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  },
  {
    label: "اجاره می‌دهم",
    to: "/submit-listing?deal=رهن و اجاره",
    icon: FilePlus2,
    tone:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
];

const MENU_ITEMS = [
  { label: "خانه", to: "/", icon: Home },
  { label: "آگهی‌ها", to: "/listings", icon: Search },
  { label: "جستجو روی نقشه", to: "/listings?mode=map", icon: MapPin },
  { label: "علاقه‌مندی‌های من", to: "/saved", icon: Heart },
  { label: "دستیار هوشمند", to: "/assistant", icon: Bot },
  { label: "ثبت آگهی", to: "/submit-listing", icon: Plus },
  { label: "ثبت تقاضای ملک", to: "/request", icon: FilePlus2 },
  { label: "درباره دیوساز", to: "/about", icon: Info },
  { label: "ورود / عضویت", to: "/auth", icon: LogIn },
];

function FeaturedCard({ item }: { item: any }) {
  const image =
    item.images?.find((entry: any) => entry.featured) ?? item.images?.[0];

  const price =
    item.rentMillion != null && item.rentMillion > 0
      ? `اجاره ${formatPrice(item.rentMillion)}`
      : item.priceMillion != null && item.priceMillion > 0
        ? formatPrice(item.priceMillion)
        : item.depositMillion != null && item.depositMillion > 0
          ? `ودیعه ${formatPrice(item.depositMillion)}`
          : "قیمت توافقی";

  return (
    <article className="group min-w-[78vw] max-w-[350px] snap-start overflow-hidden rounded-[1.7rem] border border-border/70 bg-card shadow-sm sm:min-w-0">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/55">
        <FavoriteButton
          slug={item.slug}
          className="absolute end-3 top-3 z-20 size-10 rounded-full border-0 bg-background/95 shadow-md"
        />
        <Link
          to={"/listings/" + item.slug}
          className="flex h-full w-full items-center justify-center p-2"
        >
          {image?.url ? (
            <img
              src={image.url}
              alt={image.alt || item.title}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <ListingPlaceholder compact />
          )}
        </Link>
        <span className="absolute bottom-3 start-3 rounded-full bg-slate-950/85 px-3 py-1.5 text-[10px] font-black text-white">
          {item.dealType || "آگهی"}
        </span>
      </div>

      <div className="p-4">
        <Link
          to={"/listings/" + item.slug}
          className="line-clamp-1 text-base font-black hover:text-primary"
        >
          {item.title}
        </Link>
        <strong className="mt-2 block text-sm text-primary">{price}</strong>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          {item.area != null && <span>{formatArea(item.area)}</span>}
          {item.rooms != null && (
            <>
              <span className="opacity-40">|</span>
              <span>{formatRooms(item.rooms)}</span>
            </>
          )}
          {item.propertyType && (
            <>
              <span className="opacity-40">|</span>
              <span>{item.propertyType}</span>
            </>
          )}
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MapPin className="size-3.5 text-primary" />
          {item.city}
        </p>
      </div>
    </article>
  );
}

export default function LandingV2() {
  const settings = useQuery(api.folders.getSettings, {});
  const listings = useQuery(api.listings.listFeaturedPublic);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useSeo({
    title: "دیوساز | جستجوی املاک صنعتی و اداری شهریار",
    description:
      "جستجوی حرفه‌ای سوله، کارخانه، کارگاه، انبار، زمین صنعتی و دفتر اداری در شهریار و غرب تهران با دیوساز.",
    keywords: [
      "املاک صنعتی شهریار",
      "سوله شهریار",
      "کارخانه شهریار",
      "دفتر اداری شهریار",
      "دیوساز",
    ],
    type: "website",
  });

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = search.trim();
    navigate(q ? "/listings?q=" + encodeURIComponent(q) : "/listings");
  };

  return (
    <main
      dir="rtl"
      className="responsive-page min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-background pb-20 text-foreground md:pb-0"
    >
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="دیوساز">
            <MekaBrand compact />
          </Link>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-xl sm:inline-flex"
            >
              <Link to="/saved" className="gap-1.5">
                <Heart className="size-4" />
                ذخیره‌شده‌ها
              </Link>
            </Button>
            <ThemeToggle />

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  aria-label="باز کردن منوی سایت"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                dir="rtl"
                className="h-[100dvh] w-[86vw] max-w-[360px] gap-0 overflow-hidden p-0"
              >
                <SheetHeader className="shrink-0 border-b border-border/60 px-4 pb-4 pt-5 pe-12 text-right">
                  <SheetTitle>منوی دیوساز</SheetTitle>
                  <SheetDescription>
                    دسترسی سریع به بخش‌های اصلی سایت
                  </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [scrollbar-width:thin]">
                  <nav className="grid gap-1">
                    {MENU_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SheetClose asChild key={item.to}>
                          <Link
                            to={item.to}
                            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black transition-colors hover:bg-muted"
                          >
                            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Icon className="size-4" />
                            </span>
                            {item.label}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>
                  <div className="mt-3 rounded-2xl bg-muted/50 p-3 text-[11px] leading-6 text-muted-foreground">
                    خرید، فروش، رهن و اجاره املاک صنعتی و اداری در شهریار و
                    غرب تهران.
                  </div>
                </div>
                <div className="shrink-0 border-t border-border/60 bg-background p-4 text-[11px] leading-6 text-muted-foreground">
                  {settings?.officeName || "دیوساز"} · املاک صنعتی و اداری شهریار
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <section className="border-b border-border/60 bg-white text-slate-950 dark:bg-background dark:text-foreground">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)] lg:gap-10">
            <div className="order-2 lg:order-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-xs font-black text-blue-700 shadow-sm dark:border-primary/20 dark:bg-primary/10 dark:text-primary">
                <Sparkles className="size-4" />
                رادار تخصصی املاک صنعتی و اداری
              </span>

              <h1 className="mt-5 text-3xl font-black leading-[1.65] tracking-tight sm:text-5xl">
                به نام خداوند جان و خرد
                <span className="mt-1 block text-primary">
                  کزین برتر اندیشه برنگذرد
                </span>
              </h1>
              <p className="mt-2 text-xs font-bold text-slate-400 dark:text-muted-foreground">
                فردوسی · شاهنامه
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-500 dark:text-muted-foreground sm:text-base">
                دیوساز؛ جستجوی خرید، فروش، رهن و اجاره سوله، کارخانه، کارگاه،
                انبار، زمین صنعتی و دفتر اداری در شهریار و غرب تهران.
              </p>
            </div>

            <div className="order-1 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-[0_18px_55px_rgba(15,23,42,.10)] dark:border-border dark:bg-muted lg:order-2">
              <div className="relative aspect-[16/9] sm:aspect-[16/8] lg:aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=88"
                  alt="نمای یک خانه مدرن؛ جستجوی ملک در دیوساز"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  fetchPriority="high"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/55 to-transparent px-4 pb-4 pt-12 text-white">
                  <strong className="text-sm">خانه و کسب‌وکار، فراتر از یک آدرس</strong>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={submitSearch}
            className="mt-7 flex items-center gap-2 rounded-[1.6rem] border border-slate-200 bg-white p-2 shadow-[0_16px_45px_rgba(15,23,42,.08)] dark:border-border dark:bg-card"
          >
            <Search className="ms-2 size-5 shrink-0 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="شهر، محله یا نوع ملک را جستجو کنید"
              className="h-12 flex-1 border-0 bg-transparent px-1 text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0 dark:text-foreground"
            />
            <Button type="submit" className="h-11 rounded-xl px-5 font-black">
              جستجو
            </Button>
          </form>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {INTENTS.map((intent) => {
              const Icon = intent.icon;
              return (
                <Link
                  key={intent.label}
                  to={intent.to}
                  className={
                    "flex min-h-16 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-black shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md " +
                    intent.tone
                  }
                >
                  <Icon className="size-5 shrink-0" />
                  {intent.label}
                </Link>
              );
            })}
          </div>

          <Link
            to="/listings?advanced=1"
            className="relative mt-5 block overflow-hidden rounded-[1.7rem] bg-gradient-to-l from-blue-700 via-blue-600 to-sky-500 p-5 text-white shadow-[0_18px_45px_rgba(37,99,235,.25)] transition-transform hover:-translate-y-0.5 sm:p-6"
          >
            <div className="absolute -start-12 -top-16 size-48 rounded-full border border-white/15" />
            <div className="absolute start-24 -bottom-20 size-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
                <SlidersHorizontal className="size-7" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black sm:text-2xl">جستجوی پیشرفته</h2>
                <p className="mt-1 text-xs leading-6 text-blue-50 sm:text-sm">
                  قیمت، ودیعه، اجاره، متراژ، تعداد اتاق، نوع معامله و نوع ملک را
                  دقیق تنظیم کن.
                </p>
              </div>
              <ArrowLeft className="size-6 shrink-0" />
            </div>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-xs font-black text-primary">فایل‌های منتخب دیوساز</span>
            <h2 className="mt-1 text-2xl font-black">پیشنهادهای ویژه</h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
            <Link to="/listings">
              مشاهده همه
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>

        {!listings ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-[1.7rem] bg-muted" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {listings.slice(0, 6).map((item: any) => (
              <FeaturedCard key={item.slug} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            هنوز آگهی ویژه‌ای برای ویترین انتخاب نشده است.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/listings?mode=map"
            className="group relative overflow-hidden rounded-[1.7rem] border border-emerald-200/70 bg-gradient-to-l from-emerald-50 to-teal-50 p-5 text-slate-900 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-teal-950/25 dark:text-foreground"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
                <MapPin className="size-6" />
              </span>
              <div>
                <h3 className="font-black">جستجو روی نقشه</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  آگهی‌های دارای لوکیشن را روی نقشه بررسی کن
                </p>
              </div>
              <ArrowLeft className="me-auto size-5 transition-transform group-hover:-translate-x-1" />
            </div>
          </Link>

          <Link
            to="/saved"
            className="group relative overflow-hidden rounded-[1.7rem] border border-blue-200/70 bg-gradient-to-l from-blue-50 to-sky-50 p-5 text-slate-900 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-sky-950/25 dark:text-foreground"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <Heart className="size-6" />
              </span>
              <div>
                <h3 className="font-black">علاقه‌مندی‌های من</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  ملک‌های ذخیره‌شده برای حساب شما
                </p>
              </div>
              <ArrowLeft className="me-auto size-5 transition-transform group-hover:-translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
          <div className="mb-5">
            <span className="text-xs font-black text-primary">حوزه تخصصی دیوساز</span>
            <h2 className="mt-1 text-2xl font-black">برای ملک‌های کسب‌وکاری</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { icon: Factory, title: "کارخانه و سوله", text: "خرید، فروش، رهن و اجاره" },
              { icon: Warehouse, title: "کارگاه و انبار", text: "فایل‌های فعال صنعتی" },
              { icon: BriefcaseBusiness, title: "دفتر اداری", text: "فضاهای اداری شهریار" },
              { icon: Building2, title: "زمین صنعتی", text: "موقعیت‌های توسعه کسب‌وکار" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-border/70 bg-card p-4">
                  <Icon className="size-6 text-primary" />
                  <strong className="mt-3 block text-sm">{item.title}</strong>
                  <span className="mt-1 block text-[10px] leading-5 text-muted-foreground">
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Link to="/assistant" className="rounded-2xl border border-border/70 bg-card p-5 transition-transform hover:-translate-y-0.5">
            <Bot className="size-6 text-primary" />
            <strong className="mt-3 block">دستیار هوشمند دیوساز</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              برای پیدا کردن فایل مناسب راهنمایی بگیر
            </span>
          </Link>
          <Link to="/request" className="rounded-2xl border border-border/70 bg-card p-5 transition-transform hover:-translate-y-0.5">
            <Search className="size-6 text-primary" />
            <strong className="mt-3 block">ثبت تقاضای ملک</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              مشخصات ملک موردنظر را ثبت کن
            </span>
          </Link>
          <Link to="/submit-listing" className="rounded-2xl border border-border/70 bg-card p-5 transition-transform hover:-translate-y-0.5">
            <Plus className="size-6 text-primary" />
            <strong className="mt-3 block">ثبت آگهی ملک</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              فروش یا اجاره ملک خودت را ثبت کن
            </span>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="text-xl font-black text-white">
                {settings?.officeName || "دیوساز"}
              </div>
              <p className="mt-3 max-w-sm text-xs leading-7 text-slate-400">
                دیوساز، مرجع جستجوی آگهی‌های املاک صنعتی و اداری در شهریار و
                غرب تهران؛ برای خرید، فروش، رهن و اجاره سوله، کارخانه، کارگاه،
                انبار، زمین صنعتی و دفتر اداری.
              </p>
              <a
                href={"tel:" + (settings?.managerPhone || "09120858095")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10"
                dir="ltr"
              >
                <PhoneCall className="size-4" />
                {settings?.managerPhone || "09120858095"}
              </a>
            </div>

            <div>
              <h2 className="text-sm font-black text-white">دسترسی سریع</h2>
              <nav className="mt-3 grid gap-2 text-xs text-slate-400">
                <Link to="/listings" className="hover:text-white">آگهی‌های املاک</Link>
                <Link to="/listings?mode=map" className="hover:text-white">جستجوی ملک روی نقشه</Link>
                <Link to="/saved" className="hover:text-white">آگهی‌های ذخیره‌شده</Link>
                <Link to="/assistant" className="hover:text-white">دستیار هوشمند ملک</Link>
                <Link to="/about" className="hover:text-white">درباره دیوساز</Link>
              </nav>
            </div>

            <div>
              <h2 className="text-sm font-black text-white">خدمات ملکی</h2>
              <nav className="mt-3 grid gap-2 text-xs text-slate-400">
                <Link to="/listings?deal=فروش" className="hover:text-white">خرید ملک صنعتی و اداری</Link>
                <Link to="/listings?deal=رهن و اجاره" className="hover:text-white">اجاره سوله و دفتر اداری</Link>
                <Link to="/submit-listing?deal=فروش" className="hover:text-white">ثبت ملک برای فروش</Link>
                <Link to="/submit-listing?deal=رهن و اجاره" className="hover:text-white">ثبت ملک برای اجاره</Link>
                <Link to="/request" className="hover:text-white">ثبت تقاضای خرید یا اجاره</Link>
              </nav>
            </div>

            <div>
              <h2 className="text-sm font-black text-white">حوزه فعالیت دیوساز</h2>
              <p className="mt-3 text-xs leading-7 text-slate-400">
                شهریار، غرب تهران و محدوده‌های صنعتی اطراف؛ با تمرکز بر سوله،
                کارخانه، کارگاه، انبار، زمین صنعتی و املاک اداری.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-300">
                {["سوله شهریار", "کارخانه شهریار", "دفتر اداری", "زمین صنعتی"].map((label) => (
                  <span key={label} className="rounded-full border border-white/10 px-2.5 py-1">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-5 text-[10px] leading-6 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} {settings?.officeName || "دیوساز"} ·
              املاک صنعتی و اداری شهریار و غرب تهران
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link to="/about" className="hover:text-slate-300">درباره ما</Link>
              <Link to="/submit-listing" className="hover:text-slate-300">ثبت آگهی ملک</Link>
              <Link to="/request" className="hover:text-slate-300">ثبت تقاضا</Link>
            </div>
          </div>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border/60 bg-background/95 px-2 py-2 backdrop-blur-xl md:hidden">
        {[
          { to: "/", icon: Home, label: "خانه" },
          { to: "/listings", icon: Search, label: "آگهی‌ها" },
          { to: "/submit-listing", icon: Plus, label: "ثبت آگهی" },
          { to: "/saved", icon: Heart, label: "علاقه‌مندی" },
          { to: "/assistant", icon: Bot, label: "دستیار" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-primary"
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
