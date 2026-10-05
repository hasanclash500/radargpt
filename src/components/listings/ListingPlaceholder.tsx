import { cn } from "@/lib/utils";

export default function ListingPlaceholder({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-card to-primary/15",
        className,
      )}
      aria-label="تصویر پیش‌فرض آگهی دیوساز"
      role="img"
    >
      <div className="pointer-events-none absolute -start-12 -top-12 size-40 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -end-10 size-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative flex flex-col items-center gap-2.5">
        <img
          src="/divsaz-icon.svg"
          alt=""
          aria-hidden="true"
          className={cn(
            "rounded-[28%] shadow-xl ring-1 ring-white/10",
            compact ? "size-16" : "size-24 sm:size-28",
          )}
          loading="lazy"
          decoding="async"
        />
        {!compact && (
          <div className="text-center">
            <p className="text-sm font-black tracking-tight text-foreground/85">
              دیوساز
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              تصویر این آگهی هنوز ثبت نشده است
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
