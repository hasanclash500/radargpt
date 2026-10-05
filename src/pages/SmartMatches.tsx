import { ThemeToggle } from "@/components/ThemeToggle";
import DashboardSectionNav from "@/components/dashboard/DashboardSectionNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { formatArea, formatPrice } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  ExternalLink,
  PhoneCall,
  Sparkles,
  Target,
  UserRoundSearch,
} from "lucide-react";
import { Link } from "react-router";

const INTENTS: Record<string, string> = {
  buy: "خریدار",
  rent: "متقاضی اجاره",
};

function ListingMatchCard({ match }: { match: any }) {
  const item = match.listing;
  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_105px] sm:grid-cols-[minmax(0,1fr)_135px]">
        <div className="min-w-0 p-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={match.score >= 68 ? "default" : "secondary"}>
              {match.score.toLocaleString("fa-IR")}٪ · {match.label}
            </Badge>
            <span className="text-[10px] font-bold text-muted-foreground">
              {item.publicationStatus === "approved" ? "منتشرشده" : "فایل داخلی دیوساز"}
            </span>
          </div>

          <h3 className="mt-2 line-clamp-2 text-sm font-black leading-6">
            {item.title}
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {item.city || "—"} · {item.propertyType || "ملک"}
            {item.area != null ? ` · ${formatArea(item.area)}` : ""}
          </p>

          <div className="mt-2 space-y-1 text-xs">
            {item.depositMillion != null && item.depositMillion > 0 && (
              <p>
                <span className="text-muted-foreground">ودیعه: </span>
                <strong>{formatPrice(item.depositMillion)}</strong>
              </p>
            )}
            {item.rentMillion != null && item.rentMillion > 0 && (
              <p>
                <span className="text-muted-foreground">اجاره: </span>
                <strong>{formatPrice(item.rentMillion)}</strong>
              </p>
            )}
            {(item.rentMillion == null || item.rentMillion <= 0) &&
              item.priceMillion > 0 && (
                <p>
                  <span className="text-muted-foreground">قیمت: </span>
                  <strong>{formatPrice(item.priceMillion)}</strong>
                </p>
              )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {match.reasons.map((reason: string) => (
              <span
                key={reason}
                className="rounded-full bg-primary/8 px-2 py-0.5 text-[9px] font-bold text-primary"
              >
                {reason}
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {item.phone && (
              <Button asChild size="sm" className="h-8 gap-1.5 text-[11px]">
                <a href={`tel:${item.phone}`}>
                  <PhoneCall className="size-3.5" />
                  تماس با مالک
                </a>
              </Button>
            )}
            {item.isPublic && item.publicSlug && (
              <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-[11px]">
                <Link to={`/listings/${item.publicSlug}`} target="_blank">
                  <ExternalLink className="size-3.5" />
                  صفحه آگهی
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex min-h-36 items-center justify-center bg-muted/50 p-2">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full max-h-44 w-full object-contain"
              loading="lazy"
            />
          ) : (
            <Building2 className="size-10 text-muted-foreground/30" />
          )}
        </div>
      </div>
    </article>
  );
}

export default function SmartMatches() {
  const data = useQuery(api.matches.listSmartMatches, {});

  if (!data) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">در حال محاسبه تطبیق‌ها…</div>
      </main>
    );
  }

  if (!data.allowed) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-3xl border border-border p-6 text-center">
          <Target className="mx-auto size-9 text-muted-foreground" />
          <h1 className="mt-4 font-black">دسترسی به مچ هوشمند ندارید</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            این بخش فقط برای مدیر و ادمین آگهی فعال است.
          </p>
          <Button asChild className="mt-5">
            <Link to="/dashboard">بازگشت به پنل</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-muted/30">
      <header className="glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/admin">
                <ArrowRight className="size-4" />
                مدیریت
              </Link>
            </Button>
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BrainCircuit className="size-5" />
            </span>
            <strong>مچ هوشمند دیوساز</strong>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <DashboardSectionNav />

      <section className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:px-6 sm:py-8">
        <div className="rounded-3xl border border-primary/20 bg-primary/[0.04] p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 size-6 shrink-0 text-primary" />
            <div>
              <h1 className="text-xl font-black sm:text-2xl">
                تطبیق متقاضیان با فایل‌های خود دیوساز
              </h1>
              <p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground sm:text-sm">
                موتور تطبیق فقط آگهی‌های ذخیره‌شده در دیتابیس دیوساز را بررسی می‌کند.
                شهر، نوع معامله، نوع ملک، متراژ، بودجه، ودیعه و اجاره در امتیاز
                تطبیق لحاظ می‌شوند و برای هر متقاضی نزدیک‌ترین فایل‌ها نمایش داده
                می‌شوند.
              </p>
            </div>
          </div>
        </div>

        {data.groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-background p-10 text-center">
            <UserRoundSearch className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-4 font-black">تطبیق قابل‌نمایشی پیدا نشد</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ابتدا درخواست خرید یا اجاره از بخش متقاضیان ثبت کنید یا فایل‌های دیوساز را تکمیل کنید.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {data.groups.map((group: any) => (
              <section
                key={String(group.lead.id)}
                className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm"
              >
                <div className="border-b border-border/60 bg-card/70 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{INTENTS[group.lead.intent] || group.lead.intent}</Badge>
                        <h2 className="font-black">{group.lead.name}</h2>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {group.lead.propertyType} · {group.lead.city}
                        {group.lead.area != null
                          ? ` · حدود ${formatArea(group.lead.area)}`
                          : ""}
                      </p>
                      {group.lead.budget && (
                        <p className="mt-2 text-xs">
                          <strong>بودجه/شرایط:</strong> {group.lead.budget}
                        </p>
                      )}
                      {group.lead.details && (
                        <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground">
                          {group.lead.details}
                        </p>
                      )}
                    </div>
                    <Button asChild size="sm" className="gap-1.5 self-start">
                      <a href={`tel:${group.lead.phone}`}>
                        <PhoneCall className="size-4" />
                        {group.lead.phone}
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
                    <Target className="size-4 text-primary" />
                    {group.matches.length.toLocaleString("fa-IR")} فایل پیشنهادی
                  </p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {group.matches.map((match: any) => (
                      <ListingMatchCard
                        key={String(match.listing.id)}
                        match={match}
                      />
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
