import { ArticleContent } from "@/components/blog/ArticleContent";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  BarChart3,
  Bold,
  CheckCircle2,
  Eye,
  FileText,
  Heading2,
  Heading3,
  ImagePlus,
  Link2,
  List,
  Loader2,
  MonitorSmartphone,
  Plus,
  Quote,
  Save,
  Search,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type Status = "draft" | "published";

type FormState = {
  id?: any;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  featuredImage: string;
  status: Status;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  noIndex: boolean;
};

const EMPTY: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "املاک صنعتی",
  featuredImage: "",
  status: "draft",
  metaTitle: "",
  metaDescription: "",
  focusKeyword: "",
  keywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  noIndex: false,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);
}

function wordCount(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function seoAudit(form: FormState) {
  const keyword = form.focusKeyword.trim().toLowerCase();
  const title = (form.metaTitle || form.title).trim();
  const description = (form.metaDescription || form.excerpt).trim();
  const content = form.content.toLowerCase();

  const checks = [
    {
      label: "عنوان SEO بین ۳۰ تا ۶۰ کاراکتر",
      ok: title.length >= 30 && title.length <= 60,
      weight: 15,
    },
    {
      label: "توضیحات متا بین ۱۲۰ تا ۱۶۰ کاراکتر",
      ok: description.length >= 120 && description.length <= 160,
      weight: 15,
    },
    {
      label: "کلمه کلیدی هدف تعریف شده",
      ok: keyword.length >= 3,
      weight: 10,
    },
    {
      label: "کلمه کلیدی در عنوان استفاده شده",
      ok: keyword.length > 0 && title.toLowerCase().includes(keyword),
      weight: 15,
    },
    {
      label: "کلمه کلیدی در توضیحات متا وجود دارد",
      ok: keyword.length > 0 && description.toLowerCase().includes(keyword),
      weight: 10,
    },
    {
      label: "کلمه کلیدی در متن مقاله وجود دارد",
      ok: keyword.length > 0 && content.includes(keyword),
      weight: 10,
    },
    {
      label: "مقاله حداقل ۶۰۰ کلمه دارد",
      ok: wordCount(form.content) >= 600,
      weight: 10,
    },
    {
      label: "خلاصه مقاله کامل است",
      ok: form.excerpt.trim().length >= 80,
      weight: 5,
    },
    {
      label: "اسلاگ کوتاه و خوانا است",
      ok: form.slug.length >= 3 && form.slug.length <= 75,
      weight: 5,
    },
    {
      label: "تصویر شاخص یا تصویر شبکه اجتماعی تعیین شده",
      ok: Boolean(form.featuredImage.trim() || form.ogImage.trim()),
      weight: 5,
    },
  ];

  return {
    score: checks.reduce((total, item) => total + (item.ok ? item.weight : 0), 0),
    checks,
  };
}

function FieldLabel({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3">
      <label className="text-sm font-extrabold">{children}</label>
      {hint ? <span className="text-[10px] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export default function BlogAdmin() {
  const roleData = useQuery(api.roles.myRole);
  const posts = useQuery(api.posts.listManage);
  const savePost = useMutation(api.posts.save);
  const removePost = useMutation(api.posts.remove);
  const ensureSeedPosts = useMutation(api.posts.ensureSeedPosts);
  const ensureProfile = useMutation(api.roles.ensureProfile);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.posts.resolveStorageUrl);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const seededRef = useRef(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const canEdit =
    roleData?.role === "admin" || roleData?.role === "consultant";

  useEffect(() => {
    if (roleData === null) {
      ensureProfile().catch(() => undefined);
    }
  }, [roleData, ensureProfile]);

  useEffect(() => {
    if (!canEdit || seededRef.current) return;
    seededRef.current = true;
    ensureSeedPosts()
      .then((result) => {
        if (result.created > 0) {
          toast.success("دو مقاله اولیه مکا ساخته شد");
        }
      })
      .catch(() => undefined);
  }, [canEdit, ensureSeedPosts]);

  const audit = useMemo(() => seoAudit(form), [form]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts || [];
    return (posts || []).filter((post) =>
      [post.title, post.slug, post.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [posts, search]);

  const editPost = (post: any) => {
    setForm({
      id: post._id,
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      category: post.category || "",
      featuredImage: post.featuredImage || "",
      status: post.status || "draft",
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      focusKeyword: post.focusKeyword || "",
      keywords: (post.keywords || []).join("، "),
      canonicalUrl: post.canonicalUrl || "",
      ogTitle: post.ogTitle || "",
      ogDescription: post.ogDescription || "",
      ogImage: post.ogImage || "",
      noIndex: post.noIndex || false,
    });
    setPreview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const newPost = () => {
    setForm(EMPTY);
    setPreview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitle = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.id || prev.slug ? prev.slug : slugify(title),
      metaTitle: prev.metaTitle || title,
    }));
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("عنوان مقاله را وارد کنید");
      return;
    }
    if (form.content.trim().length < 100) {
      toast.error("متن مقاله هنوز خیلی کوتاه است");
      return;
    }

    setSaving(true);
    try {
      const id = await savePost({
        id: form.id || undefined,
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || undefined,
        content: form.content,
        category: form.category || undefined,
        featuredImage: form.featuredImage || undefined,
        status: form.status,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        focusKeyword: form.focusKeyword || undefined,
        keywords: form.keywords
          .split(/[،,]/)
          .map((item) => item.trim())
          .filter(Boolean),
        canonicalUrl: form.canonicalUrl || undefined,
        ogTitle: form.ogTitle || undefined,
        ogDescription: form.ogDescription || undefined,
        ogImage: form.ogImage || undefined,
        noIndex: form.noIndex,
      });
      setForm((prev) => ({ ...prev, id, slug: prev.slug || slugify(prev.title) }));
      toast.success(
        form.status === "published"
          ? "مقاله ذخیره و منتشر شد"
          : "پیش‌نویس ذخیره شد",
      );
    } catch (error: any) {
      toast.error(error?.message || "ذخیره مقاله ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!form.id) return;
    if (!window.confirm("این مقاله حذف شود؟ این عملیات قابل بازگشت نیست.")) return;
    try {
      await removePost({ id: form.id });
      toast.success("مقاله حذف شد");
      newPost();
    } catch (error: any) {
      toast.error(error?.message || "حذف مقاله ناموفق بود");
    }
  };

  const uploadFeaturedImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("فایل انتخاب‌شده تصویر نیست");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("حجم تصویر باید کمتر از ۶ مگابایت باشد");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("upload_failed");
      const payload = await response.json();
      const url = await resolveStorageUrl({ storageId: payload.storageId });
      if (!url) throw new Error("url_failed");
      update("featuredImage", url);
      toast.success("تصویر شاخص آپلود شد");
    } catch {
      toast.error("آپلود تصویر ناموفق بود");
    } finally {
      setUploadingImage(false);
    }
  };

  const insertText = (before: string, after = "", placeholder = "متن") => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.content.slice(start, end) || placeholder;
    const next =
      form.content.slice(0, start) +
      before +
      selected +
      after +
      form.content.slice(end);
    update("content", next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + before.length + selected.length + after.length;
      el.setSelectionRange(pos, pos);
    });
  };

  if (roleData === undefined || roleData === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <main className="flex min-h-screen items-center justify-center p-5 text-center">
        <div className="max-w-md rounded-3xl border border-border/70 bg-card p-7">
          <FileText className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-extrabold">دسترسی به مدیریت وبلاگ محدود است</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            فقط مدیر و مشاوران مجاز می‌توانند مقاله ایجاد یا ویرایش کنند.
          </p>
          <Button asChild className="mt-5">
            <Link to="/dashboard">بازگشت به داشبورد</Link>
          </Button>
        </div>
      </main>
    );
  }

  const seoTitle = form.metaTitle || form.title || "عنوان مقاله";
  const seoDescription =
    form.metaDescription ||
    form.excerpt ||
    "توضیحات مقاله در نتایج جست‌وجو اینجا نمایش داده می‌شود.";

  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-xl">
              <Link to="/dashboard" aria-label="بازگشت به داشبورد">
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold">استودیوی محتوای مکا</h1>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                نگارش، انتشار و تنظیمات SEO مقالات
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={newPost}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">مقاله جدید</span>
            </Button>
            <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              ذخیره
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-auto">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-3">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی مقاله…"
                className="h-10 rounded-xl pe-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            {posts === undefined ? (
              <div className="py-8 text-center text-xs text-muted-foreground">در حال دریافت مقاله‌ها…</div>
            ) : filteredPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                مقاله‌ای پیدا نشد.
              </div>
            ) : (
              filteredPosts.map((post) => (
                <button
                  type="button"
                  key={post._id}
                  onClick={() => editPost(post)}
                  className={`w-full rounded-2xl border p-4 text-right transition-colors ${
                    form.id === post._id
                      ? "border-primary/45 bg-primary/8"
                      : "border-border/70 bg-card/60 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                        post.status === "published"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {post.status === "published" ? "منتشرشده" : "پیش‌نویس"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{post.category || "بدون دسته"}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-extrabold leading-6">{post.title}</p>
                  <p dir="ltr" className="mt-2 truncate text-left text-[10px] text-muted-foreground">
                    /blog/{post.slug}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 rounded-[1.8rem] border border-border/70 bg-card/70 p-4 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_230px] xl:items-start">
              <div>
                <Input
                  value={form.title}
                  onChange={(e) => handleTitle(e.target.value)}
                  placeholder="عنوان جذاب مقاله را بنویسید…"
                  className="h-auto border-0 bg-transparent px-0 py-1 text-xl font-extrabold shadow-none focus-visible:ring-0 sm:text-2xl"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update("status", "draft")}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                      form.status === "draft" ? "border-amber-500/30 bg-amber-500/10 text-amber-600" : "border-border text-muted-foreground"
                    }`}
                  >
                    پیش‌نویس
                  </button>
                  <button
                    type="button"
                    onClick={() => update("status", "published")}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                      form.status === "published" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-border text-muted-foreground"
                    }`}
                  >
                    انتشار
                  </button>
                  {form.id && form.status === "published" ? (
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full" asChild>
                      <Link to={`/blog/${form.slug}`} target="_blank">
                        <Eye className="size-3.5" />
                        مشاهده
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">امتیاز SEO</span>
                  <span className="text-2xl font-extrabold text-primary">{audit.score}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${audit.score}%` }} />
                </div>
                <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                  {audit.score >= 80
                    ? "مقاله از نظر تنظیمات اصلی SEO وضعیت خوبی دارد."
                    : "موارد بخش SEO را کامل کنید تا امتیاز افزایش پیدا کند."}
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="content" className="gap-4">
            <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl p-1 sm:w-fit">
              <TabsTrigger value="content" className="h-10 rounded-xl px-4">
                <FileText className="size-4" />
                محتوا
              </TabsTrigger>
              <TabsTrigger value="seo" className="h-10 rounded-xl px-4">
                <BarChart3 className="size-4" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="social" className="h-10 rounded-xl px-4">
                <MonitorSmartphone className="size-4" />
                شبکه اجتماعی
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content">
              <div className="space-y-4">
                <div className="grid gap-4 rounded-[1.8rem] border border-border/70 bg-card/70 p-4 sm:grid-cols-2 sm:p-5">
                  <div>
                    <FieldLabel>دسته‌بندی</FieldLabel>
                    <Input value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="مثلاً املاک صنعتی" className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel>آدرس مقاله (Slug)</FieldLabel>
                    <Input
                      dir="ltr"
                      value={form.slug}
                      onChange={(e) => update("slug", slugify(e.target.value))}
                      placeholder="industrial-property-rent"
                      className="h-11 rounded-xl text-left"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel hint={`${form.excerpt.length} کاراکتر`}>خلاصه مقاله</FieldLabel>
                    <Textarea
                      value={form.excerpt}
                      onChange={(e) => update("excerpt", e.target.value)}
                      placeholder="خلاصه‌ای که در کارت وبلاگ و ابتدای مقاله نمایش داده می‌شود…"
                      className="min-h-24 rounded-xl leading-7"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FieldLabel>تصویر شاخص</FieldLabel>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        dir="ltr"
                        value={form.featuredImage}
                        onChange={(e) => update("featuredImage", e.target.value)}
                        placeholder="https://... یا تصویر را آپلود کنید"
                        className="h-11 rounded-xl text-left"
                      />
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadFeaturedImage(file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 shrink-0 gap-2 rounded-xl"
                        disabled={uploadingImage}
                        onClick={() => imageInputRef.current?.click()}
                      >
                        {uploadingImage ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                        {uploadingImage ? "آپلود…" : "آپلود از موبایل"}
                      </Button>
                    </div>
                    {form.featuredImage ? (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
                        <img src={form.featuredImage} alt="پیش‌نمایش تصویر شاخص" className="aspect-[16/7] w-full object-cover" />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button type="button" size="icon" variant="ghost" className="rounded-lg" onClick={() => insertText("## ", "", "تیتر بخش")}>
                        <Heading2 className="size-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="rounded-lg" onClick={() => insertText("### ", "", "زیرتیتر")}>
                        <Heading3 className="size-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="rounded-lg" onClick={() => insertText("**", "**", "متن بولد")}>
                        <Bold className="size-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="rounded-lg" onClick={() => insertText("- ", "", "آیتم فهرست")}>
                        <List className="size-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="rounded-lg" onClick={() => insertText("> ", "", "نکته مهم")}>
                        <Quote className="size-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="rounded-lg" onClick={() => insertText("[", "](https://)", "متن لینک")}>
                        <Link2 className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground">{wordCount(form.content).toLocaleString("fa-IR")} کلمه</span>
                      <button
                        type="button"
                        onClick={() => setPreview((value) => !value)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary"
                      >
                        <Eye className="size-4" />
                        {preview ? "ویرایش" : "پیش‌نمایش"}
                      </button>
                    </div>
                  </div>

                  {preview ? (
                    <div className="min-h-[520px] bg-background/35 p-5 sm:p-8">
                      <h1 className="text-2xl font-extrabold leading-10">{form.title || "عنوان مقاله"}</h1>
                      {form.excerpt ? <p className="mt-3 text-sm leading-7 text-muted-foreground">{form.excerpt}</p> : null}
                      <div className="mt-6">
                        <ArticleContent content={form.content || "متن مقاله اینجا نمایش داده می‌شود."} />
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      ref={contentRef}
                      value={form.content}
                      onChange={(e) => update("content", e.target.value)}
                      placeholder={"## تیتر بخش\n\nمتن مقاله را اینجا بنویسید…"}
                      className="min-h-[560px] resize-y rounded-none border-0 bg-transparent p-5 text-[15px] leading-8 shadow-none focus-visible:ring-0 sm:p-7"
                    />
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4 rounded-[1.8rem] border border-border/70 bg-card/70 p-4 sm:p-5">
                  <div>
                    <FieldLabel hint={`${form.metaTitle.length}/60`}>عنوان SEO</FieldLabel>
                    <Input value={form.metaTitle} onChange={(e) => update("metaTitle", e.target.value)} placeholder={form.title || "عنوان صفحه در گوگل"} className="h-11 rounded-xl" />
                  </div>

                  <div>
                    <FieldLabel hint={`${form.metaDescription.length}/160`}>Meta Description</FieldLabel>
                    <Textarea value={form.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} placeholder="توضیح کوتاه و جذاب برای نتیجه گوگل…" className="min-h-28 rounded-xl leading-7" />
                  </div>

                  <div>
                    <FieldLabel>کلمه کلیدی هدف</FieldLabel>
                    <Input value={form.focusKeyword} onChange={(e) => update("focusKeyword", e.target.value)} placeholder="مثلاً اجاره املاک صنعتی در شهریار" className="h-11 rounded-xl" />
                  </div>

                  <div>
                    <FieldLabel hint="با ویرگول جدا کنید">کلمات کلیدی مرتبط</FieldLabel>
                    <Input value={form.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="اجاره سوله، کارخانه، ملک صنعتی…" className="h-11 rounded-xl" />
                  </div>

                  <div>
                    <FieldLabel>Canonical URL</FieldLabel>
                    <Input dir="ltr" value={form.canonicalUrl} onChange={(e) => update("canonicalUrl", e.target.value)} placeholder="https://example.com/blog/..." className="h-11 rounded-xl text-left" />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 p-4">
                    <div>
                      <p className="text-sm font-extrabold">عدم ایندکس مقاله</p>
                      <p className="mt-1 text-xs text-muted-foreground">در صورت فعال بودن، robots روی noindex قرار می‌گیرد.</p>
                    </div>
                    <Switch checked={form.noIndex} onCheckedChange={(checked) => update("noIndex", checked)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.8rem] border border-border/70 bg-card/70 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Search className="size-4 text-primary" />
                      <h2 className="text-sm font-extrabold">پیش‌نمایش Google</h2>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                      <p dir="ltr" className="truncate text-[11px] text-emerald-700 dark:text-emerald-400">
                        meka.ir › blog › {form.slug || "article"}
                      </p>
                      <p className="mt-1 text-lg font-medium leading-7 text-blue-700 dark:text-blue-400">{seoTitle}</p>
                      <p className="mt-1 line-clamp-3 text-xs leading-6 text-muted-foreground">{seoDescription}</p>
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-border/70 bg-card/70 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-extrabold">چک‌لیست SEO</h2>
                      <span className="text-lg font-extrabold text-primary">{audit.score}/100</span>
                    </div>
                    <div className="space-y-2.5">
                      {audit.checks.map((item) => (
                        <div key={item.label} className="flex items-start gap-2 text-xs leading-5">
                          <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${item.ok ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                          <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-4 rounded-[1.8rem] border border-border/70 bg-card/70 p-4 sm:p-5">
                  <div>
                    <FieldLabel>Open Graph Title</FieldLabel>
                    <Input value={form.ogTitle} onChange={(e) => update("ogTitle", e.target.value)} placeholder="در صورت خالی بودن از عنوان SEO استفاده می‌شود" className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <FieldLabel>Open Graph Description</FieldLabel>
                    <Textarea value={form.ogDescription} onChange={(e) => update("ogDescription", e.target.value)} placeholder="توضیح مخصوص اشتراک در شبکه‌های اجتماعی" className="min-h-28 rounded-xl leading-7" />
                  </div>
                  <div>
                    <FieldLabel>تصویر Open Graph</FieldLabel>
                    <Input dir="ltr" value={form.ogImage} onChange={(e) => update("ogImage", e.target.value)} placeholder="https://.../1200x630.jpg" className="h-11 rounded-xl text-left" />
                  </div>
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex gap-2">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                      <p className="text-xs leading-6 text-muted-foreground">
                        برای اشتراک حرفه‌ای، تصویر ۱۲۰۰×۶۳۰ پیکسل مناسب است. اگر این بخش خالی بماند، تصویر شاخص مقاله استفاده می‌شود.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="self-start overflow-hidden rounded-[1.8rem] border border-border/70 bg-card">
                  {(form.ogImage || form.featuredImage) ? (
                    <img src={form.ogImage || form.featuredImage} alt="" className="aspect-[1.91/1] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[1.91/1] items-center justify-center bg-gradient-to-br from-primary/15 to-gold/10">
                      <MonitorSmartphone className="size-12 text-primary/30" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-[10px] uppercase text-muted-foreground">MEKA.IR</p>
                    <p className="mt-1 line-clamp-2 text-base font-extrabold">{form.ogTitle || seoTitle}</p>
                    <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground">{form.ogDescription || seoDescription}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {form.id ? (
            <div className="mt-5 flex justify-end border-t border-border/60 pt-5">
              <Button
                variant="outline"
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => void remove()}
              >
                <Trash2 className="size-4" />
                حذف مقاله
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
