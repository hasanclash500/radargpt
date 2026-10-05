import { Building2 } from "lucide-react";
import { Link } from "react-router";

export default function MekaBrand({
  compact = false,
  link = true,
}: {
  compact?: boolean;
  link?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-2.5" dir="rtl">
      <span
        className={
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/25 bg-primary/8 text-primary " +
          (compact ? "size-9" : "size-11")
        }
      >
        <span className="absolute inset-1 rounded-xl border border-primary/15" />
        <Building2 className={compact ? "size-5" : "size-6"} />
      </span>

      <span className="min-w-0">
        <span
          className={
            "block whitespace-nowrap font-black leading-none tracking-[-0.035em] text-foreground " +
            (compact ? "text-[21px]" : "text-[29px]")
          }
          aria-label="دیوساز"
        >
          دیوساز
        </span>
        <span
          className={
            "mt-1 block whitespace-nowrap font-bold text-muted-foreground " +
            (compact ? "text-[9px]" : "text-[11px]")
          }
        >
          مرجع املاک صنعتی و اداری
        </span>
      </span>
    </div>
  );

  return link ? (
    <Link to="/" aria-label="دیوساز - صفحه اصلی">
      {content}
    </Link>
  ) : (
    content
  );
}
