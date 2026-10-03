import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import PropertyLeadSection from "@/components/PropertyLeadSection";
import PublicListingSubmission from "@/components/PublicListingSubmission";
import { api } from "@/convex/_generated/api";
import { formatArea, formatPrice } from "@/lib/format";
import { neshanSearchUrl } from "@/lib/neshan";
import { useSeo } from "@/hooks/use-seo";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Factory,
  MapPin,
  Navigation,
  PhoneCall,
  Route,
  ShieldCheck,
  Sparkles,
  Warehouse,
  LogIn,
  UserPlus,
  Search,
  KeyRound,
  HandCoins,
  HomeIcon,
  Grid3X3,
  ClipboardList,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router";
import { useState } from "react";

const PHONE = "09120858095";
const ADDRESS = "شهریار، روبروی شهرک اداری تجربه";
const MAPS_URL = neshanSearchUrl(ADDRESS);

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
  transition: { duration: 0.55, ease: "easeOut" },
} as const;

const services = [
  {
    icon: Factory,
    title: "املاک صنعتی",
    text: "کارخانه، سوله، کارگاه، زمین صنعتی و ملک مناسب تولید و انبار.",
  },
  {
    icon: Building2,
    title: "املاک اداری",
    text: "دفتر کار، ساختمان اداری، فضای شرکتی و موقعیت‌های مناسب کسب‌وکار.",
  },
  {
    icon: Warehouse,
    title: "فایل‌های شهریار",
    text: "تمرکز محلی روی شهریار و محدوده‌های صنعتی و اداری اطراف.",
  },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative flex ${compact ? "size-9" : "size-11"} items-center justify-center overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 text-primary`}
      >
        <div className="absolute inset-1 rounded-xl border border-primary/15" />
        <Building2 className={compact ? "size-5" : "size-6"} />
      </div>
      <div className="leading-none">
        <p className={`${compact ? "text-base" : "text-xl"} font-extrabold tracking-tight`}>
          مکا
        </p>
        <p className="mt-1 text-[9px] font-bold tracking-[0.18em] text-primary/70" dir="ltr">
          MEKA
        </p>
        <p className="mt-1 text-[10px] font-medium text-muted-foreground">
          املاک صنعتی و اداری
        </p>
      </div>
    </div>
  );
}

function IsometricScene() {
  const buildings = [
    { x: "12%", y: "28%", w: 82, h: 112, z: 54, label: "اداری" },
    { x: "43%", y: "15%", w: 96, h: 150, z: 72, label: "صنعتی" },
    { x: "61%", y: "48%", w: 118, h: 80, z: 40, label: "سوله" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 22 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
      className="relative mx-auto h-[340px] w-full max-w-[420px] sm:h-[420px]"
      style={{ perspective: "1000px" }}
      aria-hidden="true"
    >
      <div className="absolute inset-4 rounded-[2.5rem] bg-primary/10 blur-3xl" />
      <div className="absolute -end-8 top-6 size-36 rounded-full bg-gold/10 blur-3xl" />

      <motion.div
        animate={{ y: [0, -8, 0], rotateZ: [-0.4, 0.4, -0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-x-7 bottom-12 top-16"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(58deg) rotateZ(-37deg)",
        }}
      >
        <div
          className="absolute inset-0 rounded-[2.2rem] border border-primary/25 bg-gradient-to-br from-card via-card/95 to-primary/15"
          style={{
            boxShadow:
              "28px 34px 70px color-mix(in oklab, var(--primary) 18%, transparent)",
          }}
        >
          <div className="absolute inset-0 rounded-[2.2rem] opacity-60 grid-overlay" />
          <div className="absolute inset-5 rounded-[1.8rem] border border-dashed border-primary/25" />
          <div className="absolute start-[13%] top-[65%] h-1.5 w-[69%] rounded-full bg-primary/20" />
          <div className="absolute start-[26%] top-[18%] h-[66%] w-1.5 rounded-full bg-gold/15" />

          {buildings.map((b, index) => (
            <motion.div
              key={b.label}
              className="absolute"
              style={{
                left: b.x,
                top: b.y,
                width: b.w,
                height: b.h,
                transformStyle: "preserve-3d",
                transform: `translateZ(${b.z}px)`,
              }}
              animate={{ translateZ: [b.z, b.z + 7, b.z] }}
              transition={{
                duration: 4.5 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.35,
              }}
            >
              <div className="absolute inset-0 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/25 via-card to-card" />
              <div
                className="absolute end-[-18px] top-[9px] h-[calc(100%-9px)] w-[18px] rounded-e-lg bg-primary/20"
                style={{ transform: "skewY(-28deg)", transformOrigin: "left top" }}
              />
              <div
                className="absolute -top-[12px] start-[7px] h-[12px] w-[calc(100%-7px)] rounded-t-lg bg-gradient-to-r from-gold/30 to-primary/25"
                style={{ transform: "skewX(-55deg)", transformOrigin: "left bottom" }}
              />
              <div className="absolute inset-x-3 top-4 grid grid-cols-3 gap-2 opacity-75">
                {Array.from({ length: Math.min(9, index === 1 ? 9 : 6) }).map((_, i) => (
                  <span
                    key={i}
                    className="h-2.5 rounded-[3px] border border-primary/20 bg-primary/15"
                  />
                ))}
              </div>
            </motion.div>
          ))}

          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0.35, 0.9] }}
            transition={{ duration: 2.8, repeat: Infinity }}
            className="absolute end-[14%] top-[14%] size-5 rounded-full border-2 border-gold/60 bg-gold/15"
            style={{ transform: "translateZ(90px)" }}
          />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="glass absolute end-0 top-5 rounded-2xl border border-border/70 px-3.5 py-2.5"
      >
        <p className="text-[10px] text-muted-foreground">تمرکز منطقه‌ای</p>
        <p className="mt-0.5 text-xs font-extrabold">شهریار و حومه</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        className="glass absolute bottom-3 start-0 rounded-2xl border border-border/70 px-3.5 py-2.5"
      >
        <p className="flex items-center gap-1.5 text-xs font-extrabold">
          <BadgeCheck className="size-4 text-primary" />
          فایل‌های تخصصی کسب‌وکار
        </p>
      </motion.div>
    </motion.div>
  );
}

const QUICK_PROPERTY_TYPES = [
  "سوله",
  "کارخانه",
  "کارگاه",
  "انبار",
  "زمین صنعتی",
  "دفتر اداری",
];

type LandingIntent = "buy" | "rent" | "sell" | "lease_out";

const LANDING_INTENTS: Array<{
  id: LandingIntent;
  label: string;
  icon: typeof Search;
}> = [
  { id: "buy", label: "می‌خرم", icon: Search },
  { id: "rent", label: "اجاره می‌کنم", icon: KeyRound },
  { id: "lease_out", label: "اجاره می‌دهم", icon: HomeIcon },
  { id: "sell", label: "می‌فروشم", icon: HandCoins },
];

function MarketIntentHub() {
  const [intent, setIntent] = useState<LandingIntent>("rent");
  const browseMode = intent === "buy" || intent === "rent";
  const deal = intent === "buy" ? "فروش" : "رهن و اجاره";

  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-4 sm:px-6 sm:pb-8">
      <div className="overflow-hidden rounded-[2rem] border border-primary/20 bg-card shadow-sm">
        <div className="grid grid-cols-4 border-b border-border/70 bg-muted/35">
          {LANDING_INTENTS.map((item) => {
            const Icon = item.icon;
            const active = intent === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setIntent(item.id)}
                className={
                  "flex min-h-16 flex-col items-center justify-center gap-1 border-e border-border/50 px-2 text-xs font-extrabold transition-colors last:border-e-0 sm:min-h-20 sm:text-sm " +
                  (active
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted")
                }
              >
                <Icon className="size-4 sm:size-5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-primary">
                {browseMode ? "انتخاب نوع ملک" : "ثبت سریع ملک"}
              </p>
              <h2 className="mt-1 text-lg font-black sm:text-xl">
                {browseMode
                  ? "چه نوع ملکی می‌خواهید؟"
                  : "نوع ملک را انتخاب کنید و آگهی را ثبت کنید"}
              </h2>
            </div>
            <Grid3X3 className="size-6 text-primary/55" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {QUICK_PROPERTY_TYPES.map((property) =>
              browseMode ? (
                <Link
                  key={property}
                  to={
                    "/listings?deal=" +
                    encodeURIComponent(deal) +
                    "&property=" +
                    encodeURIComponent(property)
                  }
                  className="rounded-2xl border border-primary/20 bg-primary/[0.035] px-3 py-4 text-center text-sm font-extrabold transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/8"
                >
                  {property}
                </Link>
              ) : (
                <a
                  key={property}
                  href="#submit-listing"
                  className="rounded-2xl border border-primary/20 bg-primary/[0.035] px-3 py-4 text-center text-sm font-extrabold transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/8"
                >
                  {property}
                </a>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Link
          to="/listings"
          className="rounded-2xl border border-border/70 bg-card p-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 sm:p-4"
        >
          <Search className="mx-auto size-6 text-primary" />
          <p className="mt-2 text-xs font-extrabold sm:text-sm">جستجوی پیشرفته</p>
        </Link>
        <a
          href="#submit-listing"
          className="rounded-2xl border border-border/70 bg-card p-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 sm:p-4"
        >
          <Building2 className="mx-auto size-6 text-primary" />
          <p className="mt-2 text-xs font-extrabold sm:text-sm">ثبت آگهی ملک</p>
        </a>
        <a
          href="#property-leads"
          className="rounded-2xl border border-border/70 bg-card p-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 sm:p-4"
        >
          <ClipboardList className="mx-auto size-6 text-primary" />
          <p className="mt-2 text-xs font-extrabold sm:text-sm">ثبت تقاضای ملک</p>
        </a>
      </div>
    </section>
  );
}

function FeaturedPublicListings() {
  const listings = useQuery(api.listings.listFeaturedPublic);

  if (!listings || listings.length === 0) return null;

  const sale = listings.filter((item) => !String(item.dealType || "").includes("اجاره"));
  const rent = listings.filter((item) => String(item.dealType || "").includes("اجاره"));
  const groups = [
    { title: "ویترین فروش", items: sale },
    { title: "ویترین اجاره", items: rent },
  ].filter((group) => group.items.length > 0);

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-primary">فایل‌های منتخب</span>
          <h2 className="mt-1 text-2xl font-black">ویترین آگهی‌های مکا</h2>
        </div>
        <Button variant="outline" asChild className="hidden gap-1.5 sm:inline-flex">
          <Link to="/listings">
            همه آگهی‌ها
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-3 text-lg font-black">{group.title}</h3>
            <div className="flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none]">
              {group.items.map((item) => {
                const image =
                  item.images?.find((entry: any) => entry.featured) ??
                  item.images?.[0];
                return (
                  <Link
                    key={item.slug}
                    to={"/listings/" + item.slug}
                    className="group w-[82vw] max-w-[360px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-transform hover:-translate-y-1 sm:w-[340px]"
                  >
                    <div className="relative aspect-[16/10] bg-muted/50 p-2">
                      {image?.url ? (
                        <img
                          src={image.url}
                          alt={image.alt || item.title}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building2 className="size-12 text-muted-foreground/25" />
                        </div>
                      )}
                      <span className="absolute end-3 top-3 rounded-full border border-border/60 bg-background/90 px-3 py-1 text-[11px] font-extrabold shadow-sm">
                        {item.propertyType}
                      </span>
                    </div>

                    <div className="p-4">
                      <h4 className="line-clamp-2 text-sm font-black leading-7">
                        {item.title}
                      </h4>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <MapPin className="size-3.5 text-primary" />
                        {item.city}
                        {item.area != null && <span>· {formatArea(item.area)}</span>}
                      </div>
                      <div className="mt-3 text-sm">
                        {item.rentMillion != null && item.rentMillion > 0 ? (
                          <div className="space-y-1">
                            {item.depositMillion != null && item.depositMillion > 0 && (
                              <p className="text-xs text-muted-foreground">
                                ودیعه: {formatPrice(item.depositMillion)}
                              </p>
                            )}
                            <p className="font-extrabold text-primary">
                              اجاره: {formatPrice(item.rentMillion)}
                            </p>
                          </div>
                        ) : item.priceMillion > 0 ? (
                          <p className="font-extrabold text-primary">
                            {formatPrice(item.priceMillion)}
                          </p>
                        ) : (
                          <p className="font-bold text-muted-foreground">قیمت توافقی</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Button asChild variant="outline" className="mt-2 w-full gap-1.5 rounded-xl sm:hidden">
        <Link to="/listings">
          مشاهده همه آگهی‌ها
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  useSeo({
    title: "مکا | املاک صنعتی و اداری شهریار",
    description:
      "مکا؛ مشاور تخصصی خرید، فروش، رهن و اجاره املاک صنعتی و اداری در شهریار. فایل‌های سوله، کارخانه، کارگاه و دفتر اداری با تماس مستقیم.",
    keywords: [
      "املاک صنعتی شهریار",
      "املاک اداری شهریار",
      "اجاره سوله شهریار",
      "اجاره دفتر اداری شهریار",
      "مکا",
    ],
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: "مکا",
      alternateName: "MEKA",
      telephone: PHONE,
      description: "مشاور تخصصی املاک صنعتی و اداری شهریار",
      address: {
        "@type": "PostalAddress",
        addressLocality: "شهریار",
        streetAddress: "روبروی شهرک اداری تجربه",
        addressCountry: "IR",
      },
      areaServed: {
        "@type": "City",
        name: "شهریار",
      },
    },
  });

  return (
    <main dir="rtl" className="relative min-h-screen overflow-x-clip bg-background pb-24 md:pb-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px]">
        <div className="absolute inset-0 grid-overlay opacity-50" />
        <div className="absolute inset-0 glow-emerald opacity-80" />
        <div className="absolute end-[-90px] top-20 size-72 rounded-full bg-gold/8 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
      </div>

      <header className="glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" aria-label="مکا - صفحه اصلی">
            <BrandMark compact />
          </a>

          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <Link
              to="/listings"
              className="hidden rounded-xl px-2.5 py-2 text-xs font-extrabold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xs:block sm:block"
            >
              آگهی‌ها
            </Link>
            <Link
              to="/blog"
              className="hidden rounded-xl px-2.5 py-2 text-xs font-extrabold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block"
            >
              وبلاگ
            </Link>
            <ThemeToggle />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-1 rounded-xl px-2.5 text-[11px] font-extrabold sm:px-3 sm:text-xs"
              onClick={() => navigate("/auth?mode=signIn&returnTo=/dashboard")}
            >
              <LogIn className="size-3.5" />
              ورود
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1 rounded-xl px-2.5 text-[11px] font-extrabold sm:px-3 sm:text-xs"
              onClick={() => navigate("/auth?mode=signUp&returnTo=/dashboard")}
            >
              <UserPlus className="size-3.5" />
              ثبت‌نام
            </Button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-20 sm:pt-14">
        <div className="grid items-center gap-7 lg:grid-cols-[1.02fr_.98fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary">
              <Sparkles className="size-3.5" />
              مشاور تخصصی املاک کسب‌وکار در شهریار
            </div>

            <h1 className="mt-5 max-w-2xl text-[2.35rem] font-extrabold leading-[1.28] tracking-tight sm:text-5xl lg:text-[3.45rem]">
              فضای مناسبِ
              <span className="text-gradient-brand"> کار شما</span>
              <br />
              از سوله تا دفتر اداری
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">
              مکا برای خرید، فروش، رهن و اجاره املاک صنعتی و اداری در شهریار؛
              با تمرکز روی موقعیت‌های واقعی کسب‌وکار و ارتباط مستقیم.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <Button size="lg" className="h-12 gap-2 rounded-2xl px-5 font-extrabold" asChild>
                <a href={`tel:${PHONE}`}>
                  <PhoneCall className="size-4" />
                  تماس مستقیم
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-2xl bg-card/60 px-5 font-extrabold"
                asChild
              >
                <a href={MAPS_URL} target="_blank" rel="noreferrer">
                  <Navigation className="size-4" />
                  مسیریابی
                </a>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" />
                مشاوره تخصصی
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-4 text-primary" />
                پاسخ‌گویی مستقیم
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                شهریار
              </span>
            </div>
          </motion.div>

          <IsometricScene />
        </div>
      </section>

      <section id="services" className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <motion.div {...fadeUp} className="mb-7">
          <span className="text-xs font-extrabold text-primary">حوزه تخصصی مکا</span>
          <div className="mt-2 flex items-end justify-between gap-5">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                ملک برای کسب‌وکار، نه فقط یک آدرس
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                نیازهای صنعتی و اداری متفاوت‌اند؛ مکا فایل‌ها را با نگاه کاربردی به
                دسترسی، موقعیت و نوع فعالیت بررسی می‌کند.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service, index) => (
            <motion.article
              key={service.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: index * 0.08 }}
              className="group rounded-[1.7rem] border border-border/70 bg-card/70 p-5 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                <service.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-extrabold">{service.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{service.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <PublicListingSubmission />

      <PropertyLeadSection />

      <FeaturedPublicListings />

      <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/14 via-card to-gold/10 p-5 sm:p-8"
        >
          <div className="pointer-events-none absolute inset-0 grid-overlay opacity-30" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary">
                <Route className="size-4" />
                مراجعه حضوری
              </span>
              <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
                مکا در شهریار
              </h2>
              <p className="mt-3 flex items-start gap-2 text-sm leading-7 text-muted-foreground">
                <MapPin className="mt-1 size-4 shrink-0 text-primary" />
                {ADDRESS}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-bold">
                <PhoneCall className="size-4 text-primary" />
                <span dir="ltr">{PHONE}</span>
              </p>
            </div>

            <Button
              size="lg"
              className="h-12 w-full gap-2 rounded-2xl font-extrabold lg:w-auto"
              asChild
            >
              <a href={MAPS_URL} target="_blank" rel="noreferrer">
                باز کردن مسیریاب
                <ArrowLeft className="size-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24">
        <motion.div
          {...fadeUp}
          className="rounded-[2rem] border border-border/70 bg-card/70 p-6 text-center sm:p-10"
        >
          <BriefcaseBusiness className="mx-auto size-9 text-primary" />
          <h2 className="mt-4 text-2xl font-extrabold">دنبال فضای مناسب کسب‌وکارت هستی؟</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
            تماس بگیر تا بر اساس نوع فعالیت، متراژ و بودجه، فایل‌های صنعتی یا اداری
            مناسب را سریع‌تر بررسی کنیم.
          </p>
          <Button size="lg" className="mt-6 h-12 gap-2 rounded-2xl px-6 font-extrabold" asChild>
            <a href={`tel:${PHONE}`}>
              <PhoneCall className="size-4" />
              تماس با {PHONE}
            </a>
          </Button>
        </motion.div>
      </section>

      <footer className="border-t border-border/60 bg-card/35">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-8 md:grid-cols-[1.4fr_.8fr_.8fr]">
            <div>
              <BrandMark compact />
              <h2 className="mt-5 text-lg font-extrabold">
                مکا؛ املاک صنعتی و اداری شهریار
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-8 text-muted-foreground">
                مکا مرجع تخصصی بررسی فایل‌های خرید، فروش، رهن و اجاره سوله، کارخانه،
                کارگاه، انبار، زمین صنعتی، دفتر و واحد اداری در شهریار و محدوده غرب
                استان تهران است. هدف ما ارائه اطلاعات شفاف، مشخصات فنی کاربردی و
                ارتباط مستقیم برای انتخاب بهتر فضای کسب‌وکار است.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {["اجاره سوله شهریار", "فروش کارخانه", "دفتر اداری شهریار", "املاک صنعتی"].map((item) => (
                  <span key={item} className="rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-muted-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <nav aria-label="لینک‌های مهم">
              <h3 className="text-sm font-extrabold">دسترسی سریع</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <Link to="/listings" className="hover:text-primary">آگهی‌های صنعتی و اداری</Link>
                <Link to="/blog" className="hover:text-primary">مقالات و راهنمای معاملات</Link>
                <a href="#submit-listing" className="hover:text-primary">ثبت آگهی بدون حساب</a>
                <Link to="/auth?mode=signIn&returnTo=/dashboard" className="hover:text-primary">ورود پرسنل</Link>
                <a href="#services" className="hover:text-primary">خدمات مکا</a>
              </div>
            </nav>

            <div>
              <h3 className="text-sm font-extrabold">تماس و مراجعه</h3>
              <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                <a href={`tel:${PHONE}`} className="flex items-center gap-2 hover:text-primary">
                  <PhoneCall className="size-4 text-primary" />
                  <span dir="ltr">{PHONE}</span>
                </a>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-1 size-4 shrink-0 text-primary" />
                  {ADDRESS}
                </p>
                <a href={MAPS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-bold text-primary">
                  <Navigation className="size-4" />
                  مسیریابی دفتر مکا
                </a>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-border/60 pt-5 text-[11px] leading-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© مکا · مشاور تخصصی املاک صنعتی و اداری شهریار</p>
            <p>اطلاعات هر فایل پیش از معامله باید توسط طرفین بررسی و احراز شود.</p>
          </div>
        </div>
      </footer>

      <div
        className="glass fixed inset-x-0 bottom-0 z-50 border-t border-border/70 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden"
        aria-label="دسترسی سریع"
      >
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <a
            href={`tel:${PHONE}`}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-extrabold text-primary-foreground"
          >
            <PhoneCall className="size-4" />
            تماس
          </a>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-extrabold"
          >
            <Navigation className="size-4 text-primary" />
            مسیریابی
          </a>
        </div>
      </div>
    </main>
  );
}
