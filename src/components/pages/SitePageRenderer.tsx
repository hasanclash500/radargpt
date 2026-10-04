import { ThemeToggle } from "@/components/ThemeToggle";
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
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { formatArea, formatPrice } from "@/lib/format";
import { neshanSearchUrl } from "@/lib/neshan";
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
import { Link } from "react-router";

type PageBlock = {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  props: Record<string, any>;
};

type SitePage = {
  title: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  noIndex?: boolean;
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

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex size-10 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
        <Building2 className="size-5" />
      </span>
      <span>
        <strong className="block text-sm font-black">مکا</strong>
        <span className="block text-[9px] font-bold tracking-[0.18em] text-primary/70" dir="ltr">MEKA</span>
      </span>
    </Link>
  );
}

function PublicHeader() {
  return (
    <header className="glass relative z-40 border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Brand />
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
                <SheetTitle><Brand /></SheetTitle>
                <SheetDescription className="pt-2 text-right">دسترسی سریع به خدمات مکا</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-1 overflow-y-auto p-3">
                {[
                  ["/listings", Search, "آگهی‌ها و جستجوی ملک"],
                  ["/assistant", Bot, "دستیار هوشمند مکا"],
                  ["/submit-listing", Building2, "ثبت آگهی ملک"],
                  ["/request", ClipboardList, "ثبت تقاضای ملک"],
                  ["/blog", Newspaper, "وبلاگ و راهنما"],
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
  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_38%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl">
          {props.eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">
              <Sparkles className="size-3.5" />{props.eyebrow}
            </span>
          )}
          <h1 className="mt-5 text-4xl font-black leading-[1.25] sm:text-6xl">
            {props.title || "مکا"}
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

function ListingsBlock({ props }: { props: Record<string, any> }) {
  const listings = useQuery(api.listings.listFeaturedPublic) ?? [];
  const limit = Math.min(12, Math.max(1, Number(props.limit) || 8));
  const visible = listings.slice(0, limit);
  if (!visible.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {props.eyebrow && <p className="text-xs font-extrabold text-primary">{props.eyebrow}</p>}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="mt-1 text-2xl font-black">{props.title || "ویترین آگهی‌های مکا"}</h2>
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
                {image?.url ? <img src={image.url} alt={image.alt || item.title} className="h-full w-full object-contain" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Building2 className="size-10 text-muted-foreground/30" /></div>}
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
        <h2 className="text-2xl font-black">{props.title || "خدمات مکا"}</h2>
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
  const address = String(props.address || "شهریار");
  return (
    <section className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-black">{props.title || "ارتباط با مکا"}</h2>
        {props.text && <p className="mt-2 text-sm leading-7 text-muted-foreground">{props.text}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="gap-2"><a href={"tel:" + phone}><PhoneCall className="size-4" />{phone}</a></Button>
          <Button asChild variant="outline" className="gap-2"><a href={neshanSearchUrl(address)} target="_blank" rel="noreferrer"><Navigation className="size-4" />مسیریابی با نشان</a></Button>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-4 text-primary" />{address}</p>
      </div>
    </section>
  );
}

function BlockRenderer({ block }: { block: PageBlock }) {
  if (!block.enabled) return null;
  if (block.type === "hero") return <HeroBlock props={block.props} />;
  if (block.type === "intentHub") return <IntentHubBlock props={block.props} />;
  if (block.type === "listings") return <ListingsBlock props={block.props} />;
  if (block.type === "services") return <ServicesBlock props={block.props} />;
  if (block.type === "split") return <SplitBlock props={block.props} />;
  if (block.type === "richText") return <RichTextBlock props={block.props} />;
  if (block.type === "cta") return <CtaBlock props={block.props} />;
  if (block.type === "contact") return <ContactBlock props={block.props} />;
  return null;
}

export default function SitePageRenderer({
  page,
  hideHeader = false,
}: {
  page: SitePage;
  hideHeader?: boolean;
}) {
  useSeo({
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.title,
    type: "website",
    noIndex: page.noIndex,
  } as any);

  const blocks = [...(page.blocks || [])].sort((a, b) => a.order - b.order);

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      {!hideHeader && <PublicHeader />}
      {blocks.map((block) => <BlockRenderer key={block.id} block={block} />)}
    </main>
  );
}
