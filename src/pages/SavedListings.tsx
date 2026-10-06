import { ThemeToggle } from "@/components/ThemeToggle";
import FavoriteButton from "@/components/listings/FavoriteButton";
import ListingPlaceholder from "@/components/listings/ListingPlaceholder";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { faNum, formatArea, formatPrice, formatRooms } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  Building2,
  Camera,
  Heart,
  MapPin,
} from "lucide-react";
import { Link } from "react-router";

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

export default function SavedListings() {
  const listings = useQuery(api.listings.listMyFavorites, {});

  return (
    <main
      dir="rtl"
      className="responsive-page min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-muted/30"
    >
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/listings"
            className="flex items-center gap-2 text-sm font-extrabold"
          >
            <ArrowRight className="size-4" />
            آگهی‌ها
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-bold text-muted-foreground sm:inline">
              ذخیره‌شده‌های من
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
              <Heart className="size-6 fill-current" />
            </span>
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">
                آگهی‌های ذخیره‌شده
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {listings === undefined
                  ? "در حال دریافت…"
                  : `${faNum(listings.length)} آگهی برای حساب شما`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-7">
        {listings === undefined ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            در حال دریافت آگهی‌های ذخیره‌شده…
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-background p-10 text-center sm:p-14">
            <Heart className="mx-auto size-11 text-muted-foreground/40" />
            <h2 className="mt-4 text-lg font-black">
              هنوز آگهی‌ای ذخیره نکرده‌اید
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">
              روی علامت قلب کنار هر آگهی بزنید تا آن ملک در این صفحه برای حساب
              شما نگه داشته شود.
            </p>
            <Button asChild className="mt-5 rounded-xl">
              <Link to="/listings">مشاهده آگهی‌ها</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {listings.map((item: any) => {
              const image =
                item.images?.find((entry: any) => entry.featured) ??
                item.images?.[0];
              return (
                <article
                  key={item.slug}
                  className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-primary/35 hover:shadow-md"
                >
                  <div className="grid min-h-[220px] sm:grid-cols-[minmax(0,1fr)_42%]">
                    <div className="flex min-w-0 flex-col p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                            {item.dealType}
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                            {item.propertyType}
                          </span>
                        </div>
                        <FavoriteButton
                          slug={item.slug}
                          className="size-9 shrink-0 rounded-full"
                        />
                      </div>

                      <Link
                        to={"/listings/" + item.slug}
                        className="mt-3 line-clamp-2 text-base font-black leading-7 hover:text-primary sm:text-lg"
                      >
                        {item.title}
                      </Link>

                      <strong className="mt-3 text-base text-primary">
                        {mainPrice(item)}
                      </strong>

                      {item.depositMillion != null &&
                        item.depositMillion > 0 &&
                        item.rentMillion != null &&
                        item.rentMillion > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            ودیعه {formatPrice(item.depositMillion)}
                          </p>
                        )}

                      <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                        {item.rooms != null && <span>{formatRooms(item.rooms)}</span>}
                        {item.area != null && <span>{formatArea(item.area)}</span>}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3 text-primary" />
                          {item.city}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={"/listings/" + item.slug}
                      className="relative flex min-h-[210px] items-center justify-center overflow-hidden bg-muted/55 p-2"
                    >
                      {image?.url ? (
                        <img
                          src={image.url}
                          alt={image.alt || item.title}
                          className="h-full max-h-[280px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.015]"
                          loading="lazy"
                        />
                      ) : (
                        <ListingPlaceholder compact className="min-h-[210px]" />
                      )}
                      {(item.images?.length ?? 0) > 0 && (
                        <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-lg bg-background/90 px-2 py-1 text-[10px] font-bold shadow-sm">
                          <Camera className="size-3.5" />
                          {faNum(item.images.length)}
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

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-6 text-xs text-muted-foreground">
          <Building2 className="size-4" />
          ذخیره‌ها فقط برای حساب واردشده شما نمایش داده می‌شوند.
        </div>
      </footer>
    </main>
  );
}
