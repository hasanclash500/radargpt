import BrandStorySection from "@/components/BrandStorySection";
import BuilderBlockShell from "@/components/pages/BuilderBlockShell";
import CustomHtmlContent from "@/components/pages/CustomHtmlContent";
import { ThemeToggle } from "@/components/ThemeToggle";
import MekaBrand from "@/components/MekaBrand";
import PublicStoryStrip from "@/components/stories/PublicStoryStrip";
import NavigationAppChooser from "@/components/navigation/NavigationAppChooser";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ListingPlaceholder from "@/components/listings/ListingPlaceholder";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { formatArea, formatPrice } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  Bot,
  Building2,
  ClipboardList,
  Factory,
  HandCoins,
  KeyRound,
  MapPin,
  Menu,
  Navigation,
  PhoneCall,
  Search,
  Sparkles,
  UserPlus,
  LogIn,
  Newspaper,
} from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router";

type PageBlock = {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  props: Record<string, any>;
};

type BuilderEditorController = {
  selectedBlockId?: string;
  device?: "desktop" | "tablet" | "mobile";
  onSelectBlock?: (id: string) => void;
  onInsertWidget?: (
    target: { kind: "root"; index: number } | { kind: "column"; containerId: string; columnId: string; index?: number },
    widgetType: string,
  ) => void;
  onMoveBlock?: (
    blockId: string,
    target: { kind: "root"; index: number } | { kind: "column"; containerId: string; columnId: string; index?: number },
  ) => void;
  onResizeColumns?: (
    containerId: string,
    leftColumnId: string,
    rightColumnId: string,
    deltaPercent: number,
  ) => void;
};

type SitePage = {
  title: string;
  isHomepage?: boolean;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
  settings?: Record<string, any>;
  blocks: PageBlock[];
};

function safeHref(value: unknown) {
  const href = String(value ?? "").trim();
  if (!href) return "#";
  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("tel:") ||
    /^https:\/\//i.test(href)
  ) {
    return href;
  }
  return "#";
}

function SmartLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const safe = safeHref(href);
  if (safe.startsWith("/")) {
    return <Link to={safe} className={className}>{children}</Link>;
  }
  return (
    <a
      href={safe}
      className={className}
      {...(safe.startsWith("https://") ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function PublicHeader() {
  return (
    <header className="glass relative z-40 border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <MekaBrand compact />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="size-10 rounded-xl" aria-label="منو">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" dir="rtl" className="w-[88vw] max-w-sm p-0">
              <SheetHeader className="border-b border-border/60 p-5 pe-12 text-right">
                <SheetTitle><MekaBrand compact /></SheetTitle>
                <SheetDescription className="pt-2 text-right">دسترسی سریع به خدمات دیوساز</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-1 overflow-y-auto p-3">
                {[
                  ["/listings", Search, "آگهی‌ها و جستجوی ملک"],
                  ["/assistant", Bot, "دستیار هوشمند دیوساز"],
                  ["/submit-listing", Building2, "ثبت آگهی ملک"],
                  ["/request", ClipboardList, "ثبت تقاضای ملک"],
                  ["/blog", Newspaper, "وبلاگ و راهنما"],
                  ["/about", Sparkles, "درباره دیوساز"],
                  ["/dashboard", Building2, "پنل خدمات دیوساز"],
                ].map(([href, Icon, label]: any) => (
                  <SheetClose asChild key={href}>
                    <Link to={href} className="flex items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-extrabold hover:bg-muted">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </span>
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <SheetFooter className="border-t border-border/60 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <SheetClose asChild>
                    <Button asChild variant="outline" className="h-11 gap-2 rounded-xl">
                      <Link to="/auth?mode=signIn&returnTo=/dashboard"><LogIn className="size-4" />ورود</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild className="h-11 gap-2 rounded-xl">
                      <Link to="/auth?mode=signUp&returnTo=/dashboard"><UserPlus className="size-4" />ثبت‌نام</Link>
                    </Button>
                  </SheetClose>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function HeroBlock({ props }: { props: Record<string, any> }) {
  const imageUrl = safeHref(props.imageUrl || "");
  const hasImage = imageUrl !== "#";
  const imagePosition = props.imagePosition === "start" ? "start" : "end";

  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_38%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className={hasImage ? "grid items-center gap-8 md:grid-cols-2" : ""}>
          <div className={"max-w-3xl " + (hasImage && imagePosition === "start" ? "md:order-2" : "")}>
          {props.eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">
              <Sparkles className="size-3.5" />{props.eyebrow}
            </span>
          )}
          <h1 className="mt-5 text-4xl font-black leading-[1.25] sm:text-6xl">
            {props.title || "دیوساز"}
            {props.highlight && <span className="mt-2 block text-primary">{props.highlight}</span>}
          </h1>
          {props.text && <p className="mt-5 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">{props.text}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            {props.primaryLabel && (
              <Button asChild size="lg" className="rounded-2xl">
                <SmartLink href={props.primaryHref}>{props.primaryLabel}</SmartLink>
              </Button>
            )}
            {props.secondaryLabel && (
              <Button asChild size="lg" variant="outline" className="rounded-2xl">
                <SmartLink href={props.secondaryHref}>{props.secondaryLabel}</SmartLink>
              </Button>
            )}
          </div>
          </div>

          {hasImage && (
            <div
              className={
                "flex min-h-64 items-center justify-center overflow-hidden rounded-[2rem] bg-muted/50 " +
                (imagePosition === "start" ? "md:order-1" : "")
              }
            >
              <img
                src={imageUrl}
                alt={props.imageAlt || props.title || "تصویر صفحه دیوساز"}
                className="h-full max-h-[520px] w-full object-contain"
                loading="eager"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function IntentHubBlock({ props }: { props: Record<string, any> }) {
  const types = Array.isArray(props.propertyTypes) && props.propertyTypes.length
    ? props.propertyTypes
    : ["سوله", "کارخانه", "کارگاه", "انبار", "زمین صنعتی", "دفتر اداری"];
  const actions = [
    { label: "می‌خرم", href: "/listings?deal=" + encodeURIComponent("فروش"), icon: Search },
    { label: "اجاره می‌کنم", href: "/listings?deal=" + encodeURIComponent("رهن و اجاره"), icon: KeyRound },
    { label: "می‌فروشم", href: "/submit-listing?deal=" + encodeURIComponent("فروش"), icon: HandCoins },
    { label: "اجاره می‌دهم", href: "/submit-listing?deal=" + encodeURIComponent("رهن و اجاره"), icon: Building2 },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-[2rem] border border-primary/20 bg-card p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-black sm:text-2xl">{props.title || "چه کاری می‌خواهید انجام دهید؟"}</h2>
        {props.text && <p className="mt-2 text-sm leading-7 text-muted-foreground">{props.text}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {actions.map(({ label, href, icon: Icon }) => (
            <Link key={label} to={href} className="rounded-2xl border border-border/70 bg-background p-4 text-center font-extrabold hover:border-primary/40 hover:bg-primary/5">
              <Icon className="mx-auto size-5 text-primary" />
              <span className="mt-2 block text-sm">{label}</span>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {types.map((type: string) => (
            <Link
              key={type}
              to={"/listings?property=" + encodeURIComponent(type)}
              className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-bold hover:border-primary/40 hover:text-primary"
            >
              {type}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ListingsBlock({
  props,
  editing = false,
}: {
  props: Record<string, any>;
  editing?: boolean;
}) {
  const listings = useQuery(api.listings.listFeaturedPublic) ?? [];
  const limit = Math.min(12, Math.max(1, Number(props.limit) || 8));
  const visible = listings.slice(0, limit);
  if (!visible.length) {
    if (!editing) return null;
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {props.eyebrow && (
          <p className="text-xs font-extrabold text-primary">{props.eyebrow}</p>
        )}
        <h2 className="mt-1 text-2xl font-black">
          {props.title || "ویترین آگهی‌های دیوساز"}
        </h2>
        <div className="mt-5 grid min-h-44 place-items-center rounded-3xl border border-dashed border-border bg-muted/20 p-6 text-center">
          <div>
            <Building2 className="mx-auto size-8 text-muted-foreground/40" />
            <strong className="mt-3 block text-sm">سکشن آگهی‌ها آماده است</strong>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              با انتشار یا ویژه‌کردن آگهی‌ها، فایل‌های واقعی دیوساز اینجا نمایش داده می‌شوند.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {props.eyebrow && <p className="text-xs font-extrabold text-primary">{props.eyebrow}</p>}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="mt-1 text-2xl font-black">{props.title || "ویترین آگهی‌های دیوساز"}</h2>
          {props.text && <p className="mt-2 text-sm text-muted-foreground">{props.text}</p>}
        </div>
        <Button asChild variant="outline" className="hidden sm:inline-flex">
          <Link to="/listings">همه آگهی‌ها <ArrowLeft className="size-4" /></Link>
        </Button>
      </div>
      <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none]">
        {visible.map((item: any) => {
          const image = item.images?.find((img: any) => img.featured) ?? item.images?.[0];
          return (
            <Link key={item.slug} to={"/listings/" + item.slug} className="w-[82vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="aspect-[16/10] bg-muted/50 p-2">
                {image?.url ? <img src={image.url} alt={image.alt || item.title} className="h-full w-full object-contain" loading="lazy" /> : <ListingPlaceholder compact />}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 text-sm font-black leading-6">{item.title}</h3>
                <p className="mt-2 text-[11px] text-muted-foreground">{item.city}{item.area != null ? " · " + formatArea(item.area) : ""}</p>
                <p className="mt-2 text-xs font-extrabold text-primary">
                  {item.rentMillion > 0 ? "اجاره " + formatPrice(item.rentMillion) : item.priceMillion > 0 ? formatPrice(item.priceMillion) : "قیمت توافقی"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ServicesBlock({ props }: { props: Record<string, any> }) {
  const items = Array.isArray(props.items) ? props.items.slice(0, 8) : [];
  return (
    <section className="border-y border-border/50 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-2xl font-black">{props.title || "خدمات دیوساز"}</h2>
        {props.text && <p className="mt-2 text-sm leading-7 text-muted-foreground">{props.text}</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any, index: number) => (
            <div key={index} className="rounded-3xl border border-border/70 bg-background p-5">
              <Factory className="size-5 text-primary" />
              <h3 className="mt-4 font-black">{item.title}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RichTextBlock({ props }: { props: Record<string, any> }) {
  const center = props.align === "center";
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className={center ? "text-center" : ""}>
        {props.eyebrow && <p className="text-xs font-extrabold text-primary">{props.eyebrow}</p>}
        <h2 className="mt-1 text-2xl font-black">{props.title}</h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-8 text-muted-foreground">{props.body}</p>
      </div>
    </section>
  );
}

function SplitBlock({ props }: { props: Record<string, any> }) {
  const imageFirst = props.imagePosition === "start";
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid items-center gap-6 rounded-3xl border border-border/70 bg-card p-5 sm:p-7 md:grid-cols-2">
        <div className={imageFirst ? "md:order-2" : ""}>
          {props.eyebrow && <p className="text-xs font-extrabold text-primary">{props.eyebrow}</p>}
          <h2 className="mt-2 text-2xl font-black">{props.title}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-8 text-muted-foreground">{props.text}</p>
          {props.buttonLabel && (
            <Button asChild className="mt-5 rounded-xl">
              <SmartLink href={props.buttonHref}>{props.buttonLabel}</SmartLink>
            </Button>
          )}
        </div>
        <div className={"flex min-h-56 items-center justify-center overflow-hidden rounded-2xl bg-muted/50 " + (imageFirst ? "md:order-1" : "")}>
          {props.imageUrl ? <img src={safeHref(props.imageUrl)} alt={props.title || ""} className="max-h-96 w-full object-contain" loading="lazy" /> : <Building2 className="size-16 text-muted-foreground/20" />}
        </div>
      </div>
    </section>
  );
}

function CtaBlock({ props }: { props: Record<string, any> }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-[2rem] border border-primary/25 bg-primary/10 p-6 text-center sm:p-10">
        <h2 className="text-2xl font-black sm:text-3xl">{props.title}</h2>
        {props.text && <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{props.text}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {props.primaryLabel && <Button asChild><SmartLink href={props.primaryHref}>{props.primaryLabel}</SmartLink></Button>}
          {props.secondaryLabel && <Button asChild variant="outline"><SmartLink href={props.secondaryHref}>{props.secondaryLabel}</SmartLink></Button>}
        </div>
      </div>
    </section>
  );
}

function ContactBlock({ props }: { props: Record<string, any> }) {
  const phone = String(props.phone || "09120858095");
  const savedAddress = String(props.address || "").trim();
  const address =
    !savedAddress || savedAddress === "شهریار، روبروی شهرک اداری تجربه"
      ? "شهریار، روبروی شهرک اداری، مجتمع تجاری اداری شهریار"
      : savedAddress;
  const mapUrl = String(props.mapUrl || "https://nshn.ir/2bveXP_xCgqA");
  const mapLocation = String(props.mapLocation || "جاده شهریار–شهدای اندیشه");
  return (
    <section className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-black">{props.title || "ارتباط با دیوساز"}</h2>
        {props.text && <p className="mt-2 text-sm leading-7 text-muted-foreground">{props.text}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="gap-2"><a href={"tel:" + phone}><PhoneCall className="size-4" />{phone}</a></Button>
          <NavigationAppChooser
            query={`${address}، ${mapLocation}`}
            neshanUrl={mapUrl}
            trigger={
              <Button type="button" variant="outline" className="gap-2">
                <Navigation className="size-4" />
                مسیریابی
              </Button>
            }
          />
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-4 text-primary" />{address}</p>
        <p className="mt-2 text-[11px] text-muted-foreground">موقعیت روی نقشه: {mapLocation}</p>
      </div>
    </section>
  );
}

function HeadingBlock({ props }: { props: Record<string, any> }) {
  const tag = ["h1", "h2", "h3"].includes(props.tag) ? props.tag : "h2";
  const Tag = tag as "h1" | "h2" | "h3";
  const align =
    props.align === "center"
      ? "text-center"
      : props.align === "end"
        ? "text-left"
        : "text-right";

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className={align}>
        {props.eyebrow && (
          <p className="mb-2 text-xs font-extrabold text-primary">{props.eyebrow}</p>
        )}
        <Tag className="font-black leading-tight">{props.title || "عنوان جدید"}</Tag>
        {props.text && (
          <p className="mt-3 whitespace-pre-line leading-8 text-muted-foreground">
            {props.text}
          </p>
        )}
      </div>
    </section>
  );
}

function ImageBlock({ props }: { props: Record<string, any> }) {
  const imageUrl = safeHref(props.imageUrl || "");
  const fit =
    props.objectFit === "cover"
      ? "object-cover"
      : props.objectFit === "fill"
        ? "object-fill"
        : "object-contain";

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {imageUrl !== "#" ? (
        <figure className="overflow-hidden rounded-2xl">
          <img
            src={imageUrl}
            alt={props.imageAlt || props.caption || "تصویر دیوساز"}
            className={"h-auto max-h-[760px] w-full bg-muted/30 " + fit}
            loading="lazy"
          />
          {props.caption && (
            <figcaption className="px-2 py-2 text-center text-xs text-muted-foreground">
              {props.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
          تصویر را از کتابخانه رسانه انتخاب کنید
        </div>
      )}
    </section>
  );
}

function ButtonBlock({ props }: { props: Record<string, any> }) {
  const align =
    props.align === "center"
      ? "justify-center"
      : props.align === "end"
        ? "justify-end"
        : "justify-start";
  const variant =
    props.variant === "outline" || props.variant === "secondary"
      ? props.variant
      : "default";

  return (
    <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      <div className={"flex " + align}>
        <Button
          asChild
          variant={variant as any}
          size={props.size === "sm" ? "sm" : props.size === "lg" ? "lg" : "default"}
          className="rounded-xl"
        >
          <SmartLink href={props.href || "#"}>{props.label || "دکمه"}</SmartLink>
        </Button>
      </div>
    </section>
  );
}

function SpacerBlock({ props }: { props: Record<string, any> }) {
  const desktop = Math.min(500, Math.max(0, Number(props.heightDesktop) || 80));
  const tablet = Math.min(500, Math.max(0, Number(props.heightTablet) || desktop));
  const mobile = Math.min(
    500,
    Math.max(0, Number(props.heightMobile) || Math.min(desktop, 56)),
  );

  return (
    <div
      aria-hidden="true"
      className="divsaz-builder-spacer"
      style={
        {
          "--spacer-d": desktop + "px",
          "--spacer-t": tablet + "px",
          "--spacer-m": mobile + "px",
        } as React.CSSProperties
      }
    >
      <style>{`
        .divsaz-builder-spacer{height:var(--spacer-m)}
        @media(min-width:640px){.divsaz-builder-spacer{height:var(--spacer-t)}}
        @media(min-width:1024px){.divsaz-builder-spacer{height:var(--spacer-d)}}
      `}</style>
    </div>
  );
}

function DividerBlock({ props }: { props: Record<string, any> }) {
  const width = Math.min(100, Math.max(10, Number(props.widthPercent) || 100));
  const thickness = Math.min(12, Math.max(1, Number(props.thickness) || 1));
  const color = String(props.color || "rgba(148,163,184,.45)");
  return (
    <div className="mx-auto px-4 py-5 sm:px-6" style={{ width: width + "%" }}>
      <div
        aria-hidden="true"
        style={{
          height: thickness,
          background: color,
          borderRadius: 999,
        }}
      />
    </div>
  );
}

function safeBuilderId(value: unknown) {
  return String(value ?? "").replace(/[^a-zA-Z0-9_-]/g, "");
}

function builderDropPayload(event: React.DragEvent<HTMLElement>) {
  return {
    widgetType: event.dataTransfer.getData("application/x-divsaz-widget"),
    blockId: event.dataTransfer.getData("application/x-divsaz-block"),
  };
}

function builderDropEffect(event: React.DragEvent<HTMLElement>) {
  const types = Array.from(event.dataTransfer.types || []);
  return types.includes("application/x-divsaz-widget") ? "copy" : "move";
}

function RootDropZone({
  index,
  editor,
}: {
  index: number;
  editor?: BuilderEditorController;
}) {
  if (!editor) return null;
  return (
    <div
      className="group relative z-30 mx-2 h-3 rounded-full transition-all hover:h-9 hover:bg-blue-500/10"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = builderDropEffect(event);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const payload = builderDropPayload(event);
        if (payload.widgetType) {
          editor.onInsertWidget?.({ kind: "root", index }, payload.widgetType);
        } else if (payload.blockId) {
          editor.onMoveBlock?.(payload.blockId, { kind: "root", index });
        }
      }}
    >
      <span className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-0.5 -translate-y-1/2 bg-blue-500 group-hover:block" />
      <span className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-2 py-0.5 text-[8px] font-black text-white group-hover:block">
        رها کن
      </span>
    </div>
  );
}

function ContainerBlock({
  block,
  editor,
  depth,
}: {
  block: PageBlock;
  editor?: BuilderEditorController;
  depth: number;
}) {
  const props = block.props || {};
  const columns = Array.isArray(props.columns) ? props.columns : [];
  const gap = Math.max(0, Math.min(80, Number(props.gap) || 0));
  const mobileStack = props.mobileStack !== false;
  const containerId = safeBuilderId(block.id);
  const selector = `[data-layout-container="${containerId}"]`;

  const columnCss = columns
    .map((column: any) => {
      const columnId = safeBuilderId(column.id);
      const widths = column.widths || {};
      const mobile = mobileStack ? 100 : Math.max(5, Math.min(100, Number(widths.mobile) || 100));
      const tablet = Math.max(5, Math.min(100, Number(widths.tablet) || Number(widths.desktop) || 50));
      const desktop = Math.max(5, Math.min(100, Number(widths.desktop) || 50));
      const target = `${selector} [data-layout-column="${columnId}"]`;
      return [
        `${target}{box-sizing:border-box;flex:0 0 calc(${mobile}% - ${gap}px);width:calc(${mobile}% - ${gap}px);align-self:${column.verticalAlign || "stretch"}}`,
        `@media(min-width:640px){${target}{flex-basis:calc(${tablet}% - ${gap}px);width:calc(${tablet}% - ${gap}px)}}`,
        `@media(min-width:1024px){${target}{flex-basis:calc(${desktop}% - ${gap}px);width:calc(${desktop}% - ${gap}px)}}`,
      ].join("");
    })
    .join("");

  const beginResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    leftColumnId: string,
    rightColumnId: string,
  ) => {
    if (!editor?.onResizeColumns) return;
    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    const host = handle.closest<HTMLElement>("[data-layout-container]");
    const width = Math.max(1, host?.getBoundingClientRect().width || 1);
    let lastX = event.clientX;

    try {
      handle.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort; window listeners below are the fallback.
    }

    const move = (pointer: PointerEvent) => {
      pointer.preventDefault();
      const dx = pointer.clientX - lastX;
      if (!dx) return;
      lastX = pointer.clientX;
      // RTL: moving the handle to the right shrinks the logical first column.
      const delta = (-dx / width) * 100;
      editor.onResizeColumns?.(
        block.id,
        leftColumnId,
        rightColumnId,
        delta,
      );
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      try {
        if (handle.hasPointerCapture(event.pointerId)) {
          handle.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore browsers without pointer capture support.
      }
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  };

  return (
    <section className="mx-auto w-full px-3 py-3 sm:px-4">
      <style>{columnCss}</style>
      <div
        data-layout-container={containerId}
        className={
          "relative mx-auto flex w-full flex-wrap items-stretch " +
          (editor ? "min-h-24 rounded-2xl border border-dashed border-blue-300/70 bg-blue-500/[0.025] p-2" : "")
        }
        style={{ gap }}
      >
        {columns.map((column: any, columnIndex: number) => {
          const widgets = Array.isArray(column.widgets)
            ? [...column.widgets].sort((a: PageBlock, b: PageBlock) => a.order - b.order)
            : [];
          return (
            <Fragment key={column.id}>
              <div
                data-layout-column={safeBuilderId(column.id)}
                className={
                  "relative min-w-0 " +
                  (editor
                    ? "rounded-xl border border-dashed border-slate-300/80 bg-background/80 p-1.5"
                    : "")
                }
                onDragOver={
                  editor
                    ? (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        event.dataTransfer.dropEffect = builderDropEffect(event);
                      }
                    : undefined
                }
                onDrop={
                  editor
                    ? (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const payload = builderDropPayload(event);
                        const target = {
                          kind: "column" as const,
                          containerId: block.id,
                          columnId: column.id,
                        };
                        if (payload.widgetType) {
                          editor.onInsertWidget?.(target, payload.widgetType);
                        } else if (payload.blockId && payload.blockId !== block.id) {
                          editor.onMoveBlock?.(payload.blockId, target);
                        }
                      }
                    : undefined
                }
              >
                {editor && (
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className="text-[8px] font-black text-blue-600">
                      ستون {columnIndex + 1}
                    </span>
                    <span className="text-[8px] text-muted-foreground">
                      {Math.round(Number(column.widths?.[editor.device || "desktop"]) || 0)}%
                    </span>
                  </div>
                )}

                {widgets.length === 0 && editor ? (
                  <div className="pointer-events-none flex min-h-20 items-center justify-center rounded-lg border border-dashed border-border/70 text-[9px] font-bold text-muted-foreground">
                    ویجت را اینجا رها کن
                  </div>
                ) : (
                  widgets.map((widget: PageBlock) => (
                    <EditableBlockFrame
                      key={widget.id}
                      block={widget}
                      editor={editor}
                      depth={depth + 1}
                    />
                  ))
                )}
              </div>

              {editor && columnIndex < columns.length - 1 && (
                <button
                  type="button"
                  draggable={false}
                  className="relative z-50 -mx-2 w-5 cursor-col-resize touch-none self-stretch select-none rounded-full bg-transparent after:absolute after:inset-y-2 after:left-1/2 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-blue-500/45 hover:after:bg-blue-600"
                  aria-label="تغییر عرض ستون"
                  title="برای تغییر عرض ستون بکشید"
                  onDragStart={(event) => event.preventDefault()}
                  onPointerDown={(event) =>
                    beginResize(
                      event,
                      column.id,
                      columns[columnIndex + 1].id,
                    )
                  }
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}

function BlockRenderer({
  block,
  editor,
  depth = 0,
}: {
  block: PageBlock;
  editor?: BuilderEditorController;
  depth?: number;
}) {
  if (!block.enabled) return null;

  let content: React.ReactNode = null;
  if (block.type === "container") {
    content = <ContainerBlock block={block} editor={editor} depth={depth} />;
  }
  if (block.type === "hero") content = <HeroBlock props={block.props} />;
  if (block.type === "intentHub") content = <IntentHubBlock props={block.props} />;
  if (block.type === "listings") {
    content = <ListingsBlock props={block.props} editing={Boolean(editor)} />;
  }
  if (block.type === "services") content = <ServicesBlock props={block.props} />;
  if (block.type === "split") content = <SplitBlock props={block.props} />;
  if (block.type === "richText") content = <RichTextBlock props={block.props} />;
  if (block.type === "cta") content = <CtaBlock props={block.props} />;
  if (block.type === "contact") content = <ContactBlock props={block.props} />;
  if (block.type === "heading") content = <HeadingBlock props={block.props} />;
  if (block.type === "image") content = <ImageBlock props={block.props} />;
  if (block.type === "button") content = <ButtonBlock props={block.props} />;
  if (block.type === "spacer") content = <SpacerBlock props={block.props} />;
  if (block.type === "divider") content = <DividerBlock props={block.props} />;
  if (block.type === "customHtml") {
    content = (
      <CustomHtmlContent
        blockId={block.id}
        html={block.props?.html || ""}
        css={block.props?.css || ""}
      />
    );
  }
  if (!content) return null;

  return (
    <BuilderBlockShell blockId={block.id} design={block.props?.design}>
      {content}
    </BuilderBlockShell>
  );
}

function EditableBlockFrame({
  block,
  editor,
  depth = 0,
}: {
  block: PageBlock;
  editor?: BuilderEditorController;
  depth?: number;
}) {
  if (!editor) {
    return <BlockRenderer block={block} depth={depth} />;
  }

  const selected = editor.selectedBlockId === block.id;
  return (
    <div
      className={
        "group relative cursor-pointer transition-[outline,box-shadow] " +
        (selected
          ? "z-20 outline outline-2 outline-offset-[-2px] outline-blue-500"
          : "hover:outline hover:outline-1 hover:outline-offset-[-1px] hover:outline-blue-300")
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        editor.onSelectBlock?.(block.id);
      }}
    >
      <div
        role="button"
        tabIndex={0}
        draggable
        aria-label="جابه‌جایی بلوک"
        title="برای جابه‌جایی این بلوک بکشید"
        className={
          "absolute start-2 top-2 z-[80] flex cursor-grab select-none items-center gap-1 rounded-lg px-2 py-1 text-[8px] font-black text-white shadow active:cursor-grabbing " +
          (selected
            ? "bg-blue-600"
            : "bg-slate-700/85 opacity-70 group-hover:opacity-100")
        }
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          editor.onSelectBlock?.(block.id);
        }}
        onDragStart={(event) => {
          event.stopPropagation();
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("application/x-divsaz-block", block.id);
          event.dataTransfer.setData("text/plain", block.id);
        }}
      >
        <span aria-hidden="true">⋮⋮</span>
        <span>{selected ? (block.type === "container" ? "کانتینر" : "انتخاب‌شده") : "جابجایی"}</span>
      </div>
      <BlockRenderer block={block} editor={editor} depth={depth} />
    </div>
  );
}

export default function SitePageRenderer({
  page,
  hideHeader = false,
  editor,
}: {
  page: SitePage;
  hideHeader?: boolean;
  editor?: BuilderEditorController;
}) {
  useSeo({
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.title,
    keywords: page.seoKeywords || [],
    canonical: page.canonicalUrl || undefined,
    image: page.ogImage || undefined,
    ogTitle: page.ogTitle || page.seoTitle || page.title,
    ogDescription: page.ogDescription || page.seoDescription || page.title,
    type: "website",
    noIndex: page.noIndex,
  } as any);

  const blocks = [...(page.blocks || [])].sort((a, b) => a.order - b.order);
  const heroIndex = blocks.findIndex(
    (block) => block.enabled && block.type === "hero",
  );

  const pageSettings = page.settings || {};
  const customFontUrl = safeHref(pageSettings.customFontUrl || "");
  const hasCustomFont = Boolean(customFontUrl && customFontUrl !== "#");
  const customFontFamily =
    String(pageSettings.customFontFamily || "").trim() || "DivosazCustom";
  const pageStyle = {
    backgroundColor: pageSettings.backgroundColor || undefined,
    color: pageSettings.textColor || undefined,
    fontFamily: hasCustomFont
      ? `"${customFontFamily}", "Vazirmatn", ui-sans-serif, system-ui, sans-serif`
      : '"Vazirmatn", ui-sans-serif, system-ui, sans-serif',
    fontSize: pageSettings.baseFontSize
      ? Math.min(24, Math.max(11, Number(pageSettings.baseFontSize))) + "px"
      : undefined,
  } as React.CSSProperties;

  return (
    <main
      dir="rtl"
      style={pageStyle}
      className="responsive-page min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-background text-foreground"
    >
      {hasCustomFont && (
        <style>{`@font-face{font-family:"${customFontFamily.replace(/["{}]/g, "")}";src:url("${customFontUrl}");font-display:swap;}`}</style>
      )}
      {!hideHeader && pageSettings.showHeader !== false && <PublicHeader />}
      {!hideHeader && pageSettings.showStories !== false && <PublicStoryStrip />}
      {page.isHomepage &&
        pageSettings.showBrandStory !== false &&
        heroIndex < 0 && <BrandStorySection />}
      <RootDropZone index={0} editor={editor} />
      {blocks.map((block, index) => (
        <Fragment key={block.id}>
          <EditableBlockFrame block={block} editor={editor} depth={0} />
          {page.isHomepage &&
            pageSettings.showBrandStory !== false &&
            index === heroIndex && <BrandStorySection />}
          <RootDropZone index={index + 1} editor={editor} />
        </Fragment>
      ))}
    </main>
  );
}
