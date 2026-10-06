import DashboardSectionNav from "@/components/dashboard/DashboardSectionNav";
import SitePageRenderer from "@/components/pages/SitePageRenderer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bot,
  Copy,
  Eye,
  EyeOff,
  FilePlus2,
  Globe2,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type Block = {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  props: Record<string, any>;
};

type Draft = {
  id?: any;
  title: string;
  slug: string;
  pageType: "landing" | "page";
  status: "draft" | "published";
  isHomepage: boolean;
  blocks: Block[];
  seoTitle: string;
  seoDescription: string;
  noIndex: boolean;
};

const BLOCK_LABELS: Record<string, string> = {
  hero: "هیرو / معرفی اصلی",
  intentHub: "انتخاب خرید، اجاره، فروش",
  listings: "ویترین آگهی‌ها",
  services: "خدمات",
  split: "تصویر + متن",
  richText: "متن آزاد",
  cta: "دعوت به اقدام",
  contact: "تماس و مسیریابی",
};

function blockId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function defaultProps(type: string) {
  if (type === "hero") {
    return {
      eyebrow: "دیوساز",
      title: "عنوان اصلی صفحه",
      highlight: "تیتر برجسته",
      text: "توضیح کوتاه و واضح برای این صفحه.",
      primaryLabel: "مشاهده آگهی‌ها",
      primaryHref: "/listings",
      secondaryLabel: "ثبت تقاضا",
      secondaryHref: "/request",
    };
  }
  if (type === "intentHub") {
    return {
      title: "چه کاری می‌خواهید انجام دهید؟",
      text: "مسیر مناسب را انتخاب کنید.",
      propertyTypes: ["سوله", "کارخانه", "کارگاه", "انبار", "زمین صنعتی", "دفتر اداری"],
    };
  }
  if (type === "listings") {
    return { eyebrow: "فایل‌های منتخب", title: "ویترین آگهی‌های دیوساز", text: "", limit: 8 };
  }
  if (type === "services") {
    return {
      title: "خدمات دیوساز",
      text: "",
      items: [
        { title: "املاک صنعتی", text: "سوله، کارخانه، کارگاه و انبار." },
        { title: "املاک اداری", text: "دفتر و فضای اداری." },
      ],
    };
  }
  if (type === "split") {
    return {
      eyebrow: "",
      title: "عنوان سکشن",
      text: "توضیحات سکشن",
      buttonLabel: "بیشتر بدانید",
      buttonHref: "/listings",
      imageUrl: "",
      imagePosition: "end",
    };
  }
  if (type === "richText") {
    return { eyebrow: "", title: "عنوان", body: "متن این بخش را بنویسید.", align: "start" };
  }
  if (type === "cta") {
    return {
      title: "آماده شروع هستید؟",
      text: "از مسیر مناسب ادامه دهید.",
      primaryLabel: "مشاهده آگهی‌ها",
      primaryHref: "/listings",
      secondaryLabel: "تماس با دیوساز",
      secondaryHref: "tel:09120858095",
    };
  }
  return {
    title: "ارتباط با دیوساز",
    text: "برای مشاوره با دفتر تماس بگیرید.",
    phone: "09120858095",
    address: "شهریار، روبروی شهرک اداری، مجتمع تجاری اداری شهریار",
    mapLocation: "جاده شهریار–شهدای اندیشه",
    mapUrl: "https://nshn.ir/2bveXP_xCgqA",
  };
}

function newBlock(type: string): Block {
  return { id: blockId(), type, enabled: true, order: 0, props: defaultProps(type) };
}

function emptyDraft(): Draft {
  return {
    title: "صفحه جدید",
    slug: "",
    pageType: "page",
    status: "draft",
    isHomepage: false,
    blocks: [newBlock("hero"), newBlock("cta")].map((b, index) => ({ ...b, order: index })),
    seoTitle: "",
    seoDescription: "",
    noIndex: false,
  };
}

