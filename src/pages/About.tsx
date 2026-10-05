import MekaBrand from "@/components/MekaBrand";
import PublicStoryStrip from "@/components/stories/PublicStoryStrip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import {
  ArrowLeft,
  Building2,
  Factory,
  Handshake,
  Hammer,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Link } from "react-router";

const PHONE = "09120858095";

export default function About() {
  useSeo({
    title: "درباره دیوساز | مرجع املاک صنعتی و اداری",
    description:
      "دیوساز؛ قدرت ساختن، هنر انتخاب. معرفی روایت برند دیوساز و خدمات تخصصی املاک صنعتی، اداری و تجاری.",
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
            روایت برند دیوساز
          </span>
          <h1 className="mt-5 text-4xl font-black sm:text-5xl">
            دیوساز؛ قدرت ساختن، هنر انتخاب
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-muted-foreground sm:text-base">
            نام «دیوساز» برای ما فقط یک نام تجاری نیست؛ روایتی از قدرت، مهارت،
            ساختن و آفرینش است که آن را با نگاه امروز به بازار املاک و فضای
            کسب‌وکار پیوند داده‌ایم.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <Hammer className="size-5 text-primary" />
            <h2 className="text-2xl font-black">چرا «دیوساز»؟</h2>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-8 text-muted-foreground">
            <p>
              «دیوساز» از دو واژه «دیو» و «ساز» شکل گرفته است. در روایت‌های
              اسطوره‌ای و ادبی ایران، دیوان گاه با نیرو، فن، مهارت و توان
              ساختن تصویر می‌شوند؛ همان نیروهایی که در روایت‌های شاهنامه با
              ساخت بناها و کار با سنگ و گچ پیوند خورده‌اند.
            </p>
            <blockquote className="rounded-2xl border-e-4 border-primary bg-primary/[0.045] px-5 py-4 text-base font-black text-foreground">
              «به سنگ و به گچ، دیو دیوار کرد»
            </blockquote>
            <p>
              «ساز» نیز از ساختن و آفرینش می‌آید. برای ما، دیوساز یعنی
              ترکیب قدرت، تخصص و توان ساختن؛ نامی که با ماهیت املاک صنعتی،
              اداری و تجاری و با آینده‌ای که هر کسب‌وکار در یک فضای مناسب
              می‌سازد، هماهنگ است.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "قدرت و استحکام",
              text: "انتخاب ملکی مطمئن بر پایه اطلاعات، تجربه و شناخت واقعی بازار.",
              icon: ShieldCheck,
            },
            {
              title: "تخصص و مهارت",
              text: "تمرکز بر املاک صنعتی، اداری و تجاری و نیازهای واقعی کسب‌وکارها.",
              icon: Wrench,
            },
            {
              title: "آفرینش و خلاقیت",
              text: "ما فقط فایل معرفی نمی‌کنیم؛ برای پیدا کردن فضای مناسب رشد کسب‌وکار راه‌حل می‌سازیم.",
              icon: Sparkles,
            },
          ].map(({ title, text, icon: Icon }) => (
            <article key={title} className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-black">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-amber-500/5 p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <Building2 className="size-6 text-primary" />
            <h2 className="text-2xl font-black">دیوساز در کسب‌وکار ما</h2>
          </div>
          <p className="mt-4 max-w-4xl text-sm leading-8 text-muted-foreground">
            هر ملک فقط یک ساختمان نیست؛ فضایی است برای تولید، مدیریت، فروش،
            توسعه و ساختن آینده. از سوله و کارخانه تا کارگاه، انبار، زمین
            صنعتی و دفتر اداری، هدف ما این است که مالک، متقاضی و مشاور با
            اطلاعات دقیق‌تر و فرایندی حرفه‌ای‌تر به یکدیگر برسند.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["غرب تهران", MapPin],
              ["شهریار", Building2],
              ["املاک صنعتی", Factory],
              ["املاک اداری", Building2],
              ["مشاوره تخصصی", Handshake],
            ].map(([label, Icon]: any) => (
              <div key={label} className="rounded-2xl border border-border/70 bg-background/80 p-4 text-center">
                <Icon className="mx-auto size-5 text-primary" />
                <p className="mt-2 text-xs font-black">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">تعهد ما</h2>
          <p className="mt-4 max-w-4xl text-sm leading-8 text-muted-foreground">
            در دیوساز، هر معامله یک تصمیم مهم برای آینده یک فرد یا کسب‌وکار
            است. تلاش می‌کنیم با تکیه بر تخصص، فناوری، فایل‌های واقعی و
            ارتباط حرفه‌ای، مسیر خرید، فروش، رهن و اجاره را دقیق‌تر و شفاف‌تر
            کنیم.
          </p>
          <p className="mt-5 text-lg font-black text-primary">
            دیوساز؛ جایی که اسطوره با کسب‌وکار شما گره می‌خورد.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="lg" className="gap-2 rounded-2xl">
              <a href={"tel:" + PHONE}>
                <PhoneCall className="size-4" />
                تماس با دیوساز
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl">
              <Link to="/request">
                ثبت درخواست ملک
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
