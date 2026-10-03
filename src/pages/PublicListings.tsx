import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { formatArea, formatPrice } from "@/lib/format";
import { usePaginatedQuery } from "convex/react";
import {
  ArrowLeft,
  Building2,
  Factory,
  MapPin,
  PhoneCall,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

export default function PublicListings() {
  const { results: listings, status, loadMore } = usePaginatedQuery(
    api.listings.listPublicPaged,
    {},
    { initialNumItems: 24 },
  );
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("همه");
  const [dealType, setDealType] = useState("همه");

  useSeo({
    title: "آگهی‌های املاک صنعتی و اداری شهریار | مکا",
    description:
      "فایل‌های منتخب و عمومی املاک صنعتی و اداری شهریار؛ سوله، کارخانه، کارگاه و دفتر اداری با اطلاعات کامل و تماس مستقیم با مکا.",
    keywords: [
      "املاک صنعتی شهریار",
      "املاک اداری شهریار",
      "اجاره سوله شهریار",
      "اجاره دفتر شهریار",
      "مکا",
    ],
    type: "website",
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (listings || []).filter((item) => {
      const matchesSearch =
        !q ||
        [item.title, item.description, item.city, item.propertyType, item.dealType]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesProperty =
        propertyType === "همه" || item.propertyType === propertyType;
      const matchesDeal = dealType === "همه" || item.dealType === dealType;
      return matchesSearch && matchesProperty && matchesDeal;
    });
  }, [listings, search, propertyType, dealType]);

  const propertyTypes = useMemo(
    () => Array.from(new Set((listings || []).map((item) => item.propertyType))),
    [listings],
  );
  const dealTypes = useMemo(
    () => Array.from(new Set((listings || []).map((item) => item.dealType))),
    [listings],
  );

  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <span>
              <strong className="block leading-none">مکا</strong>
              <span className="mt-1 block text-[10px] text-muted-foreground">
                آگهی‌های عمومی
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/blog">وبلاگ</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/50">
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-45" />
        <div className="pointer-events-none absolute inset-0 glow-emerald opacity-80" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            <Factory className="size-4" />
            فایل‌های منتخب مکا
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">
            املاک صنعتی و اداری
            <span className="text-gradient-brand"> آماده بررسی</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
            اطلاعات عمومی هر فایل با حفظ حریم خصوصی مالک منتشر می‌شود. برای دریافت
            جزئیات تکمیلی و هماهنگی بازدید با مدیر یا مشاور مکا تماس بگیرید.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        <div className="grid gap-3 rounded-[1.6rem] border border-border/70 bg-card/70 p-4 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان، توضیحات یا شهر…"
              className="h-11 rounded-xl pe-9"
            />
          </div>

          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
            aria-label="نوع ملک"
          >
            <option value="همه">همه نوع ملک‌ها</option>
            {propertyTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={dealType}
            onChange={(e) => setDealType(e.target.value)}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
            aria-label="نوع معامله"
          >
            <option value="همه">همه معاملات</option>
            {dealTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="size-4" />
          {filtered.length.toLocaleString("fa-IR")} آگهی عمومی
        </div>

        {status === "LoadingFirstPage" ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            در حال دریافت آگهی‌ها…
          </div>
        ) : filtered.length === 0 ? (
          <div className="my-8 rounded-3xl border border-dashed border-border p-12 text-center">
            <Building2 className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-4 font-extrabold">آگهی عمومی پیدا نشد</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              فیلترها را تغییر دهید یا بعداً دوباره بررسی کنید.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const contact = item.contacts?.[0];
              return (
                <article
                  key={item.slug}
                  className="group flex flex-col overflow-hidden rounded-[1.7rem] border border-border/70 bg-card/75 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/14 via-card to-gold/10">
                    {item.ogImage ? (
                      <img
                        src={item.ogImage}
                        alt={item.images?.find((image: any) => image.featured)?.alt || item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 grid-overlay opacity-35" />
                    )}
                    <span className="absolute end-4 top-4 rounded-full border border-primary/20 bg-background/85 px-3 py-1 text-[11px] font-bold text-primary shadow-sm backdrop-blur">
                      {item.dealType}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 text-primary" />
                      {item.city}
                      <span>•</span>
                      {item.propertyType}
                    </div>

                    <h2 className="mt-3 line-clamp-2 text-lg font-extrabold leading-8">
                      <Link
                        to={`/listings/${item.slug}`}
                        className="transition-colors group-hover:text-primary"
                      >
                        {item.title}
                      </Link>
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {item.area != null && (
                        <span className="rounded-lg bg-muted/60 px-2.5 py-1.5">
                          {formatArea(item.area)}
                        </span>
                      )}
                      <span className="rounded-lg bg-muted/60 px-2.5 py-1.5">
                        {item.propertyType}
                      </span>
                    </div>

                    <div className="mt-4">
                      {item.rentMillion != null ? (
                        <div className="space-y-1">
                          {item.depositMillion != null && (
                            <p className="text-xs text-muted-foreground">
                              ودیعه: {formatPrice(item.depositMillion)}
                            </p>
                          )}
                          <p className="text-lg font-extrabold text-primary">
                            اجاره: {formatPrice(item.rentMillion)}
                          </p>
                        </div>
                      ) : item.priceMillion > 0 ? (
                        <p className="text-lg font-extrabold text-primary">
                          {formatPrice(item.priceMillion)}
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-muted-foreground">
                          قیمت توافقی
                        </p>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">
                      {item.description || "برای اطلاعات کامل این ملک وارد صفحه آگهی شوید."}
                    </p>

                    <div className="mt-auto flex gap-2 pt-5">
                      <Button asChild className="flex-1 gap-1.5 rounded-xl">
                        <Link to={`/listings/${item.slug}`}>
                          مشاهده کامل
                          <ArrowLeft className="size-4" />
                        </Link>
                      </Button>
                      {contact?.phone && (
                        <Button asChild variant="outline" size="icon" className="rounded-xl">
                          <a href={`tel:${contact.phone}`} aria-label="تماس">
                            <PhoneCall className="size-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {status === "CanLoadMore" && (
          <div className="mt-7 flex justify-center">
            <Button variant="outline" onClick={() => loadMore(24)} className="rounded-xl">
              نمایش آگهی‌های بیشتر
            </Button>
          </div>
        )}
        {status === "LoadingMore" && (
          <p className="mt-7 text-center text-xs text-muted-foreground">
            در حال دریافت آگهی‌های بیشتر…
          </p>
        )}
      </section>
    </main>
  );
}
