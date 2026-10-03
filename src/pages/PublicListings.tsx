import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { formatArea, formatPrice, formatRooms } from "@/lib/format";
import { usePaginatedQuery } from "convex/react";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  Building2,
  Camera,
  ChevronDown,
  Factory,
  MapPin,
  PhoneCall,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

type SortKey =
  | "newest"
  | "deposit-desc"
  | "deposit-asc"
  | "rent-desc"
  | "rent-asc"
  | "price-desc"
  | "price-asc"
  | "area-desc"
  | "area-asc";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "newest", label: "جدیدترین" },
  { value: "deposit-desc", label: "بیشترین ودیعه" },
  { value: "deposit-asc", label: "کمترین ودیعه" },
  { value: "rent-desc", label: "بیشترین اجاره" },
  { value: "rent-asc", label: "کمترین اجاره" },
  { value: "price-desc", label: "بیشترین قیمت" },
  { value: "price-asc", label: "کمترین قیمت" },
  { value: "area-desc", label: "بیشترین مساحت" },
  { value: "area-asc", label: "کمترین مساحت" },
];

function numberValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(
    value
      .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[,،٬\s]/g, ""),
  );
  return Number.isFinite(parsed) ? parsed : null;
}

function rangeLabel(min: string, max: string, unit: string) {
  if (!min && !max) return "";
  if (min && max) return min + " تا " + max + " " + unit;
  if (min) return "از " + min + " " + unit;
  return "تا " + max + " " + unit;
}

