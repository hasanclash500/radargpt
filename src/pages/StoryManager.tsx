import DashboardSectionNav from "@/components/dashboard/DashboardSectionNav";
import MekaBrand from "@/components/MekaBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { resizeImageFile } from "@/lib/image-resize";
import { useMutation, useQuery } from "convex/react";
import {
  Archive,
  ArrowRight,
  Eye,
  Image as ImageIcon,
  Link2,
  Loader2,
  Pencil,
  Play,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type ContentType = "image" | "video" | "text";

type StoryForm = {
  id?: any;
  ownerUserId: string;
  title: string;
  body: string;
  contentType: ContentType;
  storageId?: any;
  mediaUrl: string;
  linkUrl: string;
  linkLabel: string;
  stickerText: string;
  stickerStyle: string;
  background: string;
  durationSec: number;
  startsAt: string;
};

const EMPTY: StoryForm = {
  ownerUserId: "",
  title: "",
  body: "",
  contentType: "image",
  mediaUrl: "",
  linkUrl: "",
  linkLabel: "مشاهده جزئیات",
  stickerText: "",
  stickerStyle: "soft",
  background: "#0f5132",
  durationSec: 15,
  startsAt: "",
};

function toLocalInput(timestamp?: number | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

async function videoDuration(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => reject(new Error("خواندن مدت ویدئو ممکن نشد."));
      video.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function statusLabel(status: string) {
  if (status === "published") return "فعال";
  if (status === "scheduled") return "زمان‌بندی‌شده";
  if (status === "archived" || status === "expired") return "آرشیو";
  return "پیش‌نویس";
}

function StoryPreview({
  form,
  advisor,
}: {
  form: StoryForm;
  advisor: any;
}) {
  return (
    <div
      className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-[2rem] bg-zinc-950 text-white shadow-xl"
      style={
        form.contentType === "text"
          ? {
              background:
                form.background ||
                "linear-gradient(160deg,#064e3b,#0f172a 65%,#020617)",
            }
          : undefined
      }
    >
      {form.contentType === "image" && form.mediaUrl && (
        <img
          src={form.mediaUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {form.contentType === "video" && form.mediaUrl && (
        <video
          src={form.mediaUrl}
          muted
          loop
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/5 to-black/75" />
      <div className="absolute inset-x-0 top-0 p-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((item) => (
            <span
              key={item}
              className={
                "h-1 flex-1 rounded-full " +
                (item === 0 ? "bg-primary" : "bg-white/35")
              }
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {advisor?.profileImageUrl ? (
            <img
              src={advisor.profileImageUrl}
              alt=""
              className="size-9 rounded-full border-2 border-white object-cover"
            />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-white/15 text-xs font-black">
              {(advisor?.displayName || "م").slice(0, 1)}
            </span>
          )}
          <div>
            <strong className="block text-xs">
              {advisor?.displayName || "مشاور مکا"}
            </strong>
            <span className="text-[9px] text-white/70">
              {form.durationSec.toLocaleString("fa-IR")} ثانیه
            </span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4">
        {form.stickerText && (
          <span className="mb-2 inline-flex rounded-xl bg-white/90 px-2.5 py-1.5 text-[11px] font-black text-emerald-900">
            {form.stickerText}
          </span>
        )}
        {form.title && (
          <h3 className="text-2xl font-black leading-[1.35]">{form.title}</h3>
        )}
        {form.body && (
          <p className="mt-2 line-clamp-4 whitespace-pre-line text-xs leading-6 text-white/80">
            {form.body}
          </p>
        )}
        {form.linkUrl && (
          <span className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-full bg-white text-xs font-black text-emerald-950">
            <Link2 className="size-3.5" />
            {form.linkLabel || "مشاهده جزئیات"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function StoryManager() {
  const role = useQuery(api.roles.myRole, {});
  const profile = useQuery(api.advisors.getMyProfile, {});
  const authors = useQuery(api.advisors.listStoryAuthors, {}) ?? [];
  const stories = useQuery(api.stories.listManage, {}) ?? [];
  const generateUploadUrl = useMutation(api.stories.generateStoryUploadUrl);
  const saveDraft = useMutation(api.stories.saveDraft);
  const publishStory = useMutation(api.stories.publish);
  const archiveStory = useMutation(api.stories.archive);
  const removeStory = useMutation(api.stories.remove);

  const [form, setForm] = useState<StoryForm>(EMPTY);
  const [busy, setBusy] = useState("");
  const [filter, setFilter] = useState<"active" | "draft" | "archive">("active");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!form.ownerUserId && authors[0]?.userId) {
      setForm((current) => ({ ...current, ownerUserId: authors[0].userId }));
    }
  }, [authors, form.ownerUserId]);

  const advisor = authors.find((item: any) => item.userId === form.ownerUserId);

  const filteredStories = useMemo(() => {
    return stories.filter((story: any) => {
      if (filter === "active") {
        return story.status === "published" || story.status === "scheduled";
      }
      if (filter === "draft") return story.status === "draft";
      return story.status === "archived" || story.status === "expired";
    });
  }, [stories, filter]);

  if (role === undefined || profile === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const allowed =
    role?.role === "manager" || role?.role === "consultant";

  if (!allowed) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-black">دسترسی مدیریت استوری ندارید</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            این بخش فقط برای مدیر و مشاوران مکا فعال است.
          </p>
          <Button asChild className="mt-5">
            <Link to="/dashboard">بازگشت به داشبورد</Link>
          </Button>
        </div>
      </main>
    );
  }

  const update = <K extends keyof StoryForm>(key: K, value: StoryForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const upload = async (file: File) => {
    const wantsImage = form.contentType === "image";
    const wantsVideo = form.contentType === "video";

    if (wantsImage && !file.type.startsWith("image/")) {
      toast.error("برای استوری عکس، یک تصویر انتخاب کنید.");
      return;
    }
    if (wantsVideo && !file.type.startsWith("video/")) {
      toast.error("برای استوری ویدئویی، فایل ویدئو انتخاب کنید.");
      return;
    }
    if (file.size > (wantsVideo ? 40 : 20) * 1024 * 1024) {
      toast.error(
        wantsVideo
          ? "حجم ویدئو باید کمتر از ۴۰ مگابایت باشد."
          : "حجم تصویر باید کمتر از ۲۰ مگابایت باشد.",
      );
      return;
    }

    if (wantsVideo) {
      const duration = await videoDuration(file);
      if (!Number.isFinite(duration) || duration > 15.2) {
        toast.error("ویدئوی استوری باید حداکثر ۱۵ ثانیه باشد.");
        return;
      }
      update("durationSec", Math.max(3, Math.min(15, Math.ceil(duration))));
    }

    setBusy("upload");
    try {
      const uploadFile = wantsImage
        ? await resizeImageFile(file, {
            maxWidth: 1440,
            maxHeight: 2200,
            quality: 0.88,
          })
        : file;

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": uploadFile.type || "application/octet-stream",
        },
        body: uploadFile,
      });
      if (!response.ok) throw new Error("آپلود فایل استوری ناموفق بود.");
      const payload = await response.json();
      const local = URL.createObjectURL(uploadFile);
      setForm((current) => ({
        ...current,
        storageId: payload.storageId,
        mediaUrl: local,
      }));
      toast.success("فایل استوری آماده است");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "آپلود ناموفق بود");
    } finally {
      setBusy("");
    }
  };

  const persist = async () => {
    if (!form.ownerUserId) {
      toast.error("مشاور را انتخاب کنید.");
      return null;
    }
    if (form.contentType !== "text" && !form.storageId) {
      toast.error("فایل عکس یا ویدئو را انتخاب کنید.");
      return null;
    }

    setBusy("save");
    try {
      const startsAt = form.startsAt
        ? new Date(form.startsAt).getTime()
        : undefined;
      const id = await saveDraft({
        id: form.id,
        ownerUserId: form.ownerUserId,
        title: form.title,
        body: form.body,
        contentType: form.contentType,
        storageId: form.storageId,
        linkUrl: form.linkUrl,
        linkLabel: form.linkLabel,
        stickerText: form.stickerText,
        stickerStyle: form.stickerStyle,
        background: form.background,
        durationSec: form.durationSec,
        startsAt,
      });
      setForm((current) => ({ ...current, id }));
      toast.success("پیش‌نویس استوری ذخیره شد");
      return id;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره استوری ناموفق بود");
      return null;
    } finally {
      setBusy("");
    }
  };

  const publish = async () => {
    let id = form.id;
    if (!id) id = await persist();
    if (!id) return;
    setBusy("publish");
    try {
      const startsAt = form.startsAt
        ? new Date(form.startsAt).getTime()
        : undefined;
      await publishStory({ id, startsAt });
      toast.success(
        startsAt && startsAt > Date.now() + 30_000
          ? "استوری زمان‌بندی شد"
          : "استوری منتشر شد",
      );
      setFilter("active");
      setForm({
        ...EMPTY,
        ownerUserId: form.ownerUserId || authors[0]?.userId || "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "انتشار استوری ناموفق بود");
    } finally {
      setBusy("");
    }
  };

  const editStory = (story: any) => {
    setForm({
      id: story.id,
      ownerUserId: story.ownerUserId,
      title: story.title || "",
      body: story.body || "",
      contentType: story.contentType,
      storageId: story.storageId,
      mediaUrl: story.mediaUrl || "",
      linkUrl: story.linkUrl || "",
      linkLabel: story.linkLabel || "مشاهده جزئیات",
      stickerText: story.stickerText || "",
      stickerStyle: story.stickerStyle || "soft",
      background: story.background || "#0f5132",
      durationSec: story.durationSec || 15,
      startsAt: toLocalInput(story.startsAt),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main dir="rtl" className="min-h-screen bg-muted/30">
      <header className="glass border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to="/dashboard">
                <ArrowRight className="size-4" />
                داشبورد
              </Link>
            </Button>
            <MekaBrand compact link={false} />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <DashboardSectionNav />

      <section className="mx-auto max-w-7xl space-y-4 px-3 py-5 sm:px-6 sm:py-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[2rem] border border-primary/20 bg-primary/[0.04] p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Play className="size-5" />
              </span>
              <div>
                <h1 className="text-xl font-black sm:text-2xl">
                  مدیریت استوری مشاوران
                </h1>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  عکس، ویدئوی حداکثر ۱۵ ثانیه، متن، لینک و استیکر را در یک استوری کامل منتشر کنید.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card p-4 text-[11px] leading-6 text-muted-foreground">
            <Sparkles className="mb-2 size-5 text-primary" />
            نوار استوری در صفحات عمومی فقط وقتی نمایش داده می‌شود که حداقل یک استوری فعال وجود داشته باشد؛ در غیر این صورت هیچ فضای خالی نمایش داده نمی‌شود.
          </div>
        </div>

        {!profile?.exists && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-6">
            برای نمایش استوری در سایت عمومی، ابتدا
            <Link to="/dashboard/profile" className="mx-1 font-black text-primary">
              پروفایل عمومی مشاور
            </Link>
            را تکمیل و فعال کنید.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black">ایجاد استوری کامل</h2>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  هر استوری بعد از انتشار ۲۴ ساعت فعال می‌ماند.
                </p>
              </div>
              {form.id && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setForm({
                      ...EMPTY,
                      ownerUserId: authors[0]?.userId || "",
                    })
                  }
                >
                  <Plus className="size-4" />
                  جدید
                </Button>
              )}
            </div>

            <div className="mt-5 grid gap-4">
              <div className="space-y-1.5">
                <Label>انتخاب مشاور *</Label>
                <select
                  value={form.ownerUserId}
                  disabled={role?.role === "consultant"}
                  onChange={(e) => update("ownerUserId", e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">انتخاب کنید</option>
                  {authors.map((item: any) => (
                    <option key={item.userId} value={item.userId}>
                      {item.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>عنوان کوتاه استوری</Label>
                  <Input
                    maxLength={80}
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="مثلاً سوله صنعتی مدرن"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>زمان نمایش</Label>
                  <select
                    value={form.durationSec}
                    onChange={(e) => update("durationSec", Number(e.target.value))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {[5, 8, 10, 12, 15].map((sec) => (
                      <option key={sec} value={sec}>
                        {sec.toLocaleString("fa-IR")} ثانیه
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>متن استوری</Label>
                <Textarea
                  rows={4}
                  maxLength={500}
                  value={form.body}
                  onChange={(e) => update("body", e.target.value)}
                  placeholder="توضیح کوتاه درباره ملک یا موضوع استوری…"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>لینک مقصد</Label>
                  <Input
                    dir="ltr"
                    value={form.linkUrl}
                    onChange={(e) => update("linkUrl", e.target.value)}
                    placeholder="/listings/... یا https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>متن دکمه لینک</Label>
                  <Input
                    value={form.linkLabel}
                    onChange={(e) => update("linkLabel", e.target.value)}
                    placeholder="مشاهده ملک"
                  />
                </div>
              </div>

              <div>
                <Label>نوع محتوا *</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { id: "image", label: "عکس", icon: ImageIcon },
                    { id: "video", label: "ویدئو ۱۵ ثانیه", icon: Video },
                    { id: "text", label: "فقط متن", icon: Sparkles },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          contentType: id as ContentType,
                          storageId:
                            id === "text" ? undefined : current.storageId,
                          mediaUrl: id === "text" ? "" : current.mediaUrl,
                        }))
                      }
                      className={
                        "rounded-2xl border p-3 text-center text-[11px] font-bold " +
                        (form.contentType === id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background")
                      }
                    >
                      <Icon className="mx-auto size-5" />
                      <span className="mt-1.5 block">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {form.contentType !== "text" && (
                <div className="rounded-2xl border border-dashed border-border p-4">
                  <input
                    ref={inputRef}
                    type="file"
                    accept={
                      form.contentType === "image"
                        ? "image/*"
                        : "video/mp4,video/webm,video/quicktime"
                    }
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void upload(file);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex flex-col items-center justify-center py-2 text-center">
                    <Upload className="size-7 text-primary" />
                    <p className="mt-2 text-sm font-black">
                      انتخاب یا آپلود فایل
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {form.contentType === "video"
                        ? "MP4/WebM/MOV · حداکثر ۱۵ ثانیه"
                        : "JPG/PNG/WebP · تصویر کامل و بدون کراپ"}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5"
                      disabled={busy === "upload"}
                      onClick={() => inputRef.current?.click()}
                    >
                      {busy === "upload" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      انتخاب فایل
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>استیکر متنی</Label>
                  <Input
                    value={form.stickerText}
                    onChange={(e) => update("stickerText", e.target.value)}
                    placeholder="مثلاً فروش · بازدید امروز · ویژه"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>رنگ پس‌زمینه / تم</Label>
                  <Input
                    dir="ltr"
                    type="color"
                    value={
                      /^#[0-9a-f]{6}$/i.test(form.background)
                        ? form.background
                        : "#0f5132"
                    }
                    onChange={(e) => update("background", e.target.value)}
                    className="h-10 p-1"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>زمان شروع اختیاری</Label>
                <Input
                  dir="ltr"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => update("startsAt", e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  اگر خالی باشد، استوری بلافاصله منتشر می‌شود.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={busy === "save"}
                  onClick={() => void persist()}
                >
                  {busy === "save" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  ذخیره پیش‌نویس
                </Button>
                <Button
                  type="button"
                  className="gap-2"
                  disabled={busy === "publish"}
                  onClick={() => void publish()}
                >
                  {busy === "publish" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  انتشار استوری
                </Button>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
            <div className="mb-3 flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              <strong className="text-sm">پیش‌نمایش استوری</strong>
            </div>
            <StoryPreview form={form} advisor={advisor} />
          </aside>
        </div>

        <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-black">استوری‌های مشاوران</h2>
            <div className="flex rounded-xl border border-border/70 bg-background p-1">
              {[
                ["active", "فعال"],
                ["draft", "پیش‌نویس"],
                ["archive", "آرشیو"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id as any)}
                  className={
                    "rounded-lg px-3 py-1.5 text-[10px] font-extrabold " +
                    (filter === id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredStories.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              استوری‌ای در این بخش وجود ندارد.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredStories.map((story: any) => (
                <article
                  key={String(story.id)}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-background"
                >
                  <div className="relative aspect-[16/9] bg-muted/50">
                    {story.contentType === "image" && story.mediaUrl ? (
                      <img
                        src={story.mediaUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : story.contentType === "video" && story.mediaUrl ? (
                      <video
                        src={story.mediaUrl}
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ background: story.background || "#0f5132" }}
                      />
                    )}
                    <Badge className="absolute end-2 top-2">
                      {statusLabel(story.status)}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-muted-foreground">
                      {story.advisor.displayName}
                    </p>
                    <h3 className="mt-1 line-clamp-1 text-sm font-black">
                      {story.title || "استوری بدون عنوان"}
                    </h3>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {story.durationSec.toLocaleString("fa-IR")} ثانیه
                      </span>
                      <span>
                        {story.viewCount.toLocaleString("fa-IR")} بازدید
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-[10px]"
                        onClick={() => editStory(story)}
                      >
                        <Pencil className="size-3.5" />
                        ویرایش
                      </Button>
                      {story.status !== "archived" &&
                        story.status !== "expired" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-[10px]"
                            onClick={async () => {
                              await archiveStory({ id: story.id });
                              toast.success("استوری آرشیو شد");
                            }}
                          >
                            <Archive className="size-3.5" />
                            آرشیو
                          </Button>
                        )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1 text-[10px] text-destructive"
                        onClick={async () => {
                          if (!window.confirm("این استوری حذف شود؟")) return;
                          await removeStory({ id: story.id });
                          toast.success("استوری حذف شد");
                        }}
                      >
                        <Trash2 className="size-3.5" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
