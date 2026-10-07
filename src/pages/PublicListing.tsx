import PublicListingGallery from "@/components/listings/PublicListingGallery";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { faNum, formatArea, formatPrice, formatRooms } from "@/lib/format";
import { formatJalaliDate } from "@/lib/jalali";
import { useQuery } from "convex/react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronLeft,
  CircleDot,
  Factory,
  MapPin,
  PhoneCall,
  Ruler,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

function priceForSchema(item: any) {
  if (item.rentMillion != null && item.rentMillion > 0) {
    return item.rentMillion * 10_000_000;
  }
  if (item.priceMillion > 0) {
    return item.priceMillion * 10_000_000;
  }
  return undefined;
}

function mainPrice(item: any) {
  if (item.rentMillion != null && item.rentMillion > 0) {
    return `اجاره ${formatPrice(item.rentMillion)}`;
  }
  if (item.priceMillion != null && item.priceMillion > 0) {
    return formatPrice(item.priceMillion);
  }
  if (item.depositMillion != null && item.depositMillion > 0) {
    return `ودیعه ${formatPrice(item.depositMillion)}`;
  }
  return "قیمت توافقی";
}

function FeatureCard({
  label,
  value,
  icon: Icon = BadgeCheck,
}: {
  label: string;
  value: string;
  icon?: typeof BadgeCheck;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <strong className="block text-sm leading-6">{value}</strong>
          <span className="mt-0.5 block text-[10px] text-muted-foreground">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PublicListing() {
  const { slug = "" } = useParams();
  const listing = useQuery(api.listings.getPublicBySlug, { slug });

  const canonical =
    typeof window !== "undefined"
      ? `${window.location.origin}/listings/${slug}`
      : undefined;

  const schemaPrice = listing ? priceForSchema(listing) : undefined;
  const isLease =
    listing?.dealType?.includes("اجاره") || listing?.rentMillion != null;

  useSeo({
    title: listing?.seoTitle || "آگهی ملک | دیوساز",
    description: listing?.seoDescription || "",
    keywords: listing?.seoKeywords || [],
    canonical,
    image: listing?.ogImage || undefined,
    noIndex: listing?.noIndex ?? false,
    type: "website",
    jsonLd: listing
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "RealEstateListing",
              name: listing.title,
              description: listing.description,
              image: listing.images
                ?.map((image: any) => image.url)
                .filter(Boolean),
              additionalProperty: (listing.customFields || []).map(
                (field: any) => ({
                  "@type": "PropertyValue",
                  name: field.label,
                  value: field.unit
                    ? `${field.value} ${field.unit}`
                    : field.value,
                }),
              ),
              datePosted: new Date(listing.publishedAt).toISOString(),
              dateModified: new Date(listing.updatedAt).toISOString(),
              url: canonical,
              about: {
                "@type": "Place",
                name: listing.title,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: listing.city,
                  addressCountry: "IR",
                },
              },
              offers: {
                "@type": "Offer",
                price: schemaPrice,
                priceCurrency: schemaPrice ? "IRR" : undefined,
                businessFunction: isLease
                  ? "http://purl.org/goodrelations/v1#LeaseOut"
                  : "http://purl.org/goodrelations/v1#Sell",
                seller: {
                  "@type": "RealEstateAgent",
                  name: "دیوساز",
                  telephone: listing.contacts?.[0]?.phone || "09120858095",
                },
              },
            },
          ],
        }
      : undefined,
  });

  const share = async () => {
    if (!listing) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: listing.title,
          text: listing.seoDescription,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("لینک آگهی کپی شد");
      }
    } catch {
      // لغو اشتراک توسط کاربر
    }
  };

  if (listing === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        در حال بارگذاری آگهی…
      </div>
    );
  }

  if (listing === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-5 text-center">
        <div>
          <h1 className="text-2xl font-black">این آگهی عمومی نیست</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ممکن است آگهی حذف یا از حالت عمومی خارج شده باشد.
          </p>
          <Button asChild className="mt-5">
            <Link to="/listings">مشاهده آگهی‌های عمومی</Link>
          </Button>
        </div>
      </main>
    );
  }

  const consultant =
    listing.contacts?.find((contact: any) => contact.isCreator) ??
    listing.contacts?.find((contact: any) => Boolean(contact.profileSlug)) ??
    listing.contacts?.[0];
  const contactPhone =
    consultant?.phone ||
    listing.contacts?.find((contact: any) => Boolean(contact.phone))?.phone ||
    "";

  const publicFields = (listing.customFields || []).filter(
    (field: any) => String(field.value ?? "").trim().length > 0,
  );

  const requestIntent = isLease ? "rent" : "buy";
  const requestParams = new URLSearchParams({
    intent: requestIntent,
    property: listing.propertyType || "",
    city: listing.city || "شهریار",
    area: listing.area != null ? String(listing.area) : "",
    details: `درخواست بازدید برای آگهی: ${listing.title} - ${canonical || ""}`,
  });

  return (
    <main
      dir="rtl"
      className="responsive-page min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-background pb-24 text-foreground lg:pb-0"
    >
      <PublicListingGallery
        slug={listing.slug}
        title={listing.title}
        images={listing.images || []}
        onShare={() => void share()}
        requestHref={"/request?" + requestParams.toString()}
      />

      <section className="border-b border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          {consultant ? (
            consultant.profileSlug ? (
              <Link
                to={"/consultants/" + consultant.profileSlug}
                className="flex items-center gap-3 rounded-2xl transition-colors hover:bg-muted/55"
              >
                {consultant.profileImageUrl ? (
                  <img
                    src={consultant.profileImageUrl}
                    alt={consultant.name || "مشاور دیوساز"}
                    className="size-12 shrink-0 rounded-full border border-border/70 object-cover shadow-sm"
                  />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <strong className="block truncate text-sm">
                    {consultant.name || "مشاور دیوساز"}
                  </strong>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {consultant.role || "ثبت‌کننده آگهی"} · مشاهده پروفایل
                  </span>
                </div>
                <ChevronLeft className="me-auto size-5 text-muted-foreground" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                {consultant.profileImageUrl ? (
                  <img
                    src={consultant.profileImageUrl}
                    alt={consultant.name || "دیوساز"}
                    className="size-12 shrink-0 rounded-full border border-border/70 object-cover shadow-sm"
                  />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </span>
                )}
                <div>
                  <strong className="block text-sm">
                    {consultant.name || "دیوساز"}
                  </strong>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {consultant.role || "مشاور املاک"}
                  </span>
                </div>
              </div>
            )
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_310px]">
          <article className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                <CircleDot className="size-3 fill-current" />
                فعال
              </span>
              {listing.dealType && (
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary">
                  {listing.dealType}
                </span>
              )}
              {listing.featuredOnHome && (
                <span className="rounded-full bg-amber-400/20 px-3 py-1.5 text-[11px] font-black text-amber-700 dark:text-amber-300">
                  ویژه
                </span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-black leading-[1.5] sm:text-3xl">
              {listing.title}
            </h1>

            <strong className="mt-5 block text-3xl font-black tracking-tight sm:text-4xl">
              {mainPrice(listing)}
            </strong>

            {listing.depositMillion != null &&
              listing.depositMillion > 0 &&
              listing.rentMillion != null &&
              listing.rentMillion > 0 && (
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  ودیعه {formatPrice(listing.depositMillion)}
                </p>
              )}

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-bold">
              {listing.rooms != null && (
                <span>{formatRooms(listing.rooms)}</span>
              )}
              {listing.area != null && (
                <>
                  <span className="text-muted-foreground/35">|</span>
                  <span>{formatArea(listing.area)}</span>
                </>
              )}
              {listing.propertyType && (
                <>
                  <span className="text-muted-foreground/35">|</span>
                  <span>{listing.propertyType}</span>
                </>
              )}
            </div>

            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" />
              {listing.city}
            </p>

            <div className="mt-7 rounded-[1.7rem] border border-blue-200/70 bg-blue-50 p-5 text-slate-900 dark:border-blue-900/40 dark:bg-blue-950/25 dark:text-foreground">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                شرایط مالی این فایل
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {listing.depositMillion != null &&
                  listing.depositMillion > 0 && (
                    <div>
                      <span className="block text-[10px] text-muted-foreground">
                        ودیعه
                      </span>
                      <strong className="mt-1 block">
                        {formatPrice(listing.depositMillion)}
                      </strong>
                    </div>
                  )}
                {listing.rentMillion != null && listing.rentMillion > 0 && (
                  <div>
                    <span className="block text-[10px] text-muted-foreground">
                      اجاره ماهانه
                    </span>
                    <strong className="mt-1 block text-blue-700 dark:text-blue-300">
                      {formatPrice(listing.rentMillion)}
                    </strong>
                  </div>
                )}
                {(listing.rentMillion == null || listing.rentMillion <= 0) &&
                  listing.priceMillion > 0 && (
                    <div>
                      <span className="block text-[10px] text-muted-foreground">
                        قیمت فروش
                      </span>
                      <strong className="mt-1 block text-blue-700 dark:text-blue-300">
                        {formatPrice(listing.priceMillion)}
                      </strong>
                    </div>
                  )}
                {listing.pricePerMeter != null &&
                  listing.pricePerMeter > 0 && (
                    <div>
                      <span className="block text-[10px] text-muted-foreground">
                        قیمت هر متر
                      </span>
                      <strong className="mt-1 block">
                        {formatPrice(listing.pricePerMeter)}
                      </strong>
                    </div>
                  )}
              </div>
            </div>

            <section className="mt-7">
              <h2 className="text-lg font-black">مشخصات اصلی</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <FeatureCard
                  label="نوع ملک"
                  value={listing.propertyType || "ملک"}
                  icon={Factory}
                />
                <FeatureCard
                  label="متراژ"
                  value={
                    listing.area != null ? formatArea(listing.area) : "ثبت نشده"
                  }
                  icon={Ruler}
                />
                <FeatureCard
                  label="تعداد اتاق"
                  value={
                    listing.rooms != null
                      ? formatRooms(listing.rooms)
                      : "ثبت نشده"
                  }
                  icon={Building2}
                />
                <FeatureCard
                  label="تاریخ آگهی"
                  value={listing.dateRaw || "فعال"}
                  icon={CalendarDays}
                />
              </div>
            </section>

            {publicFields.length > 0 && (
              <section className="mt-7">
                <h2 className="text-lg font-black">مشخصات تخصصی ملک</h2>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  این موارد بر اساس نوع ملک و فیلدهای تخصصی تعریف‌شده در پنل
                  دیوساز نمایش داده می‌شوند.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {publicFields.map((field: any) => (
                    <FeatureCard
                      key={field.fieldId}
                      label={field.label}
                      value={
                        field.type === "date"
                          ? formatJalaliDate(field.value)
                          : `${field.value}${field.unit ? " " + field.unit : ""}`
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="mt-7 rounded-[1.7rem] border border-border/70 bg-card p-5 sm:p-6">
              <h2 className="text-lg font-black">توضیحات کامل ملک</h2>
              <div className="mt-4 whitespace-pre-line text-sm leading-8 text-foreground/80 sm:text-base sm:leading-9">
                {listing.description ||
                  "برای دریافت توضیحات تکمیلی و هماهنگی بازدید با دیوساز تماس بگیرید."}
              </div>
            </section>

            <section className="mt-5 rounded-[1.7rem] border border-primary/15 bg-primary/5 p-5">
              <h2 className="font-black">حریم خصوصی فایل</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                برای دریافت جزئیات کامل و هماهنگی بازدید با مشاور دیوساز تماس
                بگیرید.
              </p>
            </section>
          </article>

          <aside className="hidden space-y-4 lg:block lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[1.7rem] border border-border/70 bg-card p-5 shadow-sm">
              <h2 className="font-black">هماهنگی این فایل</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                برای جزئیات، بازدید و بررسی شرایط ملک با تیم دیوساز در ارتباط
                باشید.
              </p>
              {contactPhone && (
                <Button asChild className="mt-4 w-full gap-2 rounded-xl">
                  <a href={"tel:" + contactPhone}>
                    <PhoneCall className="size-4" />
                    تماس با مشاور
                  </a>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="mt-2 w-full rounded-xl"
              >
                <Link to={"/request?" + requestParams.toString()}>
                  درخواست بازدید
                </Link>
              </Button>
            </div>

            <div className="rounded-[1.7rem] border border-border/70 bg-muted/35 p-5">
              <span className="text-[10px] text-muted-foreground">
                کد صفحه عمومی
              </span>
              <strong className="mt-1 block font-mono text-xs" dir="ltr">
                {listing.slug}
              </strong>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 p-3 shadow-[0_-12px_35px_rgba(15,23,42,.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-[0.9fr_1.3fr] gap-2">
          {contactPhone ? (
            <Button
              asChild
              variant="outline"
              className="h-13 gap-2 rounded-2xl border-primary text-primary"
            >
              <a href={"tel:" + contactPhone}>
                <PhoneCall className="size-4" />
                تماس با مشاور
              </a>
            </Button>
          ) : (
            <Button
              disabled
              variant="outline"
              className="h-13 rounded-2xl"
            >
              تماس با مشاور
            </Button>
          )}
          <Button asChild className="h-13 rounded-2xl font-black">
            <Link to={"/request?" + requestParams.toString()}>
              درخواست بازدید
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
