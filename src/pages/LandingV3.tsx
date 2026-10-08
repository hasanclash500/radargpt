import FavoriteButton from "@/components/listings/FavoriteButton";
import ListingPlaceholder from "@/components/listings/ListingPlaceholder";
import MekaBrand from "@/components/MekaBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { formatArea, formatPrice, formatRooms } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Bot,
  Building2,
  Factory,
  FilePlus2,
  Heart,
  Home,
  KeyRound,
  MapPin,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Warehouse,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

const SITE_URL = "https://divsaz.ir";

const INTENTS = [
  {
    label: "می‌خرم",
    text: "فایل‌های فروش",
    to: "/listings?deal=فروش",
    icon: Home,
    className: "from-blue-600 to-blue-500",
  },
  {
    label: "اجاره می‌کنم",
    text: "رهن و اجاره",
    to: "/listings?deal=رهن%20و%20اجاره",
    icon: KeyRound,
    className: "from-violet-600 to-indigo-500",
  },
  {
    label: "می‌فروشم",
    text: "ثبت فایل فروش",
    to: "/submit-listing?deal=فروش",
    icon: Tag,
    className: "from-amber-500 to-orange-500",
  },
  {
    label: "اجاره می‌دهم",
    text: "ثبت فایل اجاره",
    to: "/submit-listing?deal=رهن%20و%20اجاره",
    icon: FilePlus2,
    className: "from-emerald-600 to-teal-500",
  },
] as const;

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
    <article className="min-w-[82vw] max-w-[360px] snap-start overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(15,23,42,.08)] sm:min-w-0 dark:border-border dark:bg-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-white dark:bg-slate-950/20">
        <FavoriteButton
          slug={item.slug}
          className="absolute end-3 top-3 z-20 size-10 rounded-full border-0 bg-white/95 text-slate-900 shadow-lg"
        />
        <Link
          to={"/listings/" + item.slug}
          className="flex h-full w-full items-center justify-center p-3"
        >
          {image?.url ? (
            <img
              src={image.url}
              alt={image.alt || item.title}
              className="block h-auto max-h-full w-auto max-w-full object-contain"
              loading="lazy"
            />
          ) : (
            <ListingPlaceholder compact />
          )}
        </Link>
        <span className="absolute bottom-3 start-3 rounded-full bg-slate-950/85 px-3 py-1.5 text-[10px] font-black text-white backdrop-blur">
          {item.dealType || "آگهی"}
        </span>
      </div>
      <div className="p-4">
        <Link
          to={"/listings/" + item.slug}
          className="line-clamp-1 text-base font-black text-slate-900 hover:text-blue-700 dark:text-foreground"
        >
          {item.title}
        </Link>
        <strong className="mt-2 block text-sm text-blue-700 dark:text-blue-300">
          {price}
        </strong>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-muted-foreground">
          {item.area != null && <span>{formatArea(item.area)}</span>}
          {item.rooms != null && <span>• {formatRooms(item.rooms)}</span>}
          {item.propertyType && <span>• {item.propertyType}</span>}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-muted-foreground">
          <MapPin className="size-3.5 text-blue-600" />
          {item.city || "شهریار"}
        </p>
      </div>
    </article>
  );
}

