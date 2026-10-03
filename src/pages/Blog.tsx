import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { useQuery } from "convex/react";
import { ArrowLeft, Building2, CalendarDays, Clock3, FileText, PhoneCall } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";

function readingMinutes(content = "") {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function faDate(timestamp?: number) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(timestamp);
}

export default function Blog() {
  const posts = useQuery(api.posts.listPublished);

  useSeo({
    title: "وبلاگ مکا | راهنمای املاک صنعتی و اداری شهریار",
    description:
      "مقالات تخصصی مکا درباره اجاره، خرید و بررسی املاک صنعتی و اداری در شهریار؛ راهنمای سوله، کارخانه، کارگاه و دفتر اداری.",
    keywords: ["املاک صنعتی شهریار", "املاک اداری شهریار", "اجاره سوله", "اجاره دفتر"],
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "وبلاگ مکا",
      description: "راهنمای تخصصی املاک صنعتی و اداری شهریار",
      publisher: {
        "@type": "Organization",
        name: "مکا",
        telephone: "09120858095",
      },
    },
  });

  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <span>
              <strong className="block text-base leading-none">مکا</strong>
              <span className="mt-1 block text-[10px] text-muted-foreground">وبلاگ املاک کسب‌وکار</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" className="gap-1.5 rounded-xl">
              <a href="tel:09120858095">
                <PhoneCall className="size-4" />
                <span className="hidden sm:inline">تماس</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/50">
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-50" />
        <div className="pointer-events-none absolute inset-0 glow-emerald" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              <FileText className="size-4" />
              مجله تخصصی مکا
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              راهنمای تصمیم بهتر در
              <span className="text-gradient-brand"> املاک صنعتی و اداری</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
              نکات کاربردی برای اجاره، خرید و ارزیابی سوله، کارخانه، کارگاه و دفتر اداری در شهریار و محدوده‌های اطراف.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {posts === undefined ? (
          <div className="py-20 text-center text-sm text-muted-foreground">در حال بارگذاری مقاله‌ها…</div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <FileText className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-4 font-extrabold">هنوز مقاله‌ای منتشر نشده است</h2>
            <p className="mt-2 text-sm text-muted-foreground">مقاله‌های جدید مکا به‌زودی در این بخش قرار می‌گیرند.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {posts.map((post, index) => (
              <motion.article
                key={post._id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 2) * 0.08 }}
                className="group overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/70"
              >
                {post.featuredImage ? (
                  <div className="aspect-[16/8] overflow-hidden bg-muted">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-[16/7] overflow-hidden bg-gradient-to-br from-primary/15 via-card to-gold/10">
                    <div className="absolute inset-0 grid-overlay opacity-40" />
                    <Building2 className="absolute bottom-5 end-5 size-12 text-primary/25" />
                  </div>
                )}

                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {post.category && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 font-bold text-primary">
                        {post.category}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {faDate(post.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3.5" />
                      {readingMinutes(post.content)} دقیقه
                    </span>
                  </div>

                  <h2 className="mt-4 text-xl font-extrabold leading-8 tracking-tight">
                    <Link to={`/blog/${post.slug}`} className="transition-colors group-hover:text-primary">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                    {post.excerpt || post.metaDescription || "برای مطالعه کامل مقاله وارد صفحه شوید."}
                  </p>

                  <Link
                    to={`/blog/${post.slug}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-primary"
                  >
                    مطالعه مقاله
                    <ArrowLeft className="size-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>مکا · املاک صنعتی و اداری شهریار</span>
          <Link to="/" className="font-bold text-foreground">بازگشت به صفحه اصلی</Link>
        </div>
      </footer>
    </main>
  );
}