export default function PublicListings() {
  const [searchParams] = useSearchParams();
  const { results: listings, status, loadMore } = usePaginatedQuery(
    api.listings.listPublicPaged,
    {},
    { initialNumItems: 36 },
  );

  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState(() => searchParams.get("property") || "همه");
  const [dealType, setDealType] = useState(() => searchParams.get("deal") || "همه");
  const [city, setCity] = useState(() => searchParams.get("city") || "همه");
  const [rooms, setRooms] = useState("همه");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [depositMin, setDepositMin] = useState("");
  const [depositMax, setDepositMax] = useState("");
  const [rentMin, setRentMin] = useState("");
  const [rentMax, setRentMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  useSeo({
    title: "آگهی‌های املاک صنعتی و اداری شهریار | مکا",
    description:
      "فایل‌های منتخب و عمومی املاک صنعتی و اداری شهریار؛ سوله، کارخانه، کارگاه و دفتر اداری با فیلتر پیشرفته و تماس مستقیم با مکا.",
    keywords: [
      "املاک صنعتی شهریار",
      "املاک اداری شهریار",
      "اجاره سوله شهریار",
      "اجاره دفتر شهریار",
      "مکا",
    ],
    type: "website",
  });

  useEffect(() => {
    if (status !== "CanLoadMore") return;
    const timer = window.setTimeout(() => loadMore(120), 90);
    return () => window.clearTimeout(timer);
  }, [status, loadMore, listings.length]);

  const propertyTypes = useMemo(
    () => Array.from(new Set((listings || []).map((item) => item.propertyType).filter(Boolean))),
    [listings],
  );
  const dealTypes = useMemo(
    () => Array.from(new Set((listings || []).map((item) => item.dealType).filter(Boolean))),
    [listings],
  );
  const cities = useMemo(
    () => Array.from(new Set((listings || []).map((item) => item.city).filter(Boolean))),
    [listings],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const aMin = numberValue(areaMin);
    const aMax = numberValue(areaMax);
    const dMin = numberValue(depositMin);
    const dMax = numberValue(depositMax);
    const rMin = numberValue(rentMin);
    const rMax = numberValue(rentMax);
    const pMin = numberValue(priceMin);
    const pMax = numberValue(priceMax);

    const result = (listings || []).filter((item) => {
      if (
        q &&
        ![item.title, item.description, item.city, item.propertyType, item.dealType]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ) return false;
      if (propertyType !== "همه") {
        const propertyHaystack = [item.propertyType, item.title, item.description]
          .join(" ")
          .toLowerCase();
        const selected = propertyType.toLowerCase();
        const industrialAliases: Record<string, string[]> = {
          "سوله": ["سوله", "صنعتی"],
          "کارخانه": ["کارخانه", "صنعتی"],
          "کارگاه": ["کارگاه", "صنعتی"],
          "انبار": ["انبار", "صنعتی"],
          "زمین صنعتی": ["زمین صنعتی", "صنعتی"],
          "دفتر اداری": ["دفتر اداری", "اداری", "دفتر کار"],
        };
        const aliases = industrialAliases[propertyType] ?? [selected];
        if (!aliases.some((alias) => propertyHaystack.includes(alias.toLowerCase()))) {
          return false;
        }
      }
      if (dealType !== "همه" && item.dealType !== dealType) return false;
      if (city !== "همه" && item.city !== city) return false;
      if (rooms !== "همه") {
        if (rooms === "4+") {
          if ((item.rooms ?? -1) < 4) return false;
        } else if ((item.rooms ?? -1) !== Number(rooms)) {
          return false;
        }
      }
      if (aMin != null && (item.area == null || item.area < aMin)) return false;
      if (aMax != null && (item.area == null || item.area > aMax)) return false;
      if (dMin != null && (item.depositMillion ?? 0) < dMin) return false;
      if (dMax != null && (item.depositMillion ?? 0) > dMax) return false;
      if (rMin != null && (item.rentMillion ?? 0) < rMin) return false;
      if (rMax != null && (item.rentMillion ?? 0) > rMax) return false;
      if (pMin != null && (item.priceMillion ?? 0) < pMin) return false;
      if (pMax != null && (item.priceMillion ?? 0) > pMax) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sort === "newest") return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
      const parts = sort.split("-");
      const key = parts[0];
      const sign = parts[1] === "asc" ? 1 : -1;
      const value = (item: any) => {
        if (key === "deposit") return item.depositMillion ?? 0;
        if (key === "rent") return item.rentMillion ?? 0;
        if (key === "price") return item.priceMillion ?? 0;
        return item.area ?? 0;
      };
      return (value(a) - value(b)) * sign;
    });

    return result;
  }, [
    listings, search, propertyType, dealType, city, rooms,
    areaMin, areaMax, depositMin, depositMax, rentMin, rentMax,
    priceMin, priceMax, sort,
  ]);

  const activeCount = [
    search.trim(),
    propertyType !== "همه",
    dealType !== "همه",
    city !== "همه",
    rooms !== "همه",
    areaMin || areaMax,
    depositMin || depositMax,
    rentMin || rentMax,
    priceMin || priceMax,
  ].filter(Boolean).length;

  const reset = () => {
    setSearch("");
    setPropertyType("همه");
    setDealType("همه");
    setCity("همه");
    setRooms("همه");
    setAreaMin("");
    setAreaMax("");
    setDepositMin("");
    setDepositMax("");
    setRentMin("");
    setRentMax("");
    setPriceMin("");
    setPriceMax("");
    setSort("newest");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-muted/35">
      <header className="glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <span>
              <strong className="block leading-none">مکا</strong>
              <span className="mt-1 block text-[10px] text-muted-foreground">آگهی‌های عمومی</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/blog">وبلاگ</Link></Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-extrabold text-primary">
            <Factory className="size-4" />جستجوی فایل مکا
          </span>
          <h1 className="mt-4 text-2xl font-black sm:text-4xl">آگهی‌های صنعتی و اداری</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            فیلترها برای کاربران عمومی طراحی شده‌اند؛ آدرس دقیق، محله و اطلاعات داخلی مالک همچنان خصوصی می‌مانند.
          </p>
        </div>
      </section>

      <section className="sticky top-16 z-40 border-b border-border/60 bg-background/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <FilterSelect label="نوع ملک" value={propertyType} options={propertyTypes} onChange={setPropertyType} />
            <FilterSelect label="معامله" value={dealType} options={dealTypes} onChange={setDealType} />
            <FilterSelect label="شهر" value={city} options={cities} onChange={setCity} />
            <FilterChip label="متراژ" active={Boolean(areaMin || areaMax)} detail={rangeLabel(areaMin, areaMax, "متر")} onClick={() => setAdvancedOpen((value) => !value)} />
            <FilterChip label="ودیعه" active={Boolean(depositMin || depositMax)} detail={rangeLabel(depositMin, depositMax, "میلیون")} onClick={() => setAdvancedOpen((value) => !value)} />
            <FilterChip label="اجاره" active={Boolean(rentMin || rentMax)} detail={rangeLabel(rentMin, rentMax, "میلیون")} onClick={() => setAdvancedOpen((value) => !value)} />
            <button
              type="button"
              onClick={() => setAdvancedOpen((value) => !value)}
              className={"inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-xs font-extrabold transition-colors " + (
                advancedOpen || activeCount > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground"
              )}
            >
              <SlidersHorizontal className="size-4" />
              سایر فیلترها
              {activeCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] text-primary-foreground">
                  {activeCount.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
          </div>

          {advancedOpen && (
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative sm:col-span-2 lg:col-span-4">
                <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو در عنوان، توضیحات، شهر و نوع ملک…" className="pe-9" />
              </div>
              <RangeFields label="متراژ (متر)" min={areaMin} max={areaMax} onMin={setAreaMin} onMax={setAreaMax} />
              <RangeFields label="ودیعه (میلیون تومان)" min={depositMin} max={depositMax} onMin={setDepositMin} onMax={setDepositMax} />
              <RangeFields label="اجاره (میلیون تومان)" min={rentMin} max={rentMax} onMin={setRentMin} onMax={setRentMax} />
              <RangeFields label="قیمت فروش (میلیون تومان)" min={priceMin} max={priceMax} onMin={setPriceMin} onMax={setPriceMax} />
              <label className="space-y-1.5 text-xs font-bold">
                تعداد اتاق
                <select value={rooms} onChange={(event) => setRooms(event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="همه">همه</option>
                  <option value="0">بدون اتاق</option>
                  <option value="1">۱ اتاق</option>
                  <option value="2">۲ اتاق</option>
                  <option value="3">۳ اتاق</option>
                  <option value="4+">۴ اتاق و بیشتر</option>
                </select>
              </label>
              <div className="flex items-end">
                <Button type="button" variant="outline" className="w-full gap-2" onClick={reset}>
                  <RotateCcw className="size-4" />پاک کردن فیلترها
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-7">
        <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black">{dealType === "همه" ? "آگهی‌های قابل بررسی" : dealType + " ملک"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtered.length.toLocaleString("fa-IR")} نتیجه
              {status === "LoadingMore" ? " · در حال تکمیل فهرست…" : ""}
            </p>
          </div>

          <div className="relative">
            <Button type="button" variant="outline" className="gap-2 rounded-xl" onClick={() => setSortOpen((value) => !value)}>
              <ArrowDownWideNarrow className="size-4" />مرتب‌سازی<ChevronDown className="size-4" />
            </Button>
            {sortOpen && (
              <div className="absolute left-0 top-12 z-30 min-w-56 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-xl">
                {SORTS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => { setSort(option.value); setSortOpen(false); }}
                    className={"block w-full rounded-xl px-4 py-2.5 text-right text-sm transition-colors hover:bg-muted " + (
                      sort === option.value ? "bg-muted font-extrabold text-primary" : ""
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {status === "LoadingFirstPage" ? (
          <div className="py-24 text-center text-sm text-muted-foreground">در حال دریافت آگهی‌ها…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-background p-12 text-center">
            <Building2 className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-4 font-extrabold">آگهی متناسب پیدا نشد</h2>
            <p className="mt-2 text-sm text-muted-foreground">بازه‌ها یا نوع ملک را تغییر دهید.</p>
            <Button variant="outline" className="mt-5" onClick={reset}>پاک کردن فیلترها</Button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((item) => {
              const contact = item.contacts?.[0];
              const image = item.images?.find((entry: any) => entry.featured) ?? item.images?.[0];
              return (
                <article key={item.slug} className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-primary/35 hover:shadow-md">
                  <div className="grid min-h-[210px] grid-cols-[minmax(0,1fr)_42%] sm:min-h-[240px]">
                    <div className="flex min-w-0 flex-col p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{item.dealType}</span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{item.propertyType}</span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-base font-black leading-7 sm:text-lg">
                        <Link to={"/listings/" + item.slug} className="hover:text-primary">{item.title}</Link>
                      </h3>
                      <div className="mt-3 space-y-1.5 text-xs">
                        {item.depositMillion != null && item.depositMillion > 0 && (
                          <p><span className="text-muted-foreground">ودیعه: </span><strong>{formatPrice(item.depositMillion)}</strong></p>
                        )}
                        {item.rentMillion != null && item.rentMillion > 0 && (
                          <p><span className="text-muted-foreground">اجاره: </span><strong className="text-primary">{formatPrice(item.rentMillion)}</strong></p>
                        )}
                        {(item.rentMillion == null || item.rentMillion <= 0) && item.priceMillion > 0 && (
                          <p><span className="text-muted-foreground">قیمت: </span><strong className="text-primary">{formatPrice(item.priceMillion)}</strong></p>
                        )}
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                        {item.rooms != null && <span>{formatRooms(item.rooms)}</span>}
                        {item.area != null && <span>{formatArea(item.area)}</span>}
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3 text-primary" />{item.city}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button asChild size="sm" className="flex-1 gap-1">
                          <Link to={"/listings/" + item.slug}>مشاهده<ArrowLeft className="size-3.5" /></Link>
                        </Button>
                        {contact?.phone && (
                          <Button asChild size="sm" variant="outline" className="px-3">
                            <a href={"tel:" + contact.phone} aria-label="تماس"><PhoneCall className="size-4" /></a>
                          </Button>
                        )}
                      </div>
                    </div>

                    <Link to={"/listings/" + item.slug} className="relative flex min-h-full items-center justify-center overflow-hidden bg-muted/55 p-2">
                      {image?.url ? (
                        <img src={image.url} alt={image.alt || item.title} className="h-full max-h-[280px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.015]" loading="lazy" />
                      ) : (
                        <Building2 className="size-12 text-muted-foreground/25" />
                      )}
                      {(item.images?.length ?? 0) > 0 && (
                        <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-lg bg-background/90 px-2 py-1 text-[10px] font-bold shadow-sm">
                          <Camera className="size-3.5" />{item.images.length.toLocaleString("fa-IR")}
                        </span>
                      )}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function FilterChip({
  label, detail, active, onClick,
}: {
  label: string;
  detail?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-xs font-extrabold transition-colors " + (
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"
      )}
    >
      {detail || label}<ChevronDown className="size-3.5" />
    </button>
  );
}

function FilterSelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className={"relative inline-flex h-10 shrink-0 items-center rounded-full border px-3 " + (
      value !== "همه" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
    )}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none bg-transparent pe-5 text-xs font-extrabold outline-none"
        aria-label={label}
      >
        <option value="همه">{label}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute end-2 size-3.5" />
    </label>
  );
}

function RangeFields({
  label, min, max, onMin, onMax,
}: {
  label: string;
  min: string;
  max: string;
  onMin: (value: string) => void;
  onMax: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" inputMode="numeric" min={0} placeholder="حداقل" value={min} onChange={(event) => onMin(event.target.value)} />
        <Input type="number" inputMode="numeric" min={0} placeholder="حداکثر" value={max} onChange={(event) => onMax(event.target.value)} />
      </div>
    </div>
  );
}
