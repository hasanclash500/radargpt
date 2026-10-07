import FavoriteButton from "@/components/listings/FavoriteButton";
import ListingPlaceholder from "@/components/listings/ListingPlaceholder";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Copy,
  Heart,
  Images,
  List,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

export default function PublicListingGallery({
  slug,
  title,
  images,
  onShare,
  requestHref,
}: {
  slug: string;
  title: string;
  images: Array<{ url: string; alt?: string; featured?: boolean; order?: number }>;
  onShare: () => void;
  requestHref: string;
}) {
  const featured = images.findIndex((image) => image.featured);
  const [active, setActive] = useState(featured >= 0 ? featured : 0);
  const touchStart = useRef<number | null>(null);

  const show = (index: number) => {
    if (images.length <= 1) return;
    const next = (index + images.length) % images.length;
    setActive(next);
  };

  const onTouchStart = (event: React.TouchEvent) => {
    touchStart.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStart.current == null || images.length <= 1) return;
    const end = event.changedTouches[0]?.clientX ?? touchStart.current;
    const delta = end - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) < 45) return;
    if (delta < 0) show(active + 1);
    else show(active - 1);
  };

  return (
    <section
      className="relative bg-slate-950"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="گالری تصاویر آگهی"
    >
      <div className="relative flex h-[52dvh] min-h-[420px] max-h-[680px] items-center justify-center overflow-hidden sm:h-[64vh]">
        {images.length > 0 ? (
          <img
            key={images[active]?.url}
            src={images[active]?.url}
            alt={images[active]?.alt || title}
            className="h-full w-full object-contain"
            fetchPriority="high"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full bg-background p-3">
            <ListingPlaceholder className="h-full min-h-0" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

        <Button
          asChild
          variant="secondary"
          size="icon"
          className="absolute start-4 top-4 z-20 size-11 rounded-full border-0 bg-white/90 text-slate-900 shadow-lg hover:bg-white sm:start-6 sm:top-6"
        >
          <Link to="/listings" aria-label="بازگشت به آگهی‌ها">
            <ArrowRight className="size-5" />
          </Link>
        </Button>

        <div className="absolute end-4 top-4 z-20 flex items-center gap-2 sm:end-6 sm:top-6">
          <div className="flex items-center rounded-full bg-white/90 p-1 text-slate-900 shadow-lg backdrop-blur">
            <FavoriteButton
              slug={slug}
              variant="ghost"
              className="size-10 rounded-full border-0 bg-transparent text-slate-900 hover:bg-slate-100"
            />
            <button
              type="button"
              onClick={onShare}
              className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
              aria-label="اشتراک آگهی"
            >
              <Share2 className="size-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
                  aria-label="گزینه‌های بیشتر آگهی"
                >
                  <MoreHorizontal className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-52 rounded-2xl p-2 text-right"
                dir="rtl"
              >
                <DropdownMenuItem
                  className="rounded-xl py-2.5"
                  onSelect={() => {
                    void navigator.clipboard
                      .writeText(window.location.href)
                      .then(() => toast.success("لینک آگهی کپی شد"))
                      .catch(() => toast.error("کپی لینک انجام نشد"));
                  }}
                >
                  <Copy className="size-4" />
                  کپی لینک آگهی
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2.5">
                  <Link to="/saved">
                    <Heart className="size-4" />
                    ذخیره‌شده‌های من
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2.5">
                  <Link to={requestHref}>
                    <CalendarCheck2 className="size-4" />
                    درخواست بازدید
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl py-2.5">
                  <Link to="/listings">
                    <List className="size-4" />
                    همه آگهی‌ها
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => show(active - 1)}
              className="absolute start-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur sm:flex"
              aria-label="عکس قبلی"
            >
              <ArrowRight className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => show(active + 1)}
              className="absolute end-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur sm:flex"
              aria-label="عکس بعدی"
            >
              <ArrowLeft className="size-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 start-4 z-20 flex items-center gap-2 sm:bottom-6 sm:start-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/55 px-3 py-2 text-xs font-black text-white backdrop-blur">
            <Images className="size-4" />
            {images.length > 0 ? `${active + 1} / ${images.length} عکس` : "بدون عکس"}
          </span>
        </div>

        {images.length > 1 && (
          <div className="absolute inset-x-6 bottom-5 z-20 mx-auto flex max-w-md gap-1.5 sm:bottom-7">
            {images.slice(0, 8).map((image, index) => (
              <button
                key={image.url + index}
                type="button"
                onClick={() => setActive(index)}
                className={
                  "h-1.5 flex-1 rounded-full transition-colors " +
                  (active === index ? "bg-white" : "bg-white/45")
                }
                aria-label={`نمایش عکس ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
