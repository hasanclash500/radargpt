import MekaBrand from "@/components/MekaBrand";
import PublicStoryStrip from "@/components/stories/PublicStoryStrip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import {
  ArrowLeft,
  Building2,
  Factory,
  Globe2,
  Handshake,
  MapPin,
  Network,
  PhoneCall,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "react-router";

const PHONE = "09120858095";

export default function About() {
  useSeo({
    title: "درباره مکا | مرجع املاک صنعتی و اداری",
    description:
      "معرفی مکا، چشم‌انداز توسعه مرجع تخصصی املاک صنعتی و اداری و شرایط همکاری و اخذ نمایندگی مکا در شهرهای ایران.",
    type: "website",
  });

  return (
    <main dir="rtl" className="min-h-screen bg-muted/20">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <MekaBrand compact />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">صفحه اصلی</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <PublicStoryStrip />

      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-30" />
        <div className="pointer-events-none absolute end-[-80px] top-0 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">
            <Sparkles className="size-3.5" />
            درباره برند مکا
          </span>
          <h1 className="mt-5 text-4xl font-black sm:text-5xl">درباره مکا</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-muted-foreground sm:text-base">
            مکا یک پلتفرم و شبکه تخصصی برای املاک صنعتی و اداری است؛ با تمرکز
            بر پیدا کردن مکان مناسب کسب‌وکار، فایل‌های واقعی و ارتباط حرفه‌ای
            میان متقاضی، مالک و مشاور.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6 sm:py-12">
        <section className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <article className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-primary" />
              <h2 className="text-2xl font-black">مکا یعنی چه؟</h2>
            </div>
            <p className="mt-4 text-sm leading-8 text-muted-foreground">
              «مکا» نام و هویت برند ماست و در هویت برند، یادآور «مکان
              کسب‌وکار» است؛ جایی که سوله، کارخانه، کارگاه، انبار، زمین صنعتی
              و دفتر اداری مناسب باید با نیاز واقعی یک کسب‌وکار هماهنگ شود.
              مکا تلاش می‌کند این انتخاب را از یک جستجوی پراکنده به یک فرایند
              تخصصی و داده‌محور تبدیل کند.
            </p>
          </article>

          <article className="rounded-[2rem] border border-primary/20 bg-primary/[0.045] p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2">
              <Globe2 className="size-5 text-primary" />
              <h2 className="text-2xl font-black">چشم‌انداز مکا</h2>
            </div>
            <p className="mt-4 text-sm leading-8 text-muted-foreground">
              چشم‌انداز مکا تبدیل‌شدن به بزرگ‌ترین مرجع تخصصی املاک صنعتی و
              اداری ایران است. فعالیت عملیاتی فعلی ما بر غرب تهران و محدوده
              شهریار متمرکز است و برنامه توسعه مکا، راه‌اندازی شعب و
              نمایندگی‌های فعال در شهرهای مختلف ایران است.
            </p>
          </article>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-primary" />
            <h2 className="text-xl font-black">حوزه فعالیت فعلی</h2>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["غرب تهران", MapPin],
              ["شهریار", Building2],
              ["املاک صنعتی", Factory],
              ["املاک اداری", Building2],
              ["مشاوره تخصصی", Handshake],
            ].map(([label, Icon]: any) => (
              <div
                key={label}
                className="rounded-2xl border border-border/70 bg-background p-4 text-center"
              >
                <Icon className="mx-auto size-5 text-primary" />
                <p className="mt-2 text-xs font-black">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-amber-500/5 shadow-sm">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_300px] lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Network className="size-6 text-primary" />
                <h2 className="text-2xl font-black">
                  پذیرش نمایندگی مکا در شهرهای ایران
                </h2>
              </div>
              <p className="mt-4 text-sm leading-8 text-muted-foreground">
                اگر در شهر خود در حوزه املاک صنعتی، سوله، کارخانه، کارگاه،
                انبار، زمین صنعتی یا فضاهای اداری فعال هستید، می‌توانید برای
                همکاری و دریافت نمایندگی مکا اقدام کنید. هدف ما ایجاد شبکه‌ای
                قدرتمند، متخصص و قابل اعتماد از مشاوران و نمایندگان محلی در
                سراسر ایران است.
              </p>
              <p className="mt-3 text-sm leading-8 text-muted-foreground">
                نمایندگی مکا صرفاً استفاده از یک نام تجاری نیست؛ هدف، ساخت یک
                شبکه حرفه‌ای با استاندارد مشترک در ثبت فایل، پاسخ‌گویی،
                بازاریابی، فناوری و تجربه مشتری است. برای توسعه بازار محلی،
                راه‌اندازی شعبه یا همکاری به‌عنوان نماینده شهر خود، اطلاعات
                اولیه را از طریق تماس با تیم مکا ثبت کنید تا فرایند بررسی آغاز
                شود.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild size="lg" className="gap-2 rounded-2xl">
                  <a href={"tel:" + PHONE}>
                    <PhoneCall className="size-4" />
                    درخواست نمایندگی
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl">
                  <Link to="/request">
                    ارتباط و ثبت درخواست
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
              {[
                ["تمرکز تخصصی", "صنعتی و اداری"],
                ["توسعه سراسری", "شهرهای ایران"],
                ["شبکه نمایندگان", "همکاری محلی"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border/70 bg-background/80 p-4 text-center"
                >
                  <p className="text-xs font-black">{title}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
