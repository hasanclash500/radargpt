import ListingMapExplorer, {
  DEFAULT_LISTING_MAP_BOUNDS,
  type ListingMapBounds,
  type ListingMapItem,
} from "@/components/listings/ListingMapExplorer";
import ResizableMapPanel from "@/components/listings/ResizableMapPanel";
import MekaBrand from "@/components/MekaBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { formatArea, formatPrice } from "@/lib/format";
import { usePaginatedQuery, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Building2,
  ChevronDown,
  Factory,
  FilePlus2,
  Filter,
  Heart,
  Home,
  KeyRound,
  Layers3,
  MapPinned,
  PhoneCall,
  Radar,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Warehouse,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

const SITE_URL = "https://divsaz.ir";

type IntentKey = "buy" | "rent" | "sell" | "lease";

const INTENTS: Array<{
  key: IntentKey;
  label: string;
  note: string;
  icon: typeof Home;
  accent: string;
}> = [
  {
    key: "buy",
    label: "می‌خرم",
    note: "فایل‌های فروش روی نقشه",
    icon: Home,
    accent: "from-sky-500 to-blue-700",
  },
  {
    key: "rent",
    label: "اجاره می‌کنم",
    note: "رهن و اجاره روی نقشه",
    icon: KeyRound,
    accent: "from-violet-500 to-indigo-700",
  },
  {
    key: "sell",
    label: "می‌فروشم",
    note: "ثبت فایل برای فروش",
    icon: Tag,
    accent: "from-amber-400 to-orange-600",
  },
  {
    key: "lease",
    label: "اجاره می‌دهم",
    note: "ثبت فایل برای اجاره",
    icon: FilePlus2,
    accent: "from-emerald-500 to-teal-700",
  },
];

const LANDING_FAQS = [
  {
    question: "چطور ملک‌های شهریار را روی نقشه پیدا کنم؟",
    answer: "از فیلترهای بالای نقشه، شهر، نوع ملک، نوع معامله و در صورت نیاز متراژ یا قیمت را انتخاب کنید. فقط آگهی‌هایی که موقعیت جغرافیایی دارند روی نقشه دیده می‌شوند.",
  },
  {
    question: "چه ملک‌هایی در دیوساز قابل جستجو هستند؟",
    answer: "آگهی‌های سوله، کارخانه، کارگاه، انبار، زمین صنعتی، دفتر اداری و سایر ملک‌های ثبت‌شده را می‌توانید در بخش آگهی‌ها بررسی کنید.",
  },
  {
    question: "آیا می‌توانم ملک خود را برای فروش یا اجاره ثبت کنم؟",
    answer: "بله؛ از بخش ثبت آگهی، مشخصات، قیمت و تصاویر ملک را وارد کنید. آگهی‌های عمومی پس از بررسی و تأیید مدیر منتشر می‌شوند.",
  },
  {
    question: "چطور درباره یک آگهی سؤال بپرسم؟",
    answer: "کارت ملک را باز کنید تا جزئیات و راه‌های ارتباطی موجود در آن را ببینید. همچنین از بخش تماس یا گفتگوی سایت می‌توانید ارتباط بگیرید.",
  },
] as const;

const COMMON_PROPERTY_TYPES = [
  "سوله",
  "کارخانه",
  "کارگاه",
  "انبار",
  "زمین صنعتی",
  "دفتر اداری",
];

function toNumber(value: string) {
  if (!value.trim()) return undefined;
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[,،٬\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function moneyMillion(value: string) {
  const raw = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .trim()
    .toLowerCase()
    .replace(/تومان|تومن/g, "")
    .trim();

  if (!raw) return undefined;

  const hasBillion = raw.includes("میلیارد");
  const hasMillion = raw.includes("میلیون");
  const parsed = Number(
    raw
      .replace(/میلیارد|میلیون/g, "")
      .replace(/[,،٬\s]/g, "")
      .replace(/٫/g, "."),
  );

  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  if (hasBillion) return parsed * 1000;
  if (hasMillion) return parsed;
  if (parsed >= 1_000_000) return parsed / 1_000_000;
  return parsed;
}

function MiniListingCard({ item }: { item: any }) {
  const image = item.images?.find((entry: any) => entry.featured) ?? item.images?.[0];
  const price = item.rentMillion != null && item.rentMillion > 0
    ? `اجاره ${formatPrice(item.rentMillion)}`
    : item.priceMillion != null && item.priceMillion > 0 ? formatPrice(item.priceMillion)
      : item.depositMillion != null && item.depositMillion > 0
        ? `ودیعه ${formatPrice(item.depositMillion)}` : "قیمت توافقی";

  return (
    <Link to={"/listings/" + item.slug} aria-label={"مشاهده آگهی " + item.title}
      className="group grid min-w-0 grid-cols-[40%_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,.07)] transition-all hover:border-blue-300 hover:shadow-lg sm:block dark:border-white/15 dark:bg-slate-900">
      <div className="relative min-h-[156px] overflow-hidden bg-slate-50 sm:aspect-[4/3] sm:min-h-0 dark:bg-slate-800">
        {image?.url ? (
          <img src={image.url} alt={image.alt || item.title}
            className="absolute inset-0 h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.025] sm:p-3"
            loading="lazy" decoding="async" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="size-9 text-slate-400" />
          </div>
        )}
        <span className="absolute start-2 top-2 rounded-full bg-[#071a2f] px-2.5 py-1 text-[11px] font-bold text-white">
          {item.dealType || "آگهی"}
        </span>
      </div>
      <div className="flex min-w-0 flex-col justify-center p-3 sm:p-4">
        <strong className="line-clamp-2 block text-sm font-black leading-6 text-slate-950 sm:text-base dark:text-white">{item.title}</strong>
        <span className="mt-2 block text-sm font-black text-blue-700 sm:text-base dark:text-sky-300">{price}</span>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
          {item.area != null && <span>{formatArea(item.area)}</span>}
          {item.propertyType && <span>• {item.propertyType}</span>}
          {item.city && <span>• {item.city}</span>}
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-blue-700 dark:text-sky-300">
          جزئیات ملک <ArrowLeft className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

function MobileNav() {
  const items = [
    ["/", Home, "خانه"],
    ["/listings?mode=map", MapPinned, "نقشه"],
    ["/submit-listing", FilePlus2, "ثبت آگهی"],
    ["/saved", Heart, "ذخیره‌ها"],
    ["/assistant", Bot, "هوش مصنوعی"],
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1400] border-t border-slate-200/80 bg-white/95 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_40px_rgba(15,23,42,.08)] backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-950/95">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(([to, Icon, label]) => (
          <Link
            key={to}
            to={to}
            className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:text-blue-700 dark:text-slate-300"
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
  const featured = useQuery(api.listings.listFeaturedPublic);
  const { results: newestPublic } = usePaginatedQuery(
    api.listings.listPublicPaged,
    {},
    { initialNumItems: 9 },
  );
  const visibleListingCards = useMemo(() => {
    const unique = new Map<string, any>();
    for (const item of [...(featured ?? []), ...newestPublic]) {
      if (item.slug && !unique.has(item.slug)) unique.set(item.slug, item);
      if (unique.size >= 6) break;
    }
    return Array.from(unique.values());
  }, [featured, newestPublic]);
  const navigate = useNavigate();
  const location = useLocation();

  const [mapBounds, setMapBounds] = useState<ListingMapBounds>(
    DEFAULT_LISTING_MAP_BOUNDS,
  );
  const [activeIntent, setActiveIntent] = useState<"all" | "buy" | "rent">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("همه");
  const [propertyType, setPropertyType] = useState("همه");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [depositMax, setDepositMax] = useState("");
  const [rentMax, setRentMax] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const dealType =
    activeIntent === "buy"
      ? "فروش"
      : activeIntent === "rent"
        ? "رهن و اجاره"
        : undefined;

  const publicMapArgs = useMemo(
    () => ({
      ...mapBounds,
      city: city === "همه" ? undefined : city,
      dealType,
      propertyType: propertyType === "همه" ? undefined : propertyType,
      areaMin: toNumber(areaMin),
      areaMax: toNumber(areaMax),
      priceMin: activeIntent === "rent" ? undefined : moneyMillion(priceMin),
      priceMax: activeIntent === "rent" ? undefined : moneyMillion(priceMax),
      depositMax:
        activeIntent === "buy" ? undefined : moneyMillion(depositMax),
      rentMax: activeIntent === "buy" ? undefined : moneyMillion(rentMax),
    }),
    [
      mapBounds,
      city,
      dealType,
      propertyType,
      areaMin,
      areaMax,
      priceMin,
      priceMax,
      depositMax,
      rentMax,
      activeIntent,
    ],
  );

  const publicMapListings = useQuery(
    api.listings.listPublicMapPoints,
    publicMapArgs,
  );

  const visiblePoints = useMemo(() => {
    const points: ListingMapItem[] = publicMapListings?.points ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return points;

    return points.filter((point) =>
      [
        point.title,
        point.city,
        point.neighborhood,
        point.propertyType,
        point.dealType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [publicMapListings?.points, search]);

  const cities = useMemo(
    () =>
      Array.from(
        new Set([
          "شهریار",
          ...(settings?.customCities ?? []),
          ...((featured ?? []).map((item: any) => item.city).filter(Boolean)),
        ]),
      ),
    [settings?.customCities, featured],
  );

  const propertyTypes = useMemo(
    () =>
      Array.from(
        new Set([
          ...COMMON_PROPERTY_TYPES,
          ...(settings?.customPropertyTypes ?? []),
          ...((featured ?? [])
            .map((item: any) => item.propertyType)
            .filter(Boolean)),
        ]),
      ),
    [settings?.customPropertyTypes, featured],
  );

  const hasFilters =
    activeIntent !== "all" ||
    city !== "همه" ||
    propertyType !== "همه" ||
    Boolean(search || areaMin || areaMax || priceMin || priceMax || depositMax || rentMax);

  const resetFilters = () => {
    setActiveIntent("all");
    setSearch("");
    setCity("همه");
    setPropertyType("همه");
    setAreaMin("");
    setAreaMax("");
    setPriceMin("");
    setPriceMax("");
    setDepositMax("");
    setRentMax("");
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("mode", "map");
    if (search.trim()) params.set("q", search.trim());
    if (city !== "همه") params.set("city", city);
    if (propertyType !== "همه") params.set("property", propertyType);
    if (dealType) params.set("deal", dealType);
    const advancedValues: Record<string, string> = {
      areaMin, areaMax, priceMin, priceMax, depositMax, rentMax,
    };
    for (const [key, value] of Object.entries(advancedValues)) {
      if (value.trim()) params.set(key, value.trim());
    }
    navigate("/listings?" + params.toString());
  };

  const chooseIntent = (key: IntentKey) => {
    if (key === "buy") {
      setActiveIntent("buy");
      setFiltersOpen(true);
      window.setTimeout(() => {
        document
          .getElementById("map-filters")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    if (key === "rent") {
      setActiveIntent("rent");
      setFiltersOpen(true);
      window.setTimeout(() => {
        document
          .getElementById("map-filters")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    navigate(
      key === "sell"
        ? "/submit-listing?deal=" + encodeURIComponent("فروش")
        : "/submit-listing?deal=" + encodeURIComponent("رهن و اجاره"),
    );
  };

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["RealEstateAgent", "LocalBusiness"],
          "@id": SITE_URL + "/#business",
          name: settings?.officeName || "دیوساز",
          url: SITE_URL + "/",
          logo: SITE_URL + "/divsaz-icon.svg",
          telephone: settings?.managerPhone || "09120858095",
          address: {
            "@type": "PostalAddress",
            addressLocality: "شهریار",
            addressRegion: "تهران",
            addressCountry: "IR",
          },
        },
        {
          "@type": "WebSite",
          "@id": SITE_URL + "/#website",
          name: "دیوساز",
          url: SITE_URL + "/",
          inLanguage: "fa-IR",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: SITE_URL + "/listings?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@type": "WebPage",
          "@id": SITE_URL + "/#homepage",
          url: SITE_URL + "/",
          name: "دیوساز | خرید، فروش و اجاره املاک صنعتی و اداری شهریار",
          inLanguage: "fa-IR",
          isPartOf: { "@id": SITE_URL + "/#website" },
          about: { "@id": SITE_URL + "/#business" },
          description:
            "آگهی‌های خرید و فروش، رهن و اجاره سوله، کارخانه، کارگاه، انبار، زمین صنعتی و دفتر اداری در شهریار و غرب تهران.",
        },
        {
          "@type": "FAQPage",
          "@id": SITE_URL + "/#faq",
          mainEntity: LANDING_FAQS.map(({ question, answer }) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: { "@type": "Answer", text: answer },
          })),
        },
      ],
    }),
    [settings?.managerPhone, settings?.officeName],
  );

  useSeo({
    title: "دیوساز | خرید، فروش و اجاره سوله و املاک صنعتی شهریار",
    description:
      "آگهی‌های واقعی سوله، کارخانه، کارگاه، انبار، زمین صنعتی و دفتر اداری در شهریار و غرب تهران؛ خرید، فروش، رهن و اجاره با نقشه، فیلتر و جزئیات هر ملک.",
    keywords: [
      "املاک صنعتی شهریار",
      "خرید سوله شهریار",
      "اجاره سوله شهریار",
      "فروش کارخانه شهریار",
      "رهن و اجاره انبار غرب تهران",
      "دفتر اداری شهریار",
      "نقشه آگهی املاک صنعتی",
      "دیوساز",
    ],
    canonical: SITE_URL + "/",
    noIndex: location.pathname !== "/",
    image: SITE_URL + "/divsaz-hero-building.svg",
    imageAlt: "دیوساز، مرجع املاک صنعتی و اداری شهریار",
    type: "website",
    jsonLd,
  });

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-clip bg-[#f4f7fb] pb-24 text-slate-950 md:pb-0 dark:bg-[#06111f] dark:text-white"
    >
      <section className="relative overflow-hidden bg-[#071a2f] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="pointer-events-none absolute -start-24 -top-24 size-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -end-24 top-20 size-80 rounded-full bg-amber-300/10 blur-3xl" />

        <header className="relative z-[1200] mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-2 px-4 sm:px-6">
          <Link
            to="/"
            className="rounded-2xl border border-border/80 bg-card px-3 py-2 text-foreground shadow-xl ring-1 ring-white/10 transition-colors"
          >
            <MekaBrand compact link={false} />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="rounded-xl px-2 text-sm font-bold text-white hover:bg-white/15 hover:text-white">
              <Link to="/listings">آگهی‌ها</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-xl text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Link to="/assistant" className="gap-2">
                <Bot className="size-4" />
                دستیار هوشمند
              </Link>
            </Button>
            <div className="rounded-xl border border-white/10 bg-white/10 backdrop-blur">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-[1500px] px-0 pb-0 sm:px-6 sm:pb-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="px-4 pb-3 pt-3 sm:px-0 sm:pb-6 sm:pt-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1.5 text-xs font-bold text-sky-100">
                <Radar className="size-4 text-sky-300" />
                املاک صنعتی و اداری شهریار
              </span>
              {hasFilters && (
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black text-amber-200">
                  فیلتر زنده فعال است
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-[1.95rem] font-black leading-[1.55] tracking-normal sm:text-5xl lg:text-6xl">
                  به سنگ و به گچ،
                  <span className="block text-sky-300">دیو دیوار کرد</span>
                </h1>
                <p className="mt-1 text-xs font-medium text-sky-100/80">فردوسی · شاهنامه</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100 sm:text-base">
                  خرید، فروش، رهن و اجاره سوله، کارخانه، کارگاه، انبار، زمین صنعتی و دفتر اداری
                  در شهریار و غرب تهران؛ با جستجوی زنده روی نقشه و امکان ارتباط مستقیم.
                </p>
              </div>
              {(settings?.showMapCountBadge ?? false) && (
              <div className="flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                <MapPinned className="size-5 text-sky-300" />
                <div>
                  <strong className="block text-xl font-black">
                    {visiblePoints.length.toLocaleString("fa-IR")}
                  </strong>
                  <span className="text-[10px] text-slate-300">
                    فایل در محدوده فعلی
                  </span>
                </div>
              </div>
              )}
            </div>
          </motion.div>

          <section id="map-filters" className="mx-auto max-w-7xl px-3 pb-3 sm:px-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.48 }}
              className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white text-slate-950 shadow-[0_20px_60px_rgba(15,23,42,.08)] sm:rounded-[2rem] dark:border-slate-200 dark:bg-white dark:text-slate-950"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 sm:px-4">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                  aria-controls="landing-map-filters-panel"
                  className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-right text-slate-950 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <Filter className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-base font-black sm:text-lg">فیلترهای زنده نقشه</strong>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-600">
                      {filtersOpen ? "برای بستن فیلترها لمس کنید" : hasFilters ? "فیلتر فعال است · برای تغییر لمس کنید" : "برای باز کردن فیلترها لمس کنید"}
                    </span>
                  </span>
                  <ChevronDown className={"size-5 shrink-0 text-blue-700 transition-transform duration-200 " + (filtersOpen ? "rotate-180" : "")} />
                </button>
                {hasFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-10 shrink-0 gap-1 rounded-xl px-2 text-xs font-extrabold text-slate-900 hover:bg-slate-100 dark:text-slate-900"
                  >
                    <RotateCcw className="size-4" />
                    پاک کردن
                  </Button>
                )}
              </div>

              <AnimatePresence initial={false}>
                {filtersOpen && (
                  <motion.div
                    id="landing-map-filters-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
              <form onSubmit={submitSearch} className="p-3 sm:p-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[1.4fr_.8fr_.8fr_auto]">
                  <label className="relative col-span-2 lg:col-span-1">
                    <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="مثلاً سوله ۱۰۰۰ متر یا نام منطقه"
                      className="h-12 rounded-xl border-slate-300 bg-white pe-3 ps-10 text-sm font-bold text-slate-950 shadow-none placeholder:text-slate-500"
                    />
                  </label>
    
                  <select
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="h-12 min-w-0 w-full rounded-xl border border-slate-300 bg-white px-2 text-sm font-bold text-slate-950 sm:px-3"
                  >
                    <option value="همه">همه شهرها</option>
                    {cities.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
    
                  <select
                    value={propertyType}
                    onChange={(event) => setPropertyType(event.target.value)}
                    className="h-12 min-w-0 w-full rounded-xl border border-slate-300 bg-white px-2 text-sm font-bold text-slate-950 sm:px-3"
                  >
                    <option value="همه">همه نوع ملک‌ها</option>
                    {propertyTypes.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
    
                  <Button
                    type="button"
                    variant={advancedOpen ? "default" : "outline"}
                    className={"col-span-2 h-12 gap-2 rounded-xl font-extrabold lg:col-span-1 " + (advancedOpen ? "bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-700 dark:text-white" : "bg-slate-100 text-slate-950 hover:bg-slate-200 dark:bg-slate-100 dark:text-slate-950")}
                    onClick={() => setAdvancedOpen((value) => !value)}
                  >
                    <SlidersHorizontal className="size-4" />
                    فیلتر بیشتر
                  </Button>
                </div>
    
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ["all", "همه فایل‌ها"],
                    ["buy", "فروش"],
                    ["rent", "رهن و اجاره"],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setActiveIntent(value as "all" | "buy" | "rent")}
                      className={
                        "rounded-full border px-4 py-2 text-xs font-black transition-all " +
                        (activeIntent === value
                          ? "border-slate-950 bg-slate-950 text-white dark:border-slate-950 dark:bg-slate-950 dark:text-white"
                          : "border-slate-300 bg-slate-50 text-slate-700 hover:border-blue-300 dark:border-slate-300 dark:bg-slate-50 dark:text-slate-700")
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
    
                {advancedOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 lg:grid-cols-4"
                  >
                    <Input
                      value={areaMin}
                      onChange={(event) => setAreaMin(event.target.value)}
                      placeholder="حداقل متراژ"
                      inputMode="numeric"
                      className="h-11 min-w-0 rounded-xl border-slate-300 bg-white text-sm text-slate-950 placeholder:text-slate-500 dark:bg-white dark:text-slate-950 dark:placeholder:text-slate-500"
                    />
                    <Input
                      value={areaMax}
                      onChange={(event) => setAreaMax(event.target.value)}
                      placeholder="حداکثر متراژ"
                      inputMode="numeric"
                      className="h-11 min-w-0 rounded-xl border-slate-300 bg-white text-sm text-slate-950 placeholder:text-slate-500 dark:bg-white dark:text-slate-950 dark:placeholder:text-slate-500"
                    />
    
                    {activeIntent === "rent" ? (
                      <>
                        <Input
                          value={depositMax}
                          onChange={(event) => setDepositMax(event.target.value)}
                          placeholder="حداکثر ودیعه (میلیون)"
                          className="h-11 min-w-0 rounded-xl border-slate-300 bg-white text-sm text-slate-950 placeholder:text-slate-500 dark:bg-white dark:text-slate-950 dark:placeholder:text-slate-500"
                        />
                        <Input
                          value={rentMax}
                          onChange={(event) => setRentMax(event.target.value)}
                          placeholder="حداکثر اجاره (میلیون)"
                          className="h-11 min-w-0 rounded-xl border-slate-300 bg-white text-sm text-slate-950 placeholder:text-slate-500 dark:bg-white dark:text-slate-950 dark:placeholder:text-slate-500"
                        />
                      </>
                    ) : (
                      <>
                        <Input
                          value={priceMin}
                          onChange={(event) => setPriceMin(event.target.value)}
                          placeholder="حداقل قیمت (میلیون)"
                          className="h-11 min-w-0 rounded-xl border-slate-300 bg-white text-sm text-slate-950 placeholder:text-slate-500 dark:bg-white dark:text-slate-950 dark:placeholder:text-slate-500"
                        />
                        <Input
                          value={priceMax}
                          onChange={(event) => setPriceMax(event.target.value)}
                          placeholder="حداکثر قیمت (میلیون)"
                          className="h-11 min-w-0 rounded-xl border-slate-300 bg-white text-sm text-slate-950 placeholder:text-slate-500 dark:bg-white dark:text-slate-950 dark:placeholder:text-slate-500"
                        />
                      </>
                    )}
                  </motion.div>
                )}
    
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-3 text-slate-950">
                  {(settings?.showMapCountBadge ?? false) && (
                  <div className="flex items-center gap-2 text-xs">
                    <Layers3 className="size-4 text-blue-600" />
                    <strong>{visiblePoints.length.toLocaleString("fa-IR")}</strong>
                    <span className="text-slate-600">
                      فایل روی نقشه با فیلتر فعلی
                    </span>
                  </div>
                  )}
                  <Button type="submit" className="gap-2 rounded-xl bg-[#082f54] text-white hover:bg-[#0b416f] dark:bg-[#082f54] dark:text-white">
                    مشاهده همین فیلتر در صفحه آگهی‌ها
                    <ArrowLeft className="size-4" />
                  </Button>
                </div>
              </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </section>

          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="relative sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-white/10 sm:bg-white/5 sm:p-2 sm:shadow-[0_35px_90px_rgba(0,0,0,.35)]"
          >
            <ResizableMapPanel className="border-white/20">
              <ListingMapExplorer
                points={visiblePoints}
              loading={publicMapListings === undefined}
              truncated={Boolean(publicMapListings?.truncated)}
              mode="public"
              onBoundsChange={setMapBounds}
              onOpenListing={(point) => {
                if (point.slug) navigate("/listings/" + point.slug);
              }}
              />
            </ResizableMapPanel>
          </motion.div>
        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-1 max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[.24em] text-blue-600">
              مسیر سریع
            </span>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              چه کاری می‌خواهی انجام بدهی؟
            </h2>
          </div>
          <span className="hidden text-xs text-slate-500 sm:block">
            خرید و اجاره، نقشه را فیلتر می‌کنند.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {INTENTS.map((intent, index) => {
            const Icon = intent.icon;
            const selected =
              (intent.key === "buy" && activeIntent === "buy") ||
              (intent.key === "rent" && activeIntent === "rent");

            return (
              <motion.button
                type="button"
                key={intent.key}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.42, delay: index * 0.06 }}
                whileHover={{ y: -4 }}
                onClick={() => chooseIntent(intent.key)}
                className={
                  "group relative overflow-hidden rounded-[1.65rem] border p-4 text-right shadow-sm transition-colors sm:p-5 " +
                  (selected
                    ? "border-blue-500 bg-slate-950 text-white ring-4 ring-blue-500/10"
                    : "border-slate-200/80 bg-white hover:border-blue-300 dark:border-white/10 dark:bg-white/5")
                }
              >
                <div
                  className={
                    "absolute -end-10 -top-10 size-28 rounded-full bg-gradient-to-br opacity-15 blur-2xl " +
                    intent.accent
                  }
                />
                <span
                  className={
                    "relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg " +
                    intent.accent
                  }
                >
                  <Icon className="size-5" />
                </span>
                <strong className="relative mt-4 block text-lg font-black">
                  {intent.label}
                </strong>
                <span
                  className={
                    "relative mt-1 block text-[10px] leading-5 " +
                    (selected ? "text-slate-300" : "text-slate-500 dark:text-slate-400")
                  }
                >
                  {intent.note}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>



      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2rem] bg-[#071a2f] p-6 text-white sm:p-8"
          >
            <div className="pointer-events-none absolute -end-16 -top-16 size-52 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -end-5 top-7 size-24 rounded-full border border-sky-300/20" />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black text-sky-200">
              <Sparkles className="size-4" />
              جستجوی زبانی
            </span>
            <h2 className="mt-5 max-w-xl text-3xl font-black leading-[1.45] tracking-tight">
              به‌جای فیلتر، خواسته‌ات را برای هوش مصنوعی بنویس.
            </h2>
            <p className="mt-3 max-w-xl text-xs leading-7 text-slate-300">
              مثال: «یک سوله حدود ۱۵۰۰ متر برای اجاره در شهریار با بودجه مناسب
              پیدا کن.»
            </p>
            <Button
              asChild
              className="mt-6 rounded-xl bg-white text-slate-950 hover:bg-slate-100"
            >
              <Link to="/assistant" className="gap-2">
                <Bot className="size-4" />
                ورود به دستیار هوشمند
              </Link>
            </Button>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[
              {
                icon: Factory,
                title: "صنعتی",
                text: "سوله، کارخانه، کارگاه و زمین صنعتی",
              },
              {
                icon: Warehouse,
                title: "انبار و لجستیک",
                text: "فایل‌های مناسب انبار، پخش و لجستیک",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[.045]"
                >
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-sky-300/10 dark:text-sky-300">
                    <Icon className="size-5" />
                  </span>
                  <strong className="mt-4 block text-lg font-black">
                    {item.title}
                  </strong>
                  <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                    {item.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[.22em] text-blue-600">
              فایل‌های منتخب
            </span>
            <h2 className="mt-1 text-2xl font-black">آگهی‌های منتخب و تازه دیوساز</h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/listings">
              همه آگهی‌ها
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>

        {visibleListingCards.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleListingCards.map((item: any) => (
              <MiniListingCard key={item.slug} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            هنوز آگهی عمومی برای نمایش در این بخش وجود ندارد.
          </div>
        )}
      </section>

      <section aria-labelledby="service-heading" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 dark:border-white/10 dark:bg-slate-900">
          <h2 id="service-heading" className="text-xl font-black leading-9 text-slate-950 sm:text-2xl dark:text-white">
            جستجوی ملک صنعتی و اداری در شهریار و غرب تهران
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-8 text-slate-700 dark:text-slate-200">
            دیوساز برای بررسی آگهی‌های فروش و اجاره املاک کسب‌وکار طراحی شده است.
            موقعیت فایل‌های دارای لوکیشن را روی نقشه ببینید و بر اساس شهر، نوع ملک، متراژ و
            قیمت جستجو کنید. جزئیات، عکس‌ها و اطلاعات تماس درج‌شده در صفحه هر آگهی در دسترس شماست.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "خرید سوله و کارخانه", to: "/listings?deal=" + encodeURIComponent("فروش"), description: "فایل‌های فروش املاک صنعتی و کارگاهی" },
              { title: "رهن و اجاره انبار", to: "/listings?deal=" + encodeURIComponent("رهن و اجاره"), description: "گزینه‌های اجاره مناسب کسب‌وکار" },
              { title: "مشاهده ملک روی نقشه", to: "/listings?mode=map", description: "مقایسه موقعیت فایل‌های دارای لوکیشن" },
              { title: "سپردن یا ثبت ملک", to: "/submit-listing", description: "ثبت فایل فروش یا اجاره برای بررسی" },
            ].map((item) => (
              <Link key={item.title} to={item.to}
                className="flex min-h-28 flex-col justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                <strong className="text-sm font-black text-slate-950 dark:text-white">{item.title}</strong>
                <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
                <ArrowLeft className="size-4 text-blue-700 dark:text-sky-300" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 dark:border-white/10 dark:bg-slate-900">
          <div className="mb-4">
            <span className="text-xs font-bold text-blue-700 dark:text-sky-300">راهنمای استفاده</span>
            <h2 id="faq-heading" className="mt-1 text-xl font-black text-slate-950 sm:text-2xl dark:text-white">
              پرسش‌های متداول خرید، فروش و اجاره ملک
            </h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {LANDING_FAQS.map(({ question, answer }) => (
              <details key={question} className="group py-3">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-extrabold leading-7 text-slate-900 [&::-webkit-details-marker]:hidden sm:text-base dark:text-white">
                  {question}
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-lg leading-6 text-slate-700 group-open:rotate-45 dark:bg-white/10 dark:text-white">+</span>
                </summary>
                <p className="pb-2 pe-1 pt-2 text-sm leading-8 text-slate-700 dark:text-slate-200">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#071a2f] text-slate-100">
        <div className="mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 sm:pb-12 sm:pt-12">
          <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="inline-flex items-center rounded-2xl border border-border/70 bg-card px-3 py-2 text-foreground shadow-sm">
                <MekaBrand compact />
              </div>
              <h2 className="mt-4 text-base font-black text-white">{settings?.officeName || "دیوساز"}</h2>
              <p className="mt-2 text-sm leading-8 text-slate-200">
                جستجوی آگهی‌های فروش، رهن و اجاره سوله، کارخانه، کارگاه، انبار،
                زمین صنعتی و املاک اداری در شهریار و غرب تهران.
              </p>
              {(settings?.managerPhone || "09120858095") && (
                <a href={"tel:" + (settings?.managerPhone || "09120858095")} dir="ltr"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 text-sm font-bold text-white hover:bg-white/20">
                  <PhoneCall className="size-4" /> {settings?.managerPhone || "09120858095"}
                </a>
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-white">دسترسی سریع</h2>
              <nav aria-label="دسترسی سریع" className="mt-4 grid gap-3 text-sm text-slate-200">
                <Link to="/" className="hover:text-sky-300">صفحه اصلی</Link>
                <Link to="/listings" className="hover:text-sky-300">همه آگهی‌ها</Link>
                <Link to="/listings?mode=map" className="hover:text-sky-300">جستجوی ملک روی نقشه</Link>
                <Link to="/saved" className="hover:text-sky-300">آگهی‌های ذخیره‌شده</Link>
                <Link to="/blog" className="hover:text-sky-300">مجله و راهنمای املاک</Link>
                <Link to="/about" className="hover:text-sky-300">درباره دیوساز</Link>
              </nav>
            </div>
            <div>
              <h2 className="text-base font-black text-white">خدمات ملکی</h2>
              <nav aria-label="خدمات ملکی" className="mt-4 grid gap-3 text-sm text-slate-200">
                <Link to={"/listings?deal=" + encodeURIComponent("فروش")} className="hover:text-sky-300">خرید ملک صنعتی</Link>
                <Link to={"/listings?deal=" + encodeURIComponent("رهن و اجاره")} className="hover:text-sky-300">رهن و اجاره ملک</Link>
                <Link to={"/submit-listing?deal=" + encodeURIComponent("فروش")} className="hover:text-sky-300">ثبت آگهی فروش</Link>
                <Link to={"/submit-listing?deal=" + encodeURIComponent("رهن و اجاره")} className="hover:text-sky-300">ثبت آگهی اجاره</Link>
                <Link to="/request" className="hover:text-sky-300">ثبت درخواست ملک</Link>
                <Link to="/assistant" className="hover:text-sky-300">دستیار هوشمند</Link>
              </nav>
            </div>
            <div>
              <h2 className="text-base font-black text-white">مناطق و نوع فعالیت</h2>
              <p className="mt-4 text-sm leading-8 text-slate-200">
                شهریار، غرب تهران و شهرک‌های صنعتی اطراف؛ سوله، کارگاه، کارخانه،
                انبار، زمین صنعتی و دفتر اداری.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["سوله شهریار", "کارخانه", "انبار صنعتی", "دفتر اداری"].map((label) => (
                  <span key={label} className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-slate-200">
                    {label}
                  </span>
                ))}
              </div>
              <Link to="/request" className="mt-5 inline-flex items-center gap-1 text-sm font-extrabold text-sky-300 hover:text-white">
                مشاوره و ثبت درخواست <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-white/20 pt-5 text-xs leading-7 text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {settings?.officeName || "دیوساز"} · املاک صنعتی و اداری شهریار</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link to="/about" className="hover:text-white">درباره ما</Link>
              <Link to="/submit-listing" className="hover:text-white">ثبت آگهی</Link>
              <Link to="/request" className="hover:text-white">ارتباط و درخواست ملک</Link>
            </div>
          </div>
        </div>
      </footer>

      <MobileNav />
    </main>
  );
}
