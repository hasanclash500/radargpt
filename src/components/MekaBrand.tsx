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
      <img
        src="/divsaz-icon.svg"
        alt=""
        aria-hidden="true"
        className={
          "shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-border/50 " +
          (compact ? "size-9" : "size-11")
        }
      />
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
          املاک صنعتی و اداری
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
