import BrandStorySection from "@/components/BrandStorySection";
import { Button } from "@/components/ui/button";
import MekaBrand from "@/components/MekaBrand";
import PublicStoryStrip from "@/components/stories/PublicStoryStrip";
import { ThemeToggle } from "@/components/ThemeToggle";
import ListingPlaceholder from "@/components/listings/ListingPlaceholder";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/convex/_generated/api";
import { formatArea, formatPrice } from "@/lib/format";
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
  LogIn,
  UserPlus,
  Search,
  KeyRound,
  HandCoins,
  HomeIcon,
  Grid3X3,
  ClipboardList,
  Bot,
  Menu,
  Newspaper,
  LayoutDashboard,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { useState } from "react";

const PHONE = "09120858095";
const ADDRESS = "شهریار، روبروی شهرک اداری، مجتمع تجاری اداری شهریار";
const MAPS_URL = "https://nshn.ir/2bveXP_xCgqA";
const MAP_LOCATION = "جاده شهریار–شهدای اندیشه";

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
];

function MenuLink({
  to,
  icon: Icon,
  label,
  highlight = false,
}: {
  to: string;
  icon: typeof Search;
  label: string;
  highlight?: boolean;
}) {
  return (
    <SheetClose asChild>
      <Link
        to={to}
        className={
          "flex items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-extrabold transition-colors " +
          (highlight
            ? "bg-primary/10 text-primary hover:bg-primary/15"
            : "hover:bg-muted")
        }
      >
        <span
          className={
            "flex size-9 items-center justify-center rounded-xl " +
            (highlight
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary")
          }
        >
          <Icon className="size-4" />
        </span>
        {label}
      </Link>
    </SheetClose>
  );
}

function RadarMapScene() {
  const pins = [
    { x: "24%", y: "38%", label: "سوله" },
    { x: "62%", y: "28%", label: "اداری" },
    { x: "70%", y: "65%", label: "صنعتی" },
    { x: "37%", y: "70%", label: "کارگاه" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.12, ease: "easeOut" }}
      className="relative mx-auto h-[340px] w-full max-w-[430px] sm:h-[430px]"
      aria-label="نقشه راداری فایل‌های دیوساز"
    >
      <div className="absolute inset-6 rounded-[2.8rem] bg-primary/10 blur-3xl" />
      <div className="absolute -start-8 top-8 size-32 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="absolute inset-x-5 bottom-8 top-8 overflow-hidden rounded-[2.4rem] border border-primary/25 bg-gradient-to-br from-card via-background to-primary/10 shadow-2xl">
        <div className="absolute inset-0 grid-overlay opacity-55" />

        <svg
          className="absolute inset-0 h-full w-full opacity-70"
          viewBox="0 0 420 380"
          fill="none"
          aria-hidden="true"
        >
          <path d="M-30 78 C80 110 126 36 224 78 S360 130 460 80" stroke="currentColor" strokeWidth="7" className="text-primary/14" />
          <path d="M30 330 C80 250 165 280 210 205 S300 95 402 120" stroke="currentColor" strokeWidth="5" className="text-amber-400/12" />
          <path d="M82 -20 C120 72 85 130 130 196 S210 292 180 410" stroke="currentColor" strokeWidth="4" className="text-primary/14" />
          <path d="M300 -20 C260 90 322 132 290 228 S250 324 330 410" stroke="currentColor" strokeWidth="4" className="text-primary/10" />
        </svg>

        <div className="absolute left-1/2 top-1/2 size-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15" />
        <div className="absolute left-1/2 top-1/2 size-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />
        <div className="absolute left-1/2 top-1/2 size-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/25" />
        <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_24px_rgba(16,185,129,.8)]" />

        <motion.div
          className="absolute left-1/2 top-1/2 z-10 h-[2px] w-[43%] origin-left rounded-full bg-gradient-to-r from-primary/95 via-primary/55 to-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
          style={{ boxShadow: "0 0 18px rgba(16,185,129,.45)" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 z-[5] h-[42%] w-[42%] origin-top-left rounded-br-full bg-gradient-to-br from-primary/18 via-primary/5 to-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
        />

        {pins.map((pin, index) => (
          <motion.div
            key={pin.label}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: pin.x, top: pin.y }}
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 2.8 + index * 0.35,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="relative flex size-9 items-center justify-center rounded-2xl border border-primary/30 bg-background/90 text-primary shadow-lg backdrop-blur">
              <Building2 className="size-4" />
              <motion.span
                className="absolute inset-0 rounded-2xl border border-primary/40"
                animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.3 }}
              />
            </span>
            <span className="mt-1 block rounded-full bg-background/85 px-2 py-0.5 text-center text-[8px] font-black shadow-sm">
              {pin.label}
            </span>
          </motion.div>
        ))}

        <div className="absolute bottom-4 end-4 rounded-2xl border border-border/70 bg-background/85 px-3 py-2 shadow-lg backdrop-blur">
          <p className="text-[9px] text-muted-foreground">رادار فایل‌های دیوساز</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-black">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            جستجوی موقعیت‌های فعال
          </p>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="glass absolute end-0 top-2 rounded-2xl border border-border/70 px-3.5 py-2.5"
      >
        <p className="text-[10px] text-muted-foreground">تمرکز منطقه‌ای</p>
        <p className="mt-0.5 text-xs font-extrabold">شهریار و غرب تهران</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
        className="glass absolute bottom-1 start-0 rounded-2xl border border-border/70 px-3.5 py-2.5"
      >
        <p className="flex items-center gap-1.5 text-xs font-extrabold">
          <BadgeCheck className="size-4 text-primary" />
          رادار هوشمند فایل‌های کسب‌وکار
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
  const ownerDeal = intent === "sell" ? "فروش" : "رهن و اجاره";

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
                <Link
                  key={property}
                  to={
                    "/submit-listing?deal=" +
                    encodeURIComponent(ownerDeal) +
                    "&property=" +
                    encodeURIComponent(property)
                  }
                  className="rounded-2xl border border-primary/20 bg-primary/[0.035] px-3 py-4 text-center text-sm font-extrabold transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/8"
                >
                  {property}
                </Link>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Link
          to="/assistant"
          className="rounded-2xl border border-primary/25 bg-primary/[0.045] p-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 sm:p-4"
        >
          <Bot className="mx-auto size-6 text-primary" />
          <p className="mt-2 text-xs font-extrabold sm:text-sm">دستیار هوشمند دیوساز</p>
        </Link>
        <Link
          to="/listings"
          className="rounded-2xl border border-border/70 bg-card p-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 sm:p-4"
        >
          <Search className="mx-auto size-6 text-primary" />
          <p className="mt-2 text-xs font-extrabold sm:text-sm">جستجوی پیشرفته</p>
        </Link>
        <Link
          to="/submit-listing"
          className="rounded-2xl border border-border/70 bg-card p-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 sm:p-4"
        >
          <Building2 className="mx-auto size-6 text-primary" />
          <p className="mt-2 text-xs font-extrabold sm:text-sm">ثبت آگهی ملک</p>
        </Link>
        <Link
          to="/request"
          className="rounded-2xl border border-border/70 bg-card p-3 text-center shadow-sm transition-transform hover:-translate-y-0.5 sm:p-4"
        >
          <ClipboardList className="mx-auto size-6 text-primary" />
          <p className="mt-2 text-xs font-extrabold sm:text-sm">ثبت تقاضای ملک</p>
        </Link>
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
          <h2 className="mt-1 text-2xl font-black">ویترین آگهی‌های دیوساز</h2>
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
                        <ListingPlaceholder compact />
                      )}
                      <div className="absolute end-3 top-3 flex flex-wrap gap-1.5">
                        {item.featuredOnHome && (
                          <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-black text-slate-950 shadow-sm">
                            ویژه
                          </span>
                        )}
                        <span className="rounded-full border border-border/60 bg-background/90 px-3 py-1 text-[11px] font-extrabold shadow-sm">
                          {item.propertyType}
                        </span>
                      </div>
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

  useSeo({
    title: "دیوساز | املاک صنعتی و اداری شهریار",
    description:
      "دیوساز؛ مشاور تخصصی خرید، فروش، رهن و اجاره املاک صنعتی و اداری در شهریار. فایل‌های سوله، کارخانه، کارگاه و دفتر اداری با تماس مستقیم.",
    keywords: [
      "املاک صنعتی شهریار",
      "املاک اداری شهریار",
      "اجاره سوله شهریار",
      "اجاره دفتر اداری شهریار",
      "دیوساز",
    ],
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: "دیوساز",
      alternateName: "Divosaz",
      telephone: PHONE,
      description: "مشاور تخصصی املاک صنعتی و اداری شهریار",
      address: {
        "@type": "PostalAddress",
        addressLocality: "شهریار",
        streetAddress: "روبروی شهرک اداری، مجتمع تجاری اداری شهریار",
        addressCountry: "IR",
      },
      areaServed: {
        "@type": "City",
        name: "شهریار",
      },
    },
  });

  return (
    <main dir="rtl" className="responsive-page relative min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-background pb-24 md:pb-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px]">
        <div className="absolute inset-0 grid-overlay opacity-50" />
        <div className="absolute inset-0 glow-emerald opacity-80" />
        <div className="absolute end-[-90px] top-20 size-72 rounded-full bg-gold/8 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
      </div>

      <header className="glass relative z-40 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" aria-label="دیوساز - صفحه اصلی">
            <MekaBrand compact />
          </a>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-10 rounded-xl"
                  aria-label="باز کردن منوی اصلی"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" dir="rtl" className="w-[88vw] max-w-sm p-0">
                <SheetHeader className="border-b border-border/60 p-5 pe-12 text-right">
                  <SheetTitle>
                    <MekaBrand compact />
                  </SheetTitle>
                  <SheetDescription className="pt-2 text-right leading-6">
                    دسترسی سریع به خدمات و ابزارهای دیوساز
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-3">
                  <div className="grid gap-1.5">
                    <MenuLink to="/listings" icon={Search} label="آگهی‌ها و جستجوی ملک" />
                    <MenuLink to="/assistant" icon={Bot} label="دستیار هوشمند دیوساز" highlight />
                    <MenuLink to="/submit-listing" icon={Building2} label="ثبت آگهی ملک" />
                    <MenuLink to="/request" icon={ClipboardList} label="ثبت متقاضی / تقاضای ملک" />
                    <MenuLink to="/blog" icon={Newspaper} label="وبلاگ و راهنما" />
                    <MenuLink to="/about" icon={BadgeCheck} label="درباره دیوساز" />
                    <MenuLink
                      to="/dashboard"
                      icon={LayoutDashboard}
                      label="پنل خدمات دیوساز"
                    />

                    <div className="my-2 border-t border-border/60" />

                    <SheetClose asChild>
                      <a
                        href={MAPS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-extrabold transition-colors hover:bg-muted"
                      >
                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Navigation className="size-4" />
                        </span>
                        مسیریابی با نشان
                      </a>
                    </SheetClose>

                    <SheetClose asChild>
                      <a
                        href={`tel:${PHONE}`}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-extrabold transition-colors hover:bg-muted"
                      >
                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <PhoneCall className="size-4" />
                        </span>
                        تماس با دیوساز
                      </a>
                    </SheetClose>
                  </div>
                </div>

                <SheetFooter className="border-t border-border/60 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="h-11 gap-2 rounded-xl font-extrabold">
                        <Link to="/auth?mode=signIn&returnTo=/dashboard">
                          <LogIn className="size-4" />
                          ورود
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="h-11 gap-2 rounded-xl font-extrabold">
                        <Link to="/auth?mode=signUp&returnTo=/dashboard">
                          <UserPlus className="size-4" />
                          ثبت‌نام
                        </Link>
                      </Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <PublicStoryStrip />

      <MarketIntentHub />

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
              دیوساز برای خرید، فروش، رهن و اجاره املاک صنعتی و اداری در شهریار؛
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

          <RadarMapScene />
        </div>
      </section>

      <BrandStorySection />

      <FeaturedPublicListings />

      <section id="services" className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <motion.div {...fadeUp} className="mb-7">
          <span className="text-xs font-extrabold text-primary">حوزه تخصصی دیوساز</span>
          <div className="mt-2 flex items-end justify-between gap-5">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                ملک برای کسب‌وکار، نه فقط یک آدرس
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                نیازهای صنعتی و اداری متفاوت‌اند؛ دیوساز فایل‌ها را با نگاه کاربردی به
                دسترسی، موقعیت و نوع فعالیت بررسی می‌کند.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
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
                دیوساز در شهریار
              </h2>
              <p className="mt-3 flex items-start gap-2 text-sm leading-7 text-muted-foreground">
                <MapPin className="mt-1 size-4 shrink-0 text-primary" />
                {ADDRESS}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                موقعیت روی نقشه: {MAP_LOCATION}
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
              <MekaBrand compact />
              <h2 className="mt-5 text-lg font-extrabold">
                دیوساز؛ املاک صنعتی و اداری شهریار
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-8 text-muted-foreground">
                دیوساز مرجع تخصصی بررسی فایل‌های خرید، فروش، رهن و اجاره سوله، کارخانه،
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
                <Link to="/submit-listing" className="hover:text-primary">ثبت آگهی بدون حساب</Link>
                <Link to="/auth?mode=signIn&returnTo=/dashboard" className="hover:text-primary">ورود پرسنل</Link>
                <a href="#services" className="hover:text-primary">خدمات دیوساز</a>
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
                  مسیریابی دفتر دیوساز
                </a>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-border/60 pt-5 text-[11px] leading-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© دیوساز · مشاور تخصصی املاک صنعتی و اداری شهریار</p>
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
