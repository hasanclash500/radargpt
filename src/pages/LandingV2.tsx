import FavoriteButton from "@/components/listings/FavoriteButton";
import ListingPlaceholder from "@/components/listings/ListingPlaceholder";
import MekaBrand from "@/components/MekaBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { faNum, formatArea, formatPrice, formatRooms } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  Building2,
  Factory,
  Heart,
  Home,
  MapPin,
  Menu,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Warehouse,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";

const QUICK_FILTERS = [
  { label: "فروش", query: "?deal=فروش" },
  { label: "رهن و اجاره", query: "?deal=رهن و اجاره" },
  { label: "سوله", query: "?property=سوله" },
  { label: "دفتر اداری", query: "?property=دفتر اداری" },
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
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
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
            <Button asChild variant="outline" size="icon" className="rounded-xl">
              <Link to="/listings" aria-label="مشاهده آگهی‌ها">
                <Menu className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,.12),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(14,165,233,.10),transparent_32%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-12">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-black text-primary">
              <Sparkles className="size-4" />
              رادار تخصصی املاک صنعتی و اداری
            </span>
            <h1 className="mt-5 text-3xl font-black leading-[1.5] tracking-tight sm:text-5xl">
              ملک مناسب کسب‌وکارت را
              <span className="text-primary"> دقیق‌تر پیدا کن</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
              سوله، کارخانه، کارگاه، انبار، زمین صنعتی و دفتر اداری در شهریار
              و غرب تهران؛ با فایل‌های واقعی و امکان جستجو روی نقشه.
            </p>
          </div>

          <form
            onSubmit={submitSearch}
            className="mt-7 flex items-center gap-2 rounded-[1.5rem] border border-border/70 bg-card p-2 shadow-[0_16px_45px_rgba(15,23,42,.08)]"
          >
            <Search className="ms-2 size-5 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="شهر، محله، سوله، کارخانه یا دفتر اداری…"
              className="h-12 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            />
            <Button type="submit" className="h-11 rounded-xl px-5 font-black">
              جستجو
            </Button>
          </form>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {QUICK_FILTERS.map((filter) => (
              <Link
                key={filter.label}
                to={"/listings" + filter.query}
                className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-black shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
              >
                {filter.label}
              </Link>
            ))}
          </div>

          <Link
            to="/listings?advanced=1"
            className="relative mt-5 block overflow-hidden rounded-[1.7rem] bg-gradient-to-l from-blue-700 via-blue-600 to-sky-500 p-5 text-white shadow-[0_18px_45px_rgba(37,99,235,.28)] transition-transform hover:-translate-y-0.5 sm:p-6"
          >
            <div className="absolute -start-8 -top-12 size-44 rounded-full border border-white/15" />
            <div className="absolute start-20 -bottom-16 size-40 rounded-full bg-white/10 blur-2xl" />
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
              <div
                key={item}
                className="h-72 animate-pulse rounded-[1.7rem] bg-muted"
              />
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
                  فایل‌هایی که برای حساب خودت ذخیره کرده‌ای
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
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/70 bg-card p-4"
                >
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
          <Link
            to="/assistant"
            className="rounded-2xl border border-border/70 bg-card p-5 transition-transform hover:-translate-y-0.5"
          >
            <Bot className="size-6 text-primary" />
            <strong className="mt-3 block">دستیار هوشمند دیوساز</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              برای پیدا کردن فایل مناسب راهنمایی بگیر
            </span>
          </Link>
          <Link
            to="/request"
            className="rounded-2xl border border-border/70 bg-card p-5 transition-transform hover:-translate-y-0.5"
          >
            <Search className="size-6 text-primary" />
            <strong className="mt-3 block">ثبت تقاضای ملک</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              مشخصات ملک موردنظر را ثبت کن
            </span>
          </Link>
          <Link
            to="/submit-listing"
            className="rounded-2xl border border-border/70 bg-card p-5 transition-transform hover:-translate-y-0.5"
          >
            <Plus className="size-6 text-primary" />
            <strong className="mt-3 block">ثبت آگهی ملک</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              فروش یا اجاره ملک خودت را ثبت کن
            </span>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <span>{settings?.officeName || "دیوساز"} · املاک صنعتی و اداری شهریار</span>
          <a
            href={"tel:" + (settings?.managerPhone || "09120858095")}
            className="font-bold text-primary"
            dir="ltr"
          >
            {settings?.managerPhone || "09120858095"}
          </a>
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
