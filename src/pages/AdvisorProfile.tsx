import MekaBrand from "@/components/MekaBrand";
import PublicStoryStrip from "@/components/stories/PublicStoryStrip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { formatArea, formatPrice } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  BadgeCheck,
  Building2,
  Globe2,
  Instagram,
  MapPin,
  MessageCircle,
  PhoneCall,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link, useParams } from "react-router";

function normalizeWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("98")) return digits;
  if (digits.startsWith("0")) return "98" + digits.slice(1);
  return digits;
}

export default function AdvisorProfile() {
  const { slug = "" } = useParams();
  const profile = useQuery(api.advisors.getPublicBySlug, { slug });

  useSeo({
    title: profile ? profile.displayName + " | مشاور دیوساز" : "مشاور دیوساز",
    description: profile?.bio || profile?.headline || "پروفایل مشاور دیوساز",
    type: "website",
    canonical: `https://divsaz.ir/consultants/${encodeURIComponent(slug)}`,
    noIndex: !profile,
  });

  if (profile === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        در حال بارگذاری پروفایل…
      </div>
    );
  }

  if (!profile) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-5">
        <div className="text-center">
          <h1 className="text-2xl font-black">پروفایل مشاور پیدا نشد</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            این پروفایل عمومی نیست یا آدرس آن تغییر کرده است.
          </p>
          <Button asChild className="mt-5">
            <Link to="/">صفحه اصلی</Link>
          </Button>
        </div>
      </main>
    );
  }

  const wa = normalizeWhatsapp(profile.whatsapp || profile.publicPhone || "");
  const socialLinks = [
    profile.publicPhone
      ? { label: "تماس مستقیم", href: "tel:" + profile.publicPhone, icon: PhoneCall, primary: true }
      : null,
    wa
      ? { label: "واتساپ", href: "https://wa.me/" + wa, icon: MessageCircle }
      : null,
    profile.instagram
      ? { label: "اینستاگرام", href: "https://instagram.com/" + profile.instagram, icon: Instagram }
      : null,
    profile.telegram
      ? { label: "تلگرام", href: "https://t.me/" + profile.telegram, icon: Send }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    href: string;
    icon: typeof PhoneCall;
    primary?: boolean;
  }>;

  return (
    <main dir="rtl" className="responsive-page min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-muted/20 pb-10">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <MekaBrand compact />
          <ThemeToggle />
        </div>
      </header>

      <PublicStoryStrip advisorUserId={profile.userId} />

      <section className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-sm">
          <div className="relative min-h-44 bg-gradient-to-l from-primary/10 via-background to-amber-50/50 dark:to-amber-950/10">
            {profile.coverImageUrl ? (
              <img
                src={profile.coverImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
            ) : (
              <div className="absolute inset-0 grid-overlay opacity-25" />
            )}
            <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
              <div className="flex items-center gap-4">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.displayName}
                    className="size-28 rounded-3xl border-4 border-background object-cover shadow-lg sm:size-32"
                  />
                ) : (
                  <div className="flex size-28 items-center justify-center rounded-3xl border-4 border-background bg-primary/10 text-3xl font-black text-primary shadow-lg sm:size-32">
                    {profile.displayName.slice(0, 1)}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black sm:text-3xl">
                      {profile.displayName}
                    </h1>
                    {profile.verified && (
                      <BadgeCheck className="size-5 text-amber-500" />
                    )}
                  </div>
                  <p className="mt-2 text-sm font-bold text-muted-foreground">
                    {profile.headline}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-[11px] font-bold">
                      <MapPin className="size-3.5 text-primary" />
                      {[profile.city, profile.region].filter(Boolean).join(" · ")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary">
                      <ShieldCheck className="size-3.5" />
                      عضو دیوساز
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/listings">آگهی‌های دیوساز</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {profile.bio && (
          <section className="mt-4 rounded-[1.8rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h2 className="text-lg font-black">درباره من</h2>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-8 text-muted-foreground">
              {profile.bio}
            </p>
          </section>
        )}

        {socialLinks.length > 0 && (
          <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {socialLinks.map(({ label, href, icon: Icon, primary }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
                className={
                  "flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-extrabold transition-transform hover:-translate-y-0.5 " +
                  (primary
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-card")
                }
              >
                <Icon className="size-4" />
                {label}
              </a>
            ))}
          </section>
        )}

        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card text-sm font-extrabold"
          >
            <Globe2 className="size-4 text-primary" />
            وب‌سایت مشاور
          </a>
        )}

        <section className="mt-4 grid grid-cols-3 overflow-hidden rounded-[1.8rem] border border-border/70 bg-card shadow-sm">
          <div className="p-4 text-center">
            <Building2 className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-xl font-black">{profile.listingCount.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">فایل عمومی</p>
          </div>
          <div className="border-x border-border/60 p-4 text-center">
            <UsersRound className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-xl font-black">{profile.successfulDeals.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">معامله موفق</p>
          </div>
          <div className="p-4 text-center">
            <MessageCircle className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-xl font-black">{profile.activeRequests.toLocaleString("fa-IR")}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">درخواست فعال</p>
          </div>
        </section>

        {profile.listings.length > 0 && (
          <section className="mt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-primary">فایل‌های مشاور</p>
                <h2 className="mt-1 text-xl font-black">املاک ویژه</h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/listings">مشاهده همه</Link>
              </Button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {profile.listings.slice(0, 6).map((item: any) => (
                <Link
                  key={item.slug}
                  to={"/listings/" + item.slug}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-transform hover:-translate-y-1"
                >
                  <div className="aspect-[16/9] bg-muted/50 p-2">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2 className="size-10 text-muted-foreground/25" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1.5 text-[9px]">
                      <span className="rounded-full bg-primary/10 px-2 py-1 font-bold text-primary">
                        {item.dealType}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-1 font-bold text-muted-foreground">
                        {item.propertyType}
                      </span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-black leading-6">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {item.city}
                      {item.area != null ? " · " + formatArea(item.area) : ""}
                    </p>
                    <p className="mt-2 text-xs font-extrabold text-primary">
                      {item.rentMillion != null && item.rentMillion > 0
                        ? "اجاره " + formatPrice(item.rentMillion)
                        : item.priceMillion > 0
                          ? formatPrice(item.priceMillion)
                          : "قیمت توافقی"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {profile.specialties.length > 0 && (
          <section className="mt-5 rounded-[1.8rem] border border-border/70 bg-card p-5">
            <h2 className="font-black">تخصص‌ها و حوزه فعالیت</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.specialties.map((item: string) => (
                <span
                  key={item}
                  className="rounded-full border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