function fromRow(row: any): Draft {
  return {
    id: row._id,
    title: row.title ?? "",
    slug: row.slug ?? "",
    pageType: row.pageType ?? "page",
    status: row.status ?? "draft",
    isHomepage: Boolean(row.isHomepage),
    blocks: [...(row.blocks ?? [])].sort((a, b) => a.order - b.order),
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    noIndex: Boolean(row.noIndex),
  };
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function AreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function BlockPropsEditor({
  block,
  onChange,
}: {
  block: Block;
  onChange: (props: Record<string, any>) => void;
}) {
  const p = block.props || {};
  const set = (key: string, value: any) => onChange({ ...p, [key]: value });

  if (block.type === "hero") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="بالانویس" value={p.eyebrow || ""} onChange={(v) => set("eyebrow", v)} />
        <TextField label="عنوان اصلی" value={p.title || ""} onChange={(v) => set("title", v)} />
        <TextField label="تیتر برجسته" value={p.highlight || ""} onChange={(v) => set("highlight", v)} />
        <div className="sm:col-span-2">
          <AreaField label="توضیحات" value={p.text || ""} onChange={(v) => set("text", v)} rows={3} />
        </div>
        <TextField label="دکمه اصلی" value={p.primaryLabel || ""} onChange={(v) => set("primaryLabel", v)} />
        <TextField label="لینک دکمه اصلی" value={p.primaryHref || ""} onChange={(v) => set("primaryHref", v)} />
        <TextField label="دکمه دوم" value={p.secondaryLabel || ""} onChange={(v) => set("secondaryLabel", v)} />
        <TextField label="لینک دکمه دوم" value={p.secondaryHref || ""} onChange={(v) => set("secondaryHref", v)} />
      </div>
    );
  }

  if (block.type === "intentHub") {
    return (
      <div className="grid gap-3">
        <TextField label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <AreaField label="توضیح" value={p.text || ""} onChange={(v) => set("text", v)} rows={2} />
        <AreaField
          label="انواع ملک - هر مورد یک خط"
          value={(p.propertyTypes || []).join("\n")}
          onChange={(v) => set("propertyTypes", v.split("\n").map((x) => x.trim()).filter(Boolean))}
          rows={5}
        />
      </div>
    );
  }

  if (block.type === "listings") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="بالانویس" value={p.eyebrow || ""} onChange={(v) => set("eyebrow", v)} />
        <TextField label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <div className="sm:col-span-2">
          <AreaField label="توضیح" value={p.text || ""} onChange={(v) => set("text", v)} rows={2} />
        </div>
        <label className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground">تعداد آگهی</span>
          <Input type="number" min={1} max={12} value={String(p.limit ?? 8)} onChange={(e) => set("limit", Number(e.target.value))} />
        </label>
      </div>
    );
  }

  if (block.type === "services") {
    const items = Array.isArray(p.items) ? p.items : [];
    return (
      <div className="grid gap-3">
        <TextField label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <AreaField label="توضیح" value={p.text || ""} onChange={(v) => set("text", v)} rows={2} />
        <AreaField
          label="خدمات - هر خط: عنوان | توضیح"
          value={items.map((item: any) => (item.title || "") + " | " + (item.text || "")).join("\n")}
          onChange={(v) =>
            set(
              "items",
              v.split("\n")
                .filter(Boolean)
                .map((line) => {
                  const [title, ...rest] = line.split("|");
                  return { title: title.trim(), text: rest.join("|").trim() };
                }),
            )
          }
          rows={6}
        />
      </div>
    );
  }

  if (block.type === "split") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="بالانویس" value={p.eyebrow || ""} onChange={(v) => set("eyebrow", v)} />
        <TextField label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <div className="sm:col-span-2"><AreaField label="متن" value={p.text || ""} onChange={(v) => set("text", v)} /></div>
        <TextField label="متن دکمه" value={p.buttonLabel || ""} onChange={(v) => set("buttonLabel", v)} />
        <TextField label="لینک دکمه" value={p.buttonHref || ""} onChange={(v) => set("buttonHref", v)} />
        <TextField label="آدرس تصویر" value={p.imageUrl || ""} onChange={(v) => set("imageUrl", v)} />
        <label className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground">جای تصویر</span>
          <select value={p.imagePosition || "end"} onChange={(e) => set("imagePosition", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="end">سمت دوم</option>
            <option value="start">سمت اول</option>
          </select>
        </label>
      </div>
    );
  }

  if (block.type === "richText") {
    return (
      <div className="grid gap-3">
        <TextField label="بالانویس" value={p.eyebrow || ""} onChange={(v) => set("eyebrow", v)} />
        <TextField label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <AreaField label="متن" value={p.body || ""} onChange={(v) => set("body", v)} rows={7} />
        <label className="space-y-1.5">
          <span className="text-[11px] font-bold text-muted-foreground">چینش</span>
          <select value={p.align || "start"} onChange={(e) => set("align", e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="start">راست</option>
            <option value="center">وسط</option>
          </select>
        </label>
      </div>
    );
  }

  if (block.type === "cta") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <div className="sm:col-span-2"><AreaField label="توضیح" value={p.text || ""} onChange={(v) => set("text", v)} rows={2} /></div>
        <TextField label="دکمه اصلی" value={p.primaryLabel || ""} onChange={(v) => set("primaryLabel", v)} />
        <TextField label="لینک اصلی" value={p.primaryHref || ""} onChange={(v) => set("primaryHref", v)} />
        <TextField label="دکمه دوم" value={p.secondaryLabel || ""} onChange={(v) => set("secondaryLabel", v)} />
        <TextField label="لینک دوم" value={p.secondaryHref || ""} onChange={(v) => set("secondaryHref", v)} />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
      <div className="sm:col-span-2"><AreaField label="توضیح" value={p.text || ""} onChange={(v) => set("text", v)} rows={2} /></div>
      <TextField label="شماره تماس" value={p.phone || ""} onChange={(v) => set("phone", v)} />
      <TextField label="آدرس دفتر" value={p.address || ""} onChange={(v) => set("address", v)} />
      <TextField label="عنوان موقعیت روی نقشه" value={p.mapLocation || ""} onChange={(v) => set("mapLocation", v)} />
      <div className="sm:col-span-2">
        <TextField label="لینک نشان" value={p.mapUrl || ""} onChange={(v) => set("mapUrl", v)} placeholder="https://nshn.ir/..." />
      </div>
    </div>
  );
}

