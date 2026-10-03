import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { formatArea, formatPrice, formatRooms } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  MapPin,
  PhoneCall,
  Ruler,
  Share2,
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

export default function PublicListing() {
  const { slug = "" } = useParams();
  const listing = useQuery(api.listings.getPublicBySlug, { slug });
  const canonical =
    typeof window !== "undefined"
      ? `${window.location.origin}/listings/${slug}`
      : undefined;

  const schemaPrice = listing ? priceForSchema(listing) : undefined;
  const isLease = listing?.dealType?.includes("اجاره") || listing?.rentMillion != null;

  useSeo({
    title: listing?.seoTitle || "آگهی ملک | مکا",
    description: listing?.seoDescription || "",
    keywords: listing?.seoKeywords || [],
    canonical,
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
                  name: "مکا",
                  telephone: listing.contacts?.[0]?.phone || "09120858095",
                },
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "مکا",
                  item: typeof window !== "undefined" ? window.location.origin : undefined,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "آگهی‌ها",
                  item:
                    typeof window !== "undefined"
                      ? `${window.location.origin}/listings`
                      : undefined,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: listing.title,
                  item: canonical,
                },
              ],
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
      // کاربر اشتراک را لغو کرده است.
    }
  };

  if (listing === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        در حال بارگذاری آگهی…
      </div>
    );
  }

  if (listing === null) {
    return (
      <main className="flex min-h-screen items-center justify-center p-5 text-center">
        <div>
          <h1 className="text-2xl font-extrabold">این آگهی عمومی نیست</h1>
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

  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/listings" className="flex items-center gap-2 text-sm font-extrabold">
            <ArrowRight className="size-4" />
            آگهی‌های مکا
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => void share()}
              aria-label="اشتراک آگهی"
            >
              <Share2 className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />
        <div className="pointer-events-none absolute inset-0 glow-emerald opacity-70" />
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 font-bold text-primary">
              {listing.dealType}
            </span>
            <span className="rounded-full border border-border/70 px-3 py-1.5 text-muted-foreground">
              {listing.propertyType}
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-extrabold leading-[1.45] tracking-tight sm:text-4xl">
            {listing.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" />
              {listing.city}
            </span>
            {listing.area != null && (
              <span className="flex items-center gap-1.5">
                <Ruler className="size-4 text-primary" />
                {formatArea(listing.area)}
              </span>
            )}
            {listing.dateRaw && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-primary" />
                {listing.dateRaw}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_300px] lg:py-10">
        <article className="min-w-0">
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <p className="text-xs text-muted-foreground">متراژ</p>
              <p className="mt-2 font-extrabold">{formatArea(listing.area)}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <p className="text-xs text-muted-foreground">اتاق</p>
              <p className="mt-2 font-extrabold">{formatRooms(listing.rooms)}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <p className="text-xs text-muted-foreground">نوع ملک</p>
              <p className="mt-2 font-extrabold">{listing.propertyType}</p>
            </div>
          </section>

          <section className="mt-5 rounded-[1.8rem] border border-border/70 bg-card/70 p-5 sm:p-7">
            <h2 className="text-xl font-extrabold">توضیحات کامل ملک</h2>
            <div className="mt-4 whitespace-pre-line text-[15px] leading-8 text-foreground/80 sm:text-base sm:leading-9">
              {listing.description || "برای دریافت توضیحات تکمیلی با مکا تماس بگیرید."}
            </div>
          </section>

          <section className="mt-5 rounded-[1.8rem] border border-primary/20 bg-primary/5 p-5">
            <h2 className="font-extrabold">حریم خصوصی آگهی</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              برای حفظ حریم خصوصی مالک، آدرس دقیق، محله، شماره مالک، یادداشت‌های داخلی
              و لینک منبع در این صفحه نمایش داده نمی‌شوند. موقعیت عمومی فقط در سطح شهر
              اعلام شده است.
            </p>
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[1.8rem] border border-border/70 bg-card p-5">
            <p className="text-xs text-muted-foreground">شرایط مالی</p>
            <div className="mt-3 space-y-2">
              {listing.depositMillion != null && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">ودیعه</span>
                  <strong>{formatPrice(listing.depositMillion)}</strong>
                </div>
              )}
              {listing.rentMillion != null && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">اجاره ماهانه</span>
                  <strong className="text-primary">
                    {formatPrice(listing.rentMillion)}
                  </strong>
                </div>
              )}
              {listing.rentMillion == null && listing.priceMillion > 0 && (
                <p className="text-xl font-extrabold text-primary">
                  {formatPrice(listing.priceMillion)}
                </p>
              )}
              {listing.rentMillion == null && listing.priceMillion <= 0 && (
                <p className="font-bold">قیمت توافقی</p>
              )}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              <h2 className="font-extrabold">تماس برای این ملک</h2>
            </div>
            <div className="mt-4 space-y-3">
              {listing.contacts.map((contact: any) => (
                <a
                  key={`${contact.role}-${contact.phone}`}
                  href={`tel:${contact.phone}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/40"
                >
                  <div>
                    <p className="text-sm font-extrabold">{contact.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{contact.role}</p>
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-primary" dir="ltr">
                    <PhoneCall className="size-4" />
                    {contact.phone}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
