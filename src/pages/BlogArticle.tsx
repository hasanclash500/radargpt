import { ArticleContent } from "@/components/blog/ArticleContent";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  PhoneCall,
  Share2,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

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

export default function BlogArticle() {
  const { slug = "" } = useParams();
  const post = useQuery(api.posts.getPublishedBySlug, { slug });
  const allPosts = useQuery(api.posts.listPublished);

  const title = post?.metaTitle || post?.title || "مقاله | دیوساز";
  const description = post?.metaDescription || post?.excerpt || "";
  const image = post?.ogImage || post?.featuredImage;
  const canonical =
    post?.canonicalUrl ||
    (typeof window !== "undefined" ? `${window.location.origin}/blog/${slug}` : undefined);

  useSeo({
    title,
    description,
    keywords: post?.keywords || (post?.focusKeyword ? [post.focusKeyword] : []),
    canonical,
    image,
    ogTitle: post?.ogTitle || undefined,
    ogDescription: post?.ogDescription || undefined,
    noIndex: post?.noIndex ?? false,
    type: "article",
    jsonLd: post
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description,
          image: image ? [image] : undefined,
          datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
          dateModified: new Date(post.updatedAt).toISOString(),
          author: { "@type": "Organization", name: post.authorName || "دیوساز" },
          publisher: {
            "@type": "Organization",
            name: "دیوساز",
            telephone: "09120858095",
            address: {
              "@type": "PostalAddress",
              addressLocality: "شهریار",
              streetAddress: "روبروی شهرک اداری، مجتمع تجاری اداری شهریار",
              addressCountry: "IR",
            },
          },
          mainEntityOfPage: canonical,
        }
      : undefined,
  });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && post) {
        await navigator.share({ title: post.title, text: post.excerpt, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("لینک مقاله کپی شد");
      }
    } catch {
      // کاربر پنجره اشتراک را بسته است.
    }
  };

  if (post === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">در حال بارگذاری مقاله…</div>;
  }

  if (post === null) {
    return (
      <main className="flex min-h-screen items-center justify-center p-5 text-center">
        <div>
          <h1 className="text-2xl font-extrabold">مقاله پیدا نشد</h1>
          <p className="mt-2 text-sm text-muted-foreground">ممکن است مقاله حذف شده یا هنوز منتشر نشده باشد.</p>
          <Button asChild className="mt-5">
            <Link to="/blog">بازگشت به وبلاگ</Link>
          </Button>
        </div>
      </main>
    );
  }

  const related = (allPosts || [])
    .filter((item) => item._id !== post._id)
    .filter((item) => !post.category || item.category === post.category)
    .slice(0, 2);

  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/blog" className="flex items-center gap-2 text-sm font-extrabold">
            <ArrowRight className="size-4" />
            وبلاگ دیوساز
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => void share()} aria-label="اشتراک مقاله">
              <Share2 className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <article>
        <header className="relative overflow-hidden border-b border-border/50">
          <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />
          <div className="pointer-events-none absolute inset-0 glow-emerald opacity-70" />
          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {post.category && (
                <span className="rounded-full bg-primary/10 px-3 py-1.5 font-bold text-primary">
                  {post.category}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5">
                <CalendarDays className="size-3.5" />
                {faDate(post.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5">
                <Clock3 className="size-3.5" />
                {readingMinutes(post.content)} دقیقه مطالعه
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold leading-[1.5] tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 max-w-3xl text-sm leading-8 text-muted-foreground sm:text-base">
                {post.excerpt}
              </p>
            )}
          </div>
        </header>

        {post.featuredImage && (
          <div className="mx-auto max-w-5xl px-4 pt-7 sm:px-6">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="aspect-[16/8] w-full rounded-[2rem] border border-border/70 object-cover"
            />
          </div>
        )}

        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[1fr_250px] lg:py-12">
          <div className="min-w-0">
            <ArticleContent content={post.content} />

            <div className="mt-12 rounded-[1.8rem] border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-gold/10 p-6">
              <Building2 className="size-8 text-primary" />
              <h2 className="mt-3 text-xl font-extrabold">برای پیدا کردن ملک مناسب با دیوساز تماس بگیرید</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                مشاوره و معرفی فایل‌های صنعتی و اداری در شهریار بر اساس نوع فعالیت، بودجه و موقعیت مورد نظر شما.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild className="gap-2 rounded-xl">
                  <a href="tel:09120858095">
                    <PhoneCall className="size-4" />
                    09120858095
                  </a>
                </Button>
                <Button variant="outline" asChild className="gap-2 rounded-xl">
                  <a
                    href="https://nshn.ir/2bveXP_xCgqA"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin className="size-4" />
                    مسیریابی
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <p className="text-xs text-muted-foreground">نویسنده</p>
              <p className="mt-1 text-sm font-extrabold">{post.authorName || "تیم دیوساز"}</p>
              {post.focusKeyword && (
                <>
                  <p className="mt-4 text-xs text-muted-foreground">موضوع اصلی</p>
                  <p className="mt-1 text-xs font-bold text-primary">{post.focusKeyword}</p>
                </>
              )}
            </div>

            {related.length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                <h2 className="text-sm font-extrabold">مقالات مرتبط</h2>
                <div className="mt-3 space-y-3">
                  {related.map((item) => (
                    <Link key={item._id} to={`/blog/${item.slug}`} className="block text-xs leading-6 transition-colors hover:text-primary">
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </article>
    </main>
  );
}