export default function PageBuilder() {
  const role = useQuery(api.roles.myRole, {});
  const pages = useQuery(api.pages.listAdmin, {}) ?? [];
  const savePage = useMutation(api.pages.savePage);
  const publishPage = useMutation(api.pages.publishPage);
  const unpublishPage = useMutation(api.pages.unpublishPage);
  const duplicatePage = useMutation(api.pages.duplicatePage);
  const deletePage = useMutation(api.pages.deletePage);
  const ensureHomepage = useMutation(api.pages.ensureHomepageDraft);
  const generateWithAi = useAction(api.pages.generateWithAi);

  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [selectedId, setSelectedId] = useState<string>("");
  const [busy, setBusy] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMode, setAiMode] = useState<"replace" | "append">("replace");

  useEffect(() => {
    if (!selectedId) return;
    const row = pages.find((page: any) => String(page._id) === selectedId);
    if (row) setDraft(fromRow(row));
  }, [selectedId, pages]);

  const sortedBlocks = useMemo(
    () => [...draft.blocks].sort((a, b) => a.order - b.order),
    [draft.blocks],
  );

  if (role === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">در حال بارگذاری…</div>;
  }

  if (!role?.canManageSite) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-black">صفحه‌ساز فقط برای مدیر اصلی است</h1>
          <Button asChild className="mt-5"><Link to="/dashboard">بازگشت به داشبورد</Link></Button>
        </div>
      </main>
    );
  }

  const patchBlock = (id: string, patch: Partial<Block>) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    }));
  };

  const reorder = (id: string, delta: number) => {
    setDraft((current) => {
      const blocks = [...current.blocks].sort((a, b) => a.order - b.order);
      const index = blocks.findIndex((b) => b.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= blocks.length) return current;
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...current, blocks: blocks.map((b, order) => ({ ...b, order })) };
    });
  };

  const save = async () => {
    setBusy("save");
    try {
      const id = await savePage({
        id: draft.id,
        title: draft.title,
        slug: draft.slug,
        pageType: draft.pageType,
        isHomepage: draft.isHomepage,
        blocks: sortedBlocks,
        seoTitle: draft.seoTitle || undefined,
        seoDescription: draft.seoDescription || undefined,
        noIndex: draft.noIndex,
      });
      setDraft((current) => ({ ...current, id }));
      setSelectedId(String(id));
      toast.success("پیش‌نویس صفحه ذخیره شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره صفحه ناموفق بود");
    } finally {
      setBusy("");
    }
  };

  const publish = async () => {
    if (!draft.id) {
      toast.error("ابتدا پیش‌نویس را ذخیره کنید.");
      return;
    }
    setBusy("publish");
    try {
      await publishPage({ id: draft.id });
      setDraft((current) => ({ ...current, status: "published" }));
      toast.success(draft.isHomepage ? "صفحه اصلی جدید منتشر شد" : "صفحه منتشر شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "انتشار ناموفق بود");
    } finally {
      setBusy("");
    }
  };

  const generate = async () => {
    if (!aiPrompt.trim()) return;
    setBusy("ai");
    try {
      const result = await generateWithAi({ prompt: aiPrompt, pageType: draft.pageType });
      setDraft((current) => ({
        ...current,
        title: result.title || current.title,
        seoTitle: result.seoTitle || current.seoTitle,
        seoDescription: result.seoDescription || current.seoDescription,
        blocks:
          aiMode === "replace"
            ? result.blocks
            : [...current.blocks, ...result.blocks].map((block: any, order) => ({ ...block, order })),
      }));
      setTab("preview");
      toast.success("طرح AI ساخته شد؛ قبل از انتشار آن را بررسی کنید.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ساخت صفحه با AI ناموفق بود");
    } finally {
      setBusy("");
    }
  };

  const createHomepageDraft = async () => {
    setBusy("home");
    try {
      const id = await ensureHomepage({});
      setSelectedId(String(id));
      toast.success("نسخه قابل ویرایش صفحه اصلی آماده شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ساخت نسخه صفحه اصلی ناموفق بود");
    } finally {
      setBusy("");
    }
  };

  return (
    <main dir="rtl" className="min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-muted/30">
      <header className="glass border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to="/dashboard"><ArrowRight className="size-4" />داشبورد</Link>
            </Button>
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <strong>صفحه‌ساز حرفه‌ای دیوساز</strong>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <DashboardSectionNav />

      <div className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="rounded-3xl border border-border/70 bg-card p-3">
            <Button
              type="button"
              className="w-full gap-2 rounded-xl"
              onClick={() => {
                setSelectedId("");
                setDraft(emptyDraft());
                setTab("edit");
              }}
            >
              <FilePlus2 className="size-4" />
              برگه جدید
            </Button>
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full gap-2 rounded-xl"
              disabled={busy === "home"}
              onClick={() => void createHomepageDraft()}
            >
              {busy === "home" ? <Loader2 className="size-4 animate-spin" /> : <Globe2 className="size-4" />}
              ویرایش صفحه اصلی
            </Button>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-2">
            <p className="px-2 py-2 text-[10px] font-extrabold text-muted-foreground">صفحه‌ها</p>
            <div className="space-y-1">
              {pages.map((page: any) => (
                <button
                  type="button"
                  key={String(page._id)}
                  onClick={() => setSelectedId(String(page._id))}
                  className={
                    "w-full rounded-2xl p-3 text-right transition-colors " +
                    (String(page._id) === selectedId ? "bg-primary/10 text-primary" : "hover:bg-muted")
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="line-clamp-1 text-xs">{page.title}</strong>
                    {page.isHomepage && <Badge>خانه</Badge>}
                  </div>
                  <p dir="ltr" className="mt-1 truncate text-[9px] text-muted-foreground">/{page.slug}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground">{page.status === "published" ? "منتشرشده" : "پیش‌نویس"}</p>
                </button>
              ))}
              {pages.length === 0 && <p className="p-3 text-center text-[11px] text-muted-foreground">هنوز صفحه‌ای ساخته نشده است.</p>}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card p-2">
            <div className="flex gap-1">
              <Button size="sm" variant={tab === "edit" ? "default" : "ghost"} onClick={() => setTab("edit")}>ویرایش</Button>
              <Button size="sm" variant={tab === "preview" ? "default" : "ghost"} onClick={() => setTab("preview")}>پیش‌نمایش</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {draft.id && draft.status === "published" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === "unpublish"}
                  onClick={async () => {
                    setBusy("unpublish");
                    try {
                      await unpublishPage({ id: draft.id });
                      setDraft((current) => ({ ...current, status: "draft" }));
                      toast.success("صفحه از انتشار خارج شد");
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  پیش‌نویس کردن
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-1.5" disabled={busy === "save"} onClick={() => void save()}>
                {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                ذخیره
              </Button>
              <Button size="sm" className="gap-1.5" disabled={busy === "publish"} onClick={() => void publish()}>
                {busy === "publish" ? <Loader2 className="size-4 animate-spin" /> : <Globe2 className="size-4" />}
                انتشار
              </Button>
            </div>
          </div>

          {tab === "preview" ? (
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm">
              <div className="border-b border-border/60 bg-card px-4 py-2 text-[10px] font-bold text-muted-foreground">
                پیش‌نمایش پیش‌نویس — انتشار خودکار نیست
              </div>
              <SitePageRenderer page={draft as any} hideHeader />
            </div>
          ) : (
            <div className="space-y-4">
              <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="عنوان داخلی صفحه" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} />
                  <TextField label="مسیر صفحه" value={draft.slug} onChange={(v) => setDraft((d) => ({ ...d, slug: v }))} placeholder="مثلاً industrial-shahriar" />
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground">نوع صفحه</span>
                    <select value={draft.pageType} onChange={(e) => setDraft((d) => ({ ...d, pageType: e.target.value as any }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="landing">لندینگ پیج</option>
                      <option value="page">برگه معمولی</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs font-bold">
                    <input type="checkbox" checked={draft.isHomepage} onChange={(e) => setDraft((d) => ({ ...d, isHomepage: e.target.checked, pageType: e.target.checked ? "landing" : d.pageType }))} />
                    این صفحه، صفحه اصلی سایت باشد
                  </label>
                  <TextField label="SEO Title" value={draft.seoTitle} onChange={(v) => setDraft((d) => ({ ...d, seoTitle: v }))} />
                  <div className="sm:col-span-2">
                    <AreaField label="Meta Description" value={draft.seoDescription} onChange={(v) => setDraft((d) => ({ ...d, seoDescription: v }))} rows={2} />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Bot className="size-5 text-primary" />
                  <h2 className="font-black">پیشنهاد ساخت صفحه</h2>
                </div>
                <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
                  پرامپت بدهید؛ AI فقط بلوک‌های استاندارد دیوساز می‌سازد. نتیجه ابتدا پیش‌نویس است و بدون تأیید شما منتشر نمی‌شود.
                </p>
                <Textarea
                  rows={4}
                  className="mt-3"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="مثلاً یک لندینگ حرفه‌ای برای اجاره سوله در شهریار بساز؛ هیرو کوتاه، ویترین آگهی، مزایا و CTA داشته باشد…"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select value={aiMode} onChange={(e) => setAiMode(e.target.value as any)} className="h-10 rounded-xl border border-input bg-background px-3 text-xs">
                    <option value="replace">جایگزینی کل سکشن‌ها</option>
                    <option value="append">اضافه‌کردن به انتهای صفحه</option>
                  </select>
                  <Button type="button" className="gap-2" disabled={busy === "ai" || !aiPrompt.trim()} onClick={() => void generate()}>
                    {busy === "ai" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    ساخت با AI
                  </Button>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-black">سکشن‌های صفحه</h2>
                    <p className="text-[10px] text-muted-foreground">ترتیب بالا به پایین است.</p>
                  </div>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const block = newBlock(e.target.value);
                      setDraft((current) => ({
                        ...current,
                        blocks: [...current.blocks, { ...block, order: current.blocks.length }],
                      }));
                      e.target.value = "";
                    }}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold"
                  >
                    <option value="">+ افزودن سکشن</option>
                    {Object.entries(BLOCK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                {sortedBlocks.map((block, index) => (
                  <article key={block.id} className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{(index + 1).toLocaleString("fa-IR")}</Badge>
                        <strong className="text-sm">{BLOCK_LABELS[block.type] || block.type}</strong>
                        {!block.enabled && <Badge variant="outline">مخفی</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="size-8" disabled={index === 0} onClick={() => reorder(block.id, -1)}><ArrowUp className="size-4" /></Button>
                        <Button size="icon" variant="ghost" className="size-8" disabled={index === sortedBlocks.length - 1} onClick={() => reorder(block.id, 1)}><ArrowDown className="size-4" /></Button>
                        <Button size="icon" variant="ghost" className="size-8" onClick={() => patchBlock(block.id, { enabled: !block.enabled })}>
                          {block.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              blocks: [
                                ...current.blocks,
                                { ...block, id: blockId(), order: current.blocks.length, props: JSON.parse(JSON.stringify(block.props)) },
                              ],
                            }))
                          }
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              blocks: current.blocks.filter((item) => item.id !== block.id).map((item, order) => ({ ...item, order })),
                            }))
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <BlockPropsEditor block={block} onChange={(props) => patchBlock(block.id, { props })} />
                  </article>
                ))}
              </section>

              {draft.id && (
                <section className="flex flex-wrap gap-2 rounded-3xl border border-border/70 bg-card p-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      const id = await duplicatePage({ id: draft.id });
                      setSelectedId(String(id));
                      toast.success("یک کپی به‌صورت پیش‌نویس ساخته شد");
                    }}
                  >
                    <Copy className="size-4" />کپی صفحه
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 text-destructive"
                    onClick={async () => {
                      if (!confirm("این صفحه حذف شود؟")) return;
                      await deletePage({ id: draft.id });
                      setSelectedId("");
                      setDraft(emptyDraft());
                      toast.success("صفحه حذف شد");
                    }}
                  >
                    <Trash2 className="size-4" />حذف صفحه
                  </Button>
                  {draft.status === "published" && !draft.isHomepage && (
                    <Button asChild variant="outline" className="gap-2">
                      <a href={"/p/" + draft.slug} target="_blank" rel="noreferrer">
                        <Eye className="size-4" />مشاهده صفحه منتشرشده
                      </a>
                    </Button>
                  )}
                </section>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