function MobileNav() {
  const items = [
    ["/", Home, "خانه"],
    ["/listings", Search, "آگهی‌ها"],
    ["/submit-listing", FilePlus2, "ثبت آگهی"],
    ["/saved", Heart, "علاقه‌مندی"],
    ["/assistant", Bot, "دستیار"],
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(15,23,42,.08)] backdrop-blur-xl md:hidden dark:border-border dark:bg-background/95">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(([to, Icon, label]) => (
          <Link
            key={to}
            to={to}
            className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700 dark:text-muted-foreground dark:hover:bg-muted"
          >
            <Icon className="size-5" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function LandingV3() {
  const settings = useQuery(api.folders.getSettings, {});
  const listings = useQuery(api.listings.listFeaturedPublic);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["RealEstateAgent", "LocalBusiness"],
          "@id": SITE_URL + "/#business",
          name: settings?.officeName || "دیوساز",
          alternateName: "Divosaz",
          url: SITE_URL + "/",
          logo: SITE_URL + "/divsaz-icon.svg",
          image: SITE_URL + "/divsaz-hero-building.svg",
          telephone: settings?.managerPhone || "09120858095",
          description:
            "دیوساز؛ مرجع تخصصی خرید، فروش، رهن و اجاره املاک صنعتی و اداری در شهریار و غرب تهران.",
          address: {
            "@type": "PostalAddress",
            addressLocality: "شهریار",
            addressRegion: "تهران",
            addressCountry: "IR",
          },
          areaServed: [
            { "@type": "City", name: "شهریار" },
            { "@type": "AdministrativeArea", name: "غرب تهران" },
          ],
        },
        {
          "@type": "WebSite",
          "@id": SITE_URL + "/#website",
          url: SITE_URL + "/",
          name: "دیوساز",
          alternateName: "Divosaz",
          inLanguage: "fa-IR",
          publisher: { "@id": SITE_URL + "/#business" },
        },
        {
          "@type": "WebPage",
          "@id": SITE_URL + "/#webpage",
          url: SITE_URL + "/",
          name: "دیوساز | املاک صنعتی و اداری شهریار",
          isPartOf: { "@id": SITE_URL + "/#website" },
          about: { "@id": SITE_URL + "/#business" },
          inLanguage: "fa-IR",
          description:
            "جستجوی آگهی‌های سوله، کارخانه، کارگاه، انبار، زمین صنعتی و دفتر اداری برای خرید، فروش، رهن و اجاره در شهریار و غرب تهران.",
        },
      ],
    }),
    [settings?.managerPhone, settings?.officeName],
  );

  useSeo({
    title: "دیوساز | املاک صنعتی و اداری شهریار و غرب تهران",
    description:
      "خرید، فروش، رهن و اجاره سوله، کارخانه، کارگاه، انبار، زمین صنعتی و دفتر اداری در شهریار و غرب تهران؛ جستجو روی نقشه، فایل‌های منتخب و ارتباط مستقیم با مشاور دیوساز.",
    keywords: [
      "املاک صنعتی شهریار",
      "سوله شهریار",
      "کارخانه شهریار",
      "کارگاه شهریار",
      "انبار شهریار",
      "زمین صنعتی شهریار",
      "دفتر اداری شهریار",
      "املاک غرب تهران",
      "دیوساز",
    ],
    canonical: SITE_URL + "/",
    image: SITE_URL + "/divsaz-hero-building.svg",
    ogTitle: "دیوساز؛ رادار تخصصی املاک صنعتی و اداری شهریار",
    ogDescription:
      "فایل‌های فروش، رهن و اجاره املاک کسب‌وکاری در شهریار و غرب تهران.",
    type: "website",
    jsonLd,
  });

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = search.trim();
    navigate(q ? "/listings?q=" + encodeURIComponent(q) : "/listings");
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-clip bg-[#f7f9fc] pb-24 text-slate-950 md:pb-0 dark:bg-background dark:text-foreground"
    >
      <section className="relative overflow-hidden bg-[#061c33] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(14,165,233,.28),transparent_32%),radial-gradient(circle_at_90%_30%,rgba(245,158,11,.18),transparent_30%)]" />
        <div className="absolute -end-24 top-28 size-72 rounded-full border border-white/10" />
        <div className="absolute -end-10 top-44 size-44 rounded-full border border-white/10" />

        <header className="relative z-20 mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            aria-label="صفحه اصلی دیوساز"
            className="rounded-2xl bg-white px-3 py-2 text-slate-950 shadow-lg"
          >
            <MekaBrand compact />
          </Link>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-xl text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Link to="/listings">مشاهده آگهی‌ها</Link>
            </Button>
            <div className="rounded-xl bg-white/10 text-white backdrop-blur">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-8 pt-5 sm:px-6 sm:pb-12 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black text-sky-100 backdrop-blur">
              <Radar className="size-4 text-sky-300" />
              رادار تخصصی ملک‌های کسب‌وکاری
            </div>

            <h1 className="mt-5 max-w-xl text-[2.15rem] font-black leading-[1.45] tracking-tight sm:text-5xl">
              ملک مناسب کسب‌وکارت
              <span className="block bg-gradient-to-l from-amber-300 via-white to-sky-300 bg-clip-text text-transparent">
                باید پیدا شود، نه حدس زده شود.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-8 text-slate-300 sm:text-base">
              دیوساز برای جستجوی سوله، کارخانه، کارگاه، انبار، زمین صنعتی و
              دفتر اداری در شهریار و غرب تهران؛ با فایل‌های واقعی، نقشه و
              ارتباط مستقیم.
            </p>

            <form
              onSubmit={submitSearch}
              className="mt-6 flex items-center gap-2 rounded-[1.45rem] border border-white/15 bg-white p-2 text-slate-950 shadow-[0_22px_70px_rgba(0,0,0,.25)]"
            >
              <Search className="ms-2 size-5 shrink-0 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="مثلاً سوله ۱۰۰۰ متر شهریار"
                className="h-12 flex-1 border-0 bg-transparent px-1 shadow-none placeholder:text-slate-400 focus-visible:ring-0"
              />
              <Button type="submit" className="h-11 rounded-xl px-5 font-black">
                جستجو
              </Button>
            </form>
          </div>

          <div className="relative mx-auto mt-7 max-w-md lg:mt-0">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-sky-400/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <div className="overflow-hidden rounded-[1.5rem] bg-white">
                <img
                  src="/divsaz-hero-building.svg"
                  alt="نماد دیوساز برای املاک صنعتی و اداری"
                  className="h-auto w-full"
                  fetchPriority="high"
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  ["خرید", "فروش"],
                  ["رهن", "اجاره"],
                  ["نقشه", "هوشمند"],
                ].map(([a, b]) => (
                  <div
                    key={a}
                    className="rounded-xl border border-white/10 bg-slate-950/30 px-2 py-2"
                  >
                    <strong className="block text-xs">{a}</strong>
                    <span className="mt-0.5 block text-[9px] text-slate-300">
                      {b}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-full mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {INTENTS.map((intent) => {
              const Icon = intent.icon;
              return (
                <Link
                  key={intent.label}
                  to={intent.to}
                  className={
                    "group rounded-[1.35rem] bg-gradient-to-l p-[1px] shadow-lg " +
                    intent.className
                  }
                >
                  <div className="flex min-h-[82px] items-center gap-3 rounded-[calc(1.35rem-1px)] bg-[#0b2743]/92 px-3 py-3 transition-colors group-hover:bg-[#103352]">
                    <span className={"flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white " + intent.className}>
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <strong className="block text-sm">{intent.label}</strong>
                      <span className="mt-0.5 block text-[9px] text-slate-300">
                        {intent.text}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              to: "/listings?mode=map",
              icon: MapPin,
              title: "جستجو روی نقشه",
              text: "موقعیت فایل‌ها",
            },
            {
              to: "/assistant",
              icon: Bot,
              title: "دستیار هوشمند",
              text: "جستجو با زبان ساده",
            },
            {
              to: "/request",
              icon: ShieldCheck,
              title: "ثبت تقاضا",
              text: "ملک موردنظر من",
            },
            {
              to: "/blog",
              icon: Sparkles,
              title: "راهنمای تخصصی",
              text: "محتوای بازار ملک",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-[1.45rem] border border-slate-200/80 bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-border dark:bg-card"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  <Icon className="size-5" />
                </span>
                <strong className="mt-3 block text-sm">{item.title}</strong>
                <span className="mt-1 block text-[10px] text-slate-500 dark:text-muted-foreground">
                  {item.text}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-black text-blue-700 dark:text-blue-300">
              فایل‌های منتخب و فعال
            </span>
            <h2 className="mt-1 text-2xl font-black">پیشنهادهای ویژه دیوساز</h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-blue-700">
            <Link to="/listings">
              همه
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>

        {!listings ? (
          <div className="mt-5 flex gap-3 overflow-hidden">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-80 min-w-[82vw] animate-pulse rounded-[1.8rem] bg-slate-200 sm:min-w-[330px]"
              />
            ))}
          </div>
        ) : listings.length ? (
          <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {listings.slice(0, 6).map((item: any) => (
              <FeaturedCard key={item.slug} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.6rem] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-border dark:bg-card">
            هنوز فایل ویژه‌ای برای ویترین انتخاب نشده است.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#071e35] p-5 text-white shadow-xl sm:p-7">
          <div className="absolute -end-12 -top-16 size-48 rounded-full border border-white/10" />
          <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <span className="text-[10px] font-black text-sky-300">
                جستجوی دقیق‌تر
              </span>
              <h2 className="mt-1 text-2xl font-black">فیلتر حرفه‌ای ملک</h2>
              <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300">
                معامله، نوع ملک، شهر، متراژ، قیمت، ودیعه، اجاره و تعداد اتاق را
                دقیق تنظیم کن.
              </p>
            </div>
            <Button asChild className="rounded-xl bg-white text-slate-950 hover:bg-slate-100">
              <Link to="/listings?advanced=1">شروع جستجوی پیشرفته</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white dark:border-border dark:bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
          <div className="mb-5">
            <span className="text-[11px] font-black text-blue-700 dark:text-blue-300">
              تمرکز تخصصی
            </span>
            <h2 className="mt-1 text-2xl font-black">
              برای ملک‌های صنعتی و اداری
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              [Factory, "سوله و کارخانه", "فروش و اجاره"],
              [Warehouse, "کارگاه و انبار", "فایل‌های فعال"],
              [Building2, "دفتر اداری", "فضای کسب‌وکار"],
              [MapPin, "زمین صنعتی", "موقعیت توسعه"],
            ].map(([Icon, title, text]: any[]) => (
              <Link
                key={title}
                to={"/listings?q=" + encodeURIComponent(title)}
                className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-border dark:bg-muted/30"
              >
                <Icon className="size-6 text-blue-700 dark:text-blue-300" />
                <strong className="mt-3 block text-sm">{title}</strong>
                <span className="mt-1 block text-[10px] text-slate-500 dark:text-muted-foreground">
                  {text}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-9 sm:px-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card sm:p-7">
          <span className="text-[11px] font-black text-blue-700 dark:text-blue-300">
            درباره دیوساز
          </span>
          <h2 className="mt-1 text-2xl font-black">
            رادار تخصصی املاک صنعتی و اداری شهریار
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 dark:text-muted-foreground">
            دیوساز روی آگهی‌های املاک کسب‌وکاری در شهریار و غرب تهران تمرکز
            دارد؛ از سوله و کارخانه تا کارگاه، انبار، زمین صنعتی و دفتر اداری.
            هدف، دسترسی سریع‌تر به فایل مناسب، مقایسه روشن مشخصات و ارتباط
            مستقیم با مشاور است.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="rounded-xl">
              <Link to="/about">درباره دیوساز</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/blog">مطالعه راهنماها</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[#061c33] text-slate-200">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <strong className="text-xl text-white">
              {settings?.officeName || "دیوساز"}
            </strong>
            <p className="mt-3 text-xs leading-7 text-slate-400">
              خرید، فروش، رهن و اجاره املاک صنعتی و اداری در شهریار و غرب
              تهران.
            </p>
          </div>
          <div>
            <strong className="text-sm text-white">جستجوی ملک</strong>
            <nav className="mt-3 grid gap-2 text-xs text-slate-400">
              <Link to="/listings" className="hover:text-white">آگهی‌های املاک</Link>
              <Link to="/listings?mode=map" className="hover:text-white">جستجو روی نقشه</Link>
              <Link to="/assistant" className="hover:text-white">دستیار هوشمند</Link>
            </nav>
          </div>
          <div>
            <strong className="text-sm text-white">خدمات</strong>
            <nav className="mt-3 grid gap-2 text-xs text-slate-400">
              <Link to="/submit-listing" className="hover:text-white">ثبت آگهی</Link>
              <Link to="/request" className="hover:text-white">ثبت تقاضای ملک</Link>
              <Link to="/saved" className="hover:text-white">علاقه‌مندی‌ها</Link>
            </nav>
          </div>
          <div>
            <strong className="text-sm text-white">اطلاعات</strong>
            <nav className="mt-3 grid gap-2 text-xs text-slate-400">
              <Link to="/about" className="hover:text-white">درباره دیوساز</Link>
              <Link to="/blog" className="hover:text-white">وبلاگ تخصصی</Link>
              <a href="/sitemap.xml" className="hover:text-white">نقشه سایت</a>
            </nav>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-center text-[10px] text-slate-500">
          © {new Date().getFullYear()} Divosaz.ir
        </div>
      </footer>

      <MobileNav />
    </main>
  );
}
