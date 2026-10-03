import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Factory,
  MapPin,
  Navigation,
  PhoneCall,
  Route,
  ShieldCheck,
  Sparkles,
  Warehouse,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

const PHONE = "09120858095";
const ADDRESS = "شهریار، روبروی شهرک اداری تجربه";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
  transition: { duration: 0.55, ease: "easeOut" },
} as const;

const services = [
  {
    icon: Factory,
    title: "املاک صنعتی",
    text: "کارخانه، سوله، کارگاه، زمین صنعتی و ملک مناسب تولید و انبار.",
  },
  {
    icon: Building2,
    title: "املاک اداری",
    text: "دفتر کار، ساختمان اداری، فضای شرکتی و موقعیت‌های مناسب کسب‌وکار.",
  },
  {
    icon: Warehouse,
    title: "فایل‌های شهریار",
    text: "تمرکز محلی روی شهریار و محدوده‌های صنعتی و اداری اطراف.",
  },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative flex ${compact ? "size-9" : "size-11"} items-center justify-center overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 text-primary`}
      >
        <div className="absolute inset-1 rounded-xl border border-primary/15" />
        <Building2 className={compact ? "size-5" : "size-6"} />
      </div>
      <div className="leading-none">
        <p className={`${compact ? "text-base" : "text-xl"} font-extrabold tracking-tight`}>
          کارجا
        </p>
        <p className="mt-1 text-[10px] font-medium text-muted-foreground">
          املاک صنعتی و اداری
        </p>
      </div>
    </div>
  );
}

function IsometricScene() {
  const buildings = [
    { x: "12%", y: "28%", w: 82, h: 112, z: 54, label: "اداری" },
    { x: "43%", y: "15%", w: 96, h: 150, z: 72, label: "صنعتی" },
    { x: "61%", y: "48%", w: 118, h: 80, z: 40, label: "سوله" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 22 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
      className="relative mx-auto h-[340px] w-full max-w-[420px] sm:h-[420px]"
      style={{ perspective: "1000px" }}
      aria-hidden="true"
    >
      <div className="absolute inset-4 rounded-[2.5rem] bg-primary/10 blur-3xl" />
      <div className="absolute -end-8 top-6 size-36 rounded-full bg-gold/10 blur-3xl" />

      <motion.div
        animate={{ y: [0, -8, 0], rotateZ: [-0.4, 0.4, -0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-x-7 bottom-12 top-16"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(58deg) rotateZ(-37deg)",
        }}
      >
        <div
          className="absolute inset-0 rounded-[2.2rem] border border-primary/25 bg-gradient-to-br from-card via-card/95 to-primary/15"
          style={{
            boxShadow:
              "28px 34px 70px color-mix(in oklab, var(--primary) 18%, transparent)",
          }}
        >
          <div className="absolute inset-0 rounded-[2.2rem] opacity-60 grid-overlay" />
          <div className="absolute inset-5 rounded-[1.8rem] border border-dashed border-primary/25" />
          <div className="absolute start-[13%] top-[65%] h-1.5 w-[69%] rounded-full bg-primary/20" />
          <div className="absolute start-[26%] top-[18%] h-[66%] w-1.5 rounded-full bg-gold/15" />

          {buildings.map((b, index) => (
            <motion.div
              key={b.label}
              className="absolute"
              style={{
                left: b.x,
                top: b.y,
                width: b.w,
                height: b.h,
                transformStyle: "preserve-3d",
                transform: `translateZ(${b.z}px)`,
              }}
              animate={{ translateZ: [b.z, b.z + 7, b.z] }}
              transition={{
                duration: 4.5 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.35,
              }}
            >
              <div className="absolute inset-0 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/25 via-card to-card" />
              <div
                className="absolute end-[-18px] top-[9px] h-[calc(100%-9px)] w-[18px] rounded-e-lg bg-primary/20"
                style={{ transform: "skewY(-28deg)", transformOrigin: "left top" }}
              />
              <div
                className="absolute -top-[12px] start-[7px] h-[12px] w-[calc(100%-7px)] rounded-t-lg bg-gradient-to-r from-gold/30 to-primary/25"
                style={{ transform: "skewX(-55deg)", transformOrigin: "left bottom" }}
              />
              <div className="absolute inset-x-3 top-4 grid grid-cols-3 gap-2 opacity-75">
                {Array.from({ length: Math.min(9, index === 1 ? 9 : 6) }).map((_, i) => (
                  <span
                    key={i}
                    className="h-2.5 rounded-[3px] border border-primary/20 bg-primary/15"
                  />
                ))}
              </div>
            </motion.div>
          ))}

          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0.35, 0.9] }}
            transition={{ duration: 2.8, repeat: Infinity }}
            className="absolute end-[14%] top-[14%] size-5 rounded-full border-2 border-gold/60 bg-gold/15"
            style={{ transform: "translateZ(90px)" }}
          />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="glass absolute end-0 top-5 rounded-2xl border border-border/70 px-3.5 py-2.5"
      >
        <p className="text-[10px] text-muted-foreground">تمرکز منطقه‌ای</p>
        <p className="mt-0.5 text-xs font-extrabold">شهریار و حومه</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        className="glass absolute bottom-3 start-0 rounded-2xl border border-border/70 px-3.5 py-2.5"
      >
        <p className="flex items-center gap-1.5 text-xs font-extrabold">
          <BadgeCheck className="size-4 text-primary" />
          فایل‌های تخصصی کسب‌وکار
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main dir="rtl" className="relative min-h-screen overflow-x-clip bg-background pb-24 md:pb-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px]">
        <div className="absolute inset-0 grid-overlay opacity-50" />
        <div className="absolute inset-0 glow-emerald opacity-80" />
        <div className="absolute end-[-90px] top-20 size-72 rounded-full bg-gold/8 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
      </div>

      <header className="glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" aria-label="کارجا - صفحه اصلی">
            <BrandMark compact />
          </a>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => navigate("/auth?returnTo=/dashboard")}
              className="hidden rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              ورود مشاوران
            </button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-20 sm:pt-14">
        <div className="grid items-center gap-7 lg:grid-cols-[1.02fr_.98fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary">
              <Sparkles className="size-3.5" />
              مشاور تخصصی املاک کسب‌وکار در شهریار
            </div>

            <h1 className="mt-5 max-w-2xl text-[2.35rem] font-extrabold leading-[1.28] tracking-tight sm:text-5xl lg:text-[3.45rem]">
              فضای مناسبِ
              <span className="text-gradient-brand"> کار شما</span>
              <br />
              از سوله تا دفتر اداری
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">
              کارجا برای خرید، فروش، رهن و اجاره املاک صنعتی و اداری در شهریار؛
              با تمرکز روی موقعیت‌های واقعی کسب‌وکار و ارتباط مستقیم.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <Button size="lg" className="h-12 gap-2 rounded-2xl px-5 font-extrabold" asChild>
                <a href={`tel:${PHONE}`}>
                  <PhoneCall className="size-4" />
                  تماس مستقیم
                </a>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-2xl bg-card/60 px-5 font-extrabold"
                asChild
              >
                <a href={MAPS_URL} target="_blank" rel="noreferrer">
                  <Navigation className="size-4" />
                  مسیریابی
                </a>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" />
                مشاوره تخصصی
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-4 text-primary" />
                پاسخ‌گویی مستقیم
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                شهریار
              </span>
            </div>
          </motion.div>

          <IsometricScene />
        </div>
      </section>

      <section id="services" className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <motion.div {...fadeUp} className="mb-7">
          <span className="text-xs font-extrabold text-primary">حوزه تخصصی کارجا</span>
          <div className="mt-2 flex items-end justify-between gap-5">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                ملک برای کسب‌وکار، نه فقط یک آدرس
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                نیازهای صنعتی و اداری متفاوت‌اند؛ کارجا فایل‌ها را با نگاه کاربردی به
                دسترسی، موقعیت و نوع فعالیت بررسی می‌کند.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service, index) => (
            <motion.article
              key={service.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: index * 0.08 }}
              className="group rounded-[1.7rem] border border-border/70 bg-card/70 p-5 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                <service.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-extrabold">{service.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{service.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/14 via-card to-gold/10 p-5 sm:p-8"
        >
          <div className="pointer-events-none absolute inset-0 grid-overlay opacity-30" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary">
                <Route className="size-4" />
                مراجعه حضوری
              </span>
              <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
                کارجا در شهریار
              </h2>
              <p className="mt-3 flex items-start gap-2 text-sm leading-7 text-muted-foreground">
                <MapPin className="mt-1 size-4 shrink-0 text-primary" />
                {ADDRESS}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-bold">
                <PhoneCall className="size-4 text-primary" />
                <span dir="ltr">{PHONE}</span>
              </p>
            </div>

            <Button
              size="lg"
              className="h-12 w-full gap-2 rounded-2xl font-extrabold lg:w-auto"
              asChild
            >
              <a href={MAPS_URL} target="_blank" rel="noreferrer">
                باز کردن مسیریاب
                <ArrowLeft className="size-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24">
        <motion.div
          {...fadeUp}
          className="rounded-[2rem] border border-border/70 bg-card/70 p-6 text-center sm:p-10"
        >
          <BriefcaseBusiness className="mx-auto size-9 text-primary" />
          <h2 className="mt-4 text-2xl font-extrabold">دنبال فضای مناسب کسب‌وکارت هستی؟</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
            تماس بگیر تا بر اساس نوع فعالیت، متراژ و بودجه، فایل‌های صنعتی یا اداری
            مناسب را سریع‌تر بررسی کنیم.
          </p>
          <Button size="lg" className="mt-6 h-12 gap-2 rounded-2xl px-6 font-extrabold" asChild>
            <a href={`tel:${PHONE}`}>
              <PhoneCall className="size-4" />
              تماس با {PHONE}
            </a>
          </Button>
        </motion.div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <BrandMark compact />
          <p>کارجا · املاک صنعتی و اداری شهریار</p>
        </div>
      </footer>

      <div
        className="glass fixed inset-x-0 bottom-0 z-50 border-t border-border/70 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden"
        aria-label="دسترسی سریع"
      >
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <a
            href={`tel:${PHONE}`}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-extrabold text-primary-foreground"
          >
            <PhoneCall className="size-4" />
            تماس
          </a>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-extrabold"
          >
            <Navigation className="size-4 text-primary" />
            مسیریابی
          </a>
        </div>
      </div>
    </main>
  );
}
