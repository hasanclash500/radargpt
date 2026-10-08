import DashboardSectionNav from "@/components/dashboard/DashboardSectionNav";
import MediaLibraryDialog, {
  type SiteMediaItem,
} from "@/components/pages/MediaLibraryDialog";
import SitePageRenderer from "@/components/pages/SitePageRenderer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  Bot,
  Braces,
  Code2,
  Copy,
  Eye,
  FilePlus2,
  GripVertical,
  ImagePlus,
  Layers3,
  Loader2,
  Monitor,
  Paintbrush,
  Plus,
  Save,
  Search,
  Settings2,
  Smartphone,
  Sparkles,
  SquareDashed,
  Tablet,
  Trash2,
  Type,
  Upload,
  WandSparkles,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type Device = "desktop" | "tablet" | "mobile";

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
  seoKeywords: string[];
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  noIndex: boolean;
  settings: Record<string, any>;
};

type MediaTarget =
  | { type: "blockImage"; blockId: string; key: string }
  | { type: "background"; blockId: string }
  | { type: "customHtmlImage"; blockId: string; elementIndex: number }
  | { type: "ogImage" }
  | { type: "font" }
  | { type: "browse" }
  | null;

const BLOCKS = [
  { type: "hero", label: "هیرو", note: "عنوان، عکس و CTA اصلی" },
  { type: "intentHub", label: "انتخاب مسیر", note: "خرید، اجاره، فروش" },
  { type: "listings", label: "ویترین آگهی", note: "فایل‌های واقعی دیوساز" },
  { type: "services", label: "خدمات", note: "کارت‌های خدمات" },
  { type: "split", label: "تصویر + متن", note: "دو ستون منعطف" },
  { type: "richText", label: "متن آزاد", note: "عنوان و متن" },
  { type: "cta", label: "دعوت به اقدام", note: "دکمه و پیام" },
  { type: "contact", label: "تماس", note: "شماره و مسیر" },
  { type: "heading", label: "عنوان", note: "H1 / H2 / H3 و متن کوتاه" },
  { type: "image", label: "تصویر", note: "تصویر مستقل از Media Library" },
  { type: "button", label: "دکمه", note: "دکمه مستقل با لینک" },
  { type: "spacer", label: "فاصله", note: "فاصله مستقل در هر دستگاه" },
  { type: "divider", label: "جداکننده", note: "خط جداکننده قابل تنظیم" },
  { type: "container", label: "کانتینر", note: "سکشن تو‌در‌تو با ستون و فرزند" },
  { type: "customHtml", label: "HTML / CSS", note: "کد آماده قابل ویرایش گرافیکی" },
] as const;

const BLOCK_LABELS = Object.fromEntries(
  BLOCKS.map((item) => [item.type, item.label]),
) as Record<string, string>;

const SECTION_PRESETS = [
  {
    id: "hero-modern",
    title: "هیرو حرفه‌ای",
    description: "عنوان اصلی، توضیح، دو CTA و تصویر",
    types: ["hero"],
  },
  {
    id: "property-search",
    title: "جستجو و انتخاب مسیر",
    description: "می‌خرم، اجاره می‌کنم، می‌فروشم و اجاره می‌دهم",
    types: ["intentHub"],
  },
  {
    id: "featured-listings",
    title: "آگهی‌های منتخب",
    description: "ویترین آگهی‌های واقعی منتشرشده دیوساز",
    types: ["listings"],
  },
  {
    id: "services",
    title: "خدمات دیوساز",
    description: "کارت‌های خدمات املاک صنعتی و اداری",
    types: ["services"],
  },
  {
    id: "about-split",
    title: "معرفی تصویر + متن",
    description: "سکشن دو ستونه برای معرفی برند یا خدمات",
    types: ["split"],
  },
  {
    id: "seo-text",
    title: "متن سئو",
    description: "بخش متنی مناسب توضیحات و محتوای سئو",
    types: ["richText"],
  },
  {
    id: "call-to-action",
    title: "دعوت به اقدام",
    description: "CTA برای تماس، ثبت تقاضا یا مشاهده آگهی",
    types: ["cta"],
  },
  {
    id: "contact",
    title: "تماس و مسیریابی",
    description: "شماره دفتر، آدرس و دکمه مسیریابی",
    types: ["contact"],
  },
  {
    id: "complete-landing",
    title: "لندینگ کامل دیوساز",
    description: "هیرو + مسیرها + آگهی + خدمات + CTA + تماس",
    types: ["hero", "intentHub", "listings", "services", "cta", "contact"],
  },
] as const;

function id() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function defaultResponsive() {
  return {
    widthPercent: 100,
    maxWidth: 0,
    minHeight: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    marginTop: 0,
    marginBottom: 0,
    translateX: 0,
    translateY: 0,
    titleSize: 0,
    bodySize: 0,
    titleWeight: 0,
    bodyWeight: 0,
    titleLineHeight: 0,
    bodyLineHeight: 0,
    textAlign: "start",
  };
}

function defaultDesign() {
  return {
    backgroundColor: "",
    backgroundImage: "",
    backgroundSize: "cover",
    backgroundPosition: "center",
    textColor: "",
    borderColor: "",
    borderWidth: 0,
    radius: 0,
    shadow: "none",
    opacity: 1,
    position: "relative",
    stickyTop: 0,
    zIndex: 0,
    animation: "none",
    animationDuration: 550,
    desktop: defaultResponsive(),
    tablet: defaultResponsive(),
    mobile: defaultResponsive(),
  };
}

function defaultProps(type: string): Record<string, any> {
  const design = defaultDesign();
  if (type === "hero")
    return {
      eyebrow: "دیوساز",
      title: "عنوان اصلی صفحه",
      highlight: "تیتر برجسته",
      text: "توضیح کوتاه و واضح برای این صفحه.",
      primaryLabel: "مشاهده آگهی‌ها",
      primaryHref: "/listings",
      secondaryLabel: "ثبت تقاضا",
      secondaryHref: "/request",
      imageUrl: "",
      imageAlt: "",
      imagePosition: "end",
      design,
    };
  if (type === "intentHub")
    return {
      title: "چه کاری می‌خواهید انجام دهید؟",
      text: "مسیر مناسب را انتخاب کنید.",
      propertyTypes: [
        "سوله",
        "کارخانه",
        "کارگاه",
        "انبار",
        "زمین صنعتی",
        "دفتر اداری",
      ],
      design,
    };
  if (type === "listings")
    return {
      eyebrow: "فایل‌های منتخب",
      title: "ویترین آگهی‌های دیوساز",
      text: "",
      limit: 8,
      design,
    };
  if (type === "services")
    return {
      title: "خدمات دیوساز",
      text: "",
      items: [
        { title: "املاک صنعتی", text: "سوله، کارخانه، کارگاه و انبار." },
        { title: "املاک اداری", text: "دفتر و فضای اداری." },
      ],
      design,
    };
  if (type === "split")
    return {
      eyebrow: "",
      title: "عنوان سکشن",
      text: "توضیحات سکشن",
      buttonLabel: "بیشتر بدانید",
      buttonHref: "/listings",
      imageUrl: "",
      imageAlt: "",
      imagePosition: "end",
      design,
    };
  if (type === "richText")
    return {
      eyebrow: "",
      title: "عنوان",
      body: "متن این بخش را بنویسید.",
      align: "start",
      design,
    };
  if (type === "cta")
    return {
      title: "آماده شروع هستید؟",
      text: "از مسیر مناسب ادامه دهید.",
      primaryLabel: "مشاهده آگهی‌ها",
      primaryHref: "/listings",
      secondaryLabel: "تماس با دیوساز",
      secondaryHref: "tel:09120858095",
      design,
    };
  if (type === "heading")
    return {
      eyebrow: "",
      title: "عنوان جدید",
      text: "",
      tag: "h2",
      align: "start",
      design,
    };
  if (type === "image")
    return {
      imageUrl: "",
      imageAlt: "",
      caption: "",
      objectFit: "contain",
      design,
    };
  if (type === "button")
    return {
      label: "دکمه",
      href: "#",
      variant: "default",
      size: "default",
      align: "start",
      design,
    };
  if (type === "spacer")
    return {
      heightDesktop: 80,
      heightTablet: 64,
      heightMobile: 48,
      design,
    };
  if (type === "divider")
    return {
      widthPercent: 100,
      thickness: 1,
      color: "#cbd5e1",
      design,
    };
  if (type === "container")
    return {
      columns: 1,
      gap: 16,
      children: [],
      design,
    };
  if (type === "customHtml")
    return {
      html: '<section class="custom-section"><h2>عنوان سکشن</h2><p>متن سکشن را ویرایش کنید.</p><a href="/listings">مشاهده آگهی‌ها</a></section>',
      css: '.custom-section{padding:48px 24px;border-radius:24px;background:#fff}.custom-section h2{font-size:32px;font-weight:800}.custom-section p{margin-top:12px;line-height:2}.custom-section a{display:inline-block;margin-top:20px;padding:12px 18px;border-radius:12px;background:#0b3b66;color:white;text-decoration:none}',
      design,
    };
  return {
    title: "ارتباط با دیوساز",
    text: "برای مشاوره با دفتر تماس بگیرید.",
    phone: "09120858095",
    address: "شهریار، روبروی شهرک اداری، مجتمع تجاری اداری شهریار",
    mapLocation: "جاده شهریار–شهدای اندیشه",
    mapUrl: "https://nshn.ir/2bveXP_xCgqA",
    design,
  };
}

function newBlock(type: string): Block {
  return {
    id: id(),
    type,
    enabled: true,
    order: 0,
    props: defaultProps(type),
  };
}

function normalizeBlock(block: Block): Block {
  const props = block.props || {};
  const normalizedProps: Record<string, any> = {
    ...props,
    design: {
      ...defaultDesign(),
      ...(props.design || {}),
      desktop: {
        ...defaultResponsive(),
        ...(props.design?.desktop || {}),
      },
      tablet: {
        ...defaultResponsive(),
        ...(props.design?.tablet || {}),
      },
      mobile: {
        ...defaultResponsive(),
        ...(props.design?.mobile || {}),
      },
    },
  };

  if (block.type === "container") {
    normalizedProps.children = Array.isArray(props.children)
      ? props.children
          .map((child: Block, index: number) => ({
            ...normalizeBlock(child),
            order: index,
          }))
      : [];
  }

  return {
    ...block,
    props: normalizedProps,
  };
}

function findBlockInTree(blocks: Block[], blockId: string): Block | null {
  for (const block of blocks) {
    if (block.id === blockId) return block;
    if (block.type === "container" && Array.isArray(block.props?.children)) {
      const found = findBlockInTree(block.props.children, blockId);
      if (found) return found;
    }
  }
  return null;
}

function updateBlockInTree(
  blocks: Block[],
  blockId: string,
  updater: (block: Block) => Block,
): Block[] {
  return blocks.map((block) => {
    if (block.id === blockId) return updater(block);
    if (block.type === "container" && Array.isArray(block.props?.children)) {
      return {
        ...block,
        props: {
          ...block.props,
          children: updateBlockInTree(block.props.children, blockId, updater),
        },
      };
    }
    return block;
  });
}

function removeBlockFromTree(blocks: Block[], blockId: string): Block[] {
  return blocks
    .filter((block) => block.id !== blockId)
    .map((block) => {
      if (block.type === "container" && Array.isArray(block.props?.children)) {
        return {
          ...block,
          props: {
            ...block.props,
            children: removeBlockFromTree(block.props.children, blockId).map(
              (child, order) => ({ ...child, order }),
            ),
          },
        };
      }
      return block;
    })
    .map((block, order) => ({ ...block, order }));
}

function flattenBlocks(blocks: Block[], depth = 0): Array<{ block: Block; depth: number }> {
  const result: Array<{ block: Block; depth: number }> = [];
  for (const block of [...blocks].sort((a, b) => a.order - b.order)) {
    result.push({ block, depth });
    if (block.type === "container" && Array.isArray(block.props?.children)) {
      result.push(...flattenBlocks(block.props.children, depth + 1));
    }
  }
  return result;
}

function appendBlockToContainer(
  blocks: Block[],
  containerId: string,
  child: Block,
): Block[] {
  return updateBlockInTree(blocks, containerId, (container) => {
    if (container.type !== "container") return container;
    const children = Array.isArray(container.props?.children)
      ? container.props.children
      : [];
    return {
      ...container,
      props: {
        ...container.props,
        children: [...children, { ...child, order: children.length }],
      },
    };
  });
}

function editableHtmlElements(html: string) {
  if (typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const nodes = Array.from(
    doc.body.querySelectorAll("h1,h2,h3,h4,p,a,button,img"),
  ).slice(0, 80);
  return nodes.map((node, index) => {
    const tag = node.tagName.toLowerCase();
    return {
      index,
      tag,
      text: tag === "img" ? "" : node.textContent || "",
      href: tag === "a" ? node.getAttribute("href") || "" : "",
      src: tag === "img" ? node.getAttribute("src") || "" : "",
      alt: tag === "img" ? node.getAttribute("alt") || "" : "",
    };
  });
}

function updateHtmlElement(
  html: string,
  elementIndex: number,
  patch: { text?: string; href?: string; src?: string; alt?: string },
) {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const nodes = Array.from(
    doc.body.querySelectorAll("h1,h2,h3,h4,p,a,button,img"),
  ).slice(0, 80);
  const node = nodes[elementIndex];
  if (!node) return html;

  if (patch.text !== undefined && node.tagName.toLowerCase() !== "img") {
    node.textContent = patch.text;
  }
  if (patch.href !== undefined && node.tagName.toLowerCase() === "a") {
    node.setAttribute("href", patch.href);
  }
  if (patch.src !== undefined && node.tagName.toLowerCase() === "img") {
    node.setAttribute("src", patch.src);
  }
  if (patch.alt !== undefined && node.tagName.toLowerCase() === "img") {
    node.setAttribute("alt", patch.alt);
  }
  return doc.body.innerHTML;
}

function importHtmlSections(html: string, css: string) {
  if (typeof window === "undefined") return [] as Block[];
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const embeddedCss = Array.from(doc.querySelectorAll("style"))
    .map((style) => style.textContent || "")
    .join("\n");
  doc.querySelectorAll("style,script,link,meta,base").forEach((node) => node.remove());

  let candidates = Array.from(doc.body.children);
  if (
    candidates.length === 1 &&
    ["main", "div"].includes(candidates[0].tagName.toLowerCase()) &&
    candidates[0].children.length > 1
  ) {
    candidates = Array.from(candidates[0].children);
  }

  if (!candidates.length && doc.body.innerHTML.trim()) {
    candidates = [doc.body];
  }

  const mergedCss = [embeddedCss, css].filter(Boolean).join("\n");
  return candidates.slice(0, 40).map((element, order) => ({
    id: id(),
    type: "customHtml",
    enabled: true,
    order,
    props: {
      html:
        element === doc.body
          ? doc.body.innerHTML
          : (element as HTMLElement).outerHTML,
      css: mergedCss,
      design: defaultDesign(),
    },
  }));
}

function emptyDraft(): Draft {
  return {
    title: "صفحه جدید",
    slug: "",
    pageType: "page",
    status: "draft",
    isHomepage: false,
    blocks: [],
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    noIndex: false,
    settings: {
      backgroundColor: "#ffffff",
      textColor: "#0f172a",
      baseFontSize: 16,
      customFontFamily: "Vazirmatn",
      customFontUrl: "",
      showHeader: false,
      showStories: false,
      showBrandStory: false,
    },
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
    blocks: [...(row.blocks ?? [])]
      .sort((a, b) => a.order - b.order)
      .map(normalizeBlock),
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    seoKeywords: row.seoKeywords ?? [],
    canonicalUrl: row.canonicalUrl ?? "",
    ogTitle: row.ogTitle ?? "",
    ogDescription: row.ogDescription ?? "",
    ogImage: row.ogImage ?? "",
    noIndex: Boolean(row.noIndex),
    settings: {
      backgroundColor: "#ffffff",
      textColor: "#0f172a",
      baseFontSize: 16,
      customFontFamily: "Vazirmatn",
      customFontUrl: "",
      showHeader: true,
      showStories: true,
      showBrandStory: true,
      ...(row.settings || {}),
    },
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black text-muted-foreground">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Area({
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
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black text-muted-foreground">
        {label}
      </span>
      <Textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-xs"
      >
        {children}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = -500,
  max = 2200,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black text-muted-foreground">
        {label}
      </span>
      <Input
        type="number"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black text-muted-foreground">
        {label}
      </span>
      <div className="flex gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
        />
        <Input
          dir="ltr"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#ffffff"
          className="min-w-0 flex-1"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
          >
            پاک
          </Button>
        )}
      </div>
    </label>
  );
}

function SeoScore({ draft }: { draft: Draft }) {
  const title = draft.seoTitle || draft.title;
  const description = draft.seoDescription;
  const keyword = draft.seoKeywords[0] || "";
  const checks = [
    title.length >= 30 && title.length <= 65,
    description.length >= 100 && description.length <= 170,
    Boolean(keyword),
    Boolean(draft.ogImage),
    draft.isHomepage || Boolean(draft.slug),
  ];
  const score = Math.round(
    (checks.filter(Boolean).length / checks.length) * 100,
  );
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <strong className="text-xs">امتیاز پایه SEO</strong>
        <span
          className={
            "text-sm font-black " +
            (score >= 80
              ? "text-emerald-600"
              : score >= 60
                ? "text-amber-600"
                : "text-rose-600")
          }
        >
          {score}/100
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: score + "%" }}
        />
      </div>
    </div>
  );
}

function BlockContentEditor({
  block,
  patchProps,
  chooseImage,
}: {
  block: Block;
  patchProps: (props: Record<string, any>) => void;
  chooseImage: (key: string) => void;
}) {
  const p = block.props || {};
  const set = (key: string, value: any) =>
    patchProps({ ...p, [key]: value });

  if (block.type === "hero") {
    return (
      <div className="grid gap-3">
        <Field label="بالانویس" value={p.eyebrow || ""} onChange={(v) => set("eyebrow", v)} />
        <Field label="عنوان اصلی" value={p.title || ""} onChange={(v) => set("title", v)} />
        <Field label="تیتر برجسته" value={p.highlight || ""} onChange={(v) => set("highlight", v)} />
        <Area label="توضیحات" value={p.text || ""} onChange={(v) => set("text", v)} rows={3} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="دکمه اصلی" value={p.primaryLabel || ""} onChange={(v) => set("primaryLabel", v)} />
          <Field label="لینک" value={p.primaryHref || ""} onChange={(v) => set("primaryHref", v)} />
          <Field label="دکمه دوم" value={p.secondaryLabel || ""} onChange={(v) => set("secondaryLabel", v)} />
          <Field label="لینک دوم" value={p.secondaryHref || ""} onChange={(v) => set("secondaryHref", v)} />
        </div>
        <div className="rounded-2xl border border-border/70 p-3">
          <span className="text-[10px] font-black text-muted-foreground">تصویر هیرو</span>
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.imageAlt || ""}
              className="mt-2 h-32 w-full rounded-xl bg-muted object-contain"
            />
          ) : null}
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => chooseImage("imageUrl")}>
              <ImagePlus className="size-4" />
              انتخاب تصویر
            </Button>
            {p.imageUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => set("imageUrl", "")}>حذف</Button>
            )}
          </div>
          <Field label="Alt تصویر" value={p.imageAlt || ""} onChange={(v) => set("imageAlt", v)} />
          <SelectField label="جای تصویر" value={p.imagePosition || "end"} onChange={(v) => set("imagePosition", v)}>
            <option value="end">سمت دوم</option>
            <option value="start">سمت اول</option>
          </SelectField>
        </div>
      </div>
    );
  }

  if (block.type === "intentHub") {
    return (
      <div className="grid gap-3">
        <Field label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <Area label="توضیح" value={p.text || ""} onChange={(v) => set("text", v)} rows={2} />
        <Area
          label="انواع ملک - هر مورد یک خط"
          value={(p.propertyTypes || []).join("\n")}
          onChange={(v) =>
            set(
              "propertyTypes",
              v.split("\n").map((x) => x.trim()).filter(Boolean),
            )
          }
          rows={7}
        />
      </div>
    );
  }

  if (block.type === "listings") {
    return (
      <div className="grid gap-3">
        <Field label="بالانویس" value={p.eyebrow || ""} onChange={(v) => set("eyebrow", v)} />
        <Field label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <Area label="توضیح" value={p.text || ""} onChange={(v) => set("text", v)} rows={2} />
        <NumberField label="تعداد آگهی" value={Number(p.limit ?? 8)} min={1} max={12} onChange={(v) => set("limit", v)} />
      </div>
    );
  }

  if (block.type === "services") {
    const items = Array.isArray(p.items) ? p.items : [];
    return (
      <div className="grid gap-3">
        <Field label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <Area label="توضیح" value={p.text || ""} onChange={(v) => set("text", v)} rows={2} />
        <Area
          label="هر خط: عنوان | توضیح"
          value={items
            .map((item: any) => `${item.title || ""} | ${item.text || ""}`)
            .join("\n")}
          onChange={(value) =>
            set(
              "items",
              value
                .split("\n")
                .filter(Boolean)
                .map((line) => {
                  const [title, ...rest] = line.split("|");
                  return {
                    title: title.trim(),
                    text: rest.join("|").trim(),
                  };
                }),
            )
          }
          rows={8}
        />
      </div>
    );
  }

  if (block.type === "split") {
    return (
      <div className="grid gap-3">
        <Field label="بالانویس" value={p.eyebrow || ""} onChange={(v) => set("eyebrow", v)} />
        <Field label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <Area label="متن" value={p.text || ""} onChange={(v) => set("text", v)} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="متن دکمه" value={p.buttonLabel || ""} onChange={(v) => set("buttonLabel", v)} />
          <Field label="لینک دکمه" value={p.buttonHref || ""} onChange={(v) => set("buttonHref", v)} />
        </div>
        {p.imageUrl && (
          <img src={p.imageUrl} alt={p.imageAlt || ""} className="h-32 w-full rounded-xl bg-muted object-contain" />
        )}
        <Button type="button" variant="outline" className="gap-2" onClick={() => chooseImage("imageUrl")}>
          <ImagePlus className="size-4" />
          انتخاب / تغییر تصویر
        </Button>
        <Field label="Alt تصویر" value={p.imageAlt || ""} onChange={(v) => set("imageAlt", v)} />
        <SelectField label="جای تصویر" value={p.imagePosition || "end"} onChange={(v) => set("imagePosition", v)}>
          <option value="end">سمت دوم</option>
          <option value="start">سمت اول</option>
        </SelectField>
      </div>
    );
  }

  if (block.type === "richText") {
    return (
      <div className="grid gap-3">
        <Field label="بالانویس" value={p.eyebrow || ""} onChange={(v) => set("eyebrow", v)} />
        <Field label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <Area label="متن" value={p.body || ""} onChange={(v) => set("body", v)} rows={10} />
        <SelectField label="چینش" value={p.align || "start"} onChange={(v) => set("align", v)}>
          <option value="start">راست</option>
          <option value="center">وسط</option>
        </SelectField>
      </div>
    );
  }

  if (block.type === "cta") {
    return (
      <div className="grid gap-3">
        <Field label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <Area label="توضیح" value={p.text || ""} onChange={(v) => set("text", v)} rows={3} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="دکمه اصلی" value={p.primaryLabel || ""} onChange={(v) => set("primaryLabel", v)} />
          <Field label="لینک" value={p.primaryHref || ""} onChange={(v) => set("primaryHref", v)} />
          <Field label="دکمه دوم" value={p.secondaryLabel || ""} onChange={(v) => set("secondaryLabel", v)} />
          <Field label="لینک دوم" value={p.secondaryHref || ""} onChange={(v) => set("secondaryHref", v)} />
        </div>
      </div>
    );
  }

  if (block.type === "heading") {
    return (
      <div className="grid gap-3">
        <Field label="بالانویس" value={p.eyebrow || ""} onChange={(v) => set("eyebrow", v)} />
        <Field label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
        <Area label="متن زیر عنوان" value={p.text || ""} onChange={(v) => set("text", v)} rows={4} />
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="تگ HTML" value={p.tag || "h2"} onChange={(v) => set("tag", v)}>
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
          </SelectField>
          <SelectField label="چینش" value={p.align || "start"} onChange={(v) => set("align", v)}>
            <option value="start">راست</option>
            <option value="center">وسط</option>
            <option value="end">چپ</option>
          </SelectField>
        </div>
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="grid gap-3">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.imageAlt || ""}
            className="h-44 w-full rounded-2xl bg-muted object-contain"
          />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
            هنوز تصویری انتخاب نشده
          </div>
        )}
        <Button type="button" variant="outline" className="gap-2" onClick={() => chooseImage("imageUrl")}>
          <ImagePlus className="size-4" />
          انتخاب تصویر
        </Button>
        <Field label="Alt تصویر" value={p.imageAlt || ""} onChange={(v) => set("imageAlt", v)} />
        <Field label="Caption" value={p.caption || ""} onChange={(v) => set("caption", v)} />
        <SelectField label="نحوه نمایش" value={p.objectFit || "contain"} onChange={(v) => set("objectFit", v)}>
          <option value="contain">بدون برش</option>
          <option value="cover">پر کردن کادر</option>
          <option value="fill">کشیده در کادر</option>
        </SelectField>
      </div>
    );
  }

  if (block.type === "button") {
    return (
      <div className="grid gap-3">
        <Field label="متن دکمه" value={p.label || ""} onChange={(v) => set("label", v)} />
        <Field label="لینک" value={p.href || ""} onChange={(v) => set("href", v)} />
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="استایل" value={p.variant || "default"} onChange={(v) => set("variant", v)}>
            <option value="default">اصلی</option>
            <option value="outline">دورخط</option>
            <option value="secondary">ثانویه</option>
          </SelectField>
          <SelectField label="اندازه" value={p.size || "default"} onChange={(v) => set("size", v)}>
            <option value="sm">کوچک</option>
            <option value="default">معمولی</option>
            <option value="lg">بزرگ</option>
          </SelectField>
        </div>
        <SelectField label="چینش" value={p.align || "start"} onChange={(v) => set("align", v)}>
          <option value="start">راست</option>
          <option value="center">وسط</option>
          <option value="end">چپ</option>
        </SelectField>
      </div>
    );
  }

  if (block.type === "spacer") {
    return (
      <div className="grid gap-3">
        <p className="text-[10px] leading-5 text-muted-foreground">
          ارتفاع فاصله را برای هر دستگاه جدا تنظیم کن.
        </p>
        <NumberField label="دسکتاپ" value={Number(p.heightDesktop || 80)} min={0} max={500} onChange={(v) => set("heightDesktop", v)} />
        <NumberField label="تبلت" value={Number(p.heightTablet || 64)} min={0} max={500} onChange={(v) => set("heightTablet", v)} />
        <NumberField label="موبایل" value={Number(p.heightMobile || 48)} min={0} max={500} onChange={(v) => set("heightMobile", v)} />
      </div>
    );
  }

  if (block.type === "divider") {
    return (
      <div className="grid gap-3">
        <NumberField label="عرض %" value={Number(p.widthPercent || 100)} min={10} max={100} onChange={(v) => set("widthPercent", v)} />
        <NumberField label="ضخامت" value={Number(p.thickness || 1)} min={1} max={12} onChange={(v) => set("thickness", v)} />
        <ColorField label="رنگ خط" value={p.color || "#cbd5e1"} onChange={(v) => set("color", v)} />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <Field label="عنوان" value={p.title || ""} onChange={(v) => set("title", v)} />
      <Area label="توضیح" value={p.text || ""} onChange={(v) => set("text", v)} rows={3} />
      <Field label="شماره تماس" value={p.phone || ""} onChange={(v) => set("phone", v)} />
      <Field label="آدرس دفتر" value={p.address || ""} onChange={(v) => set("address", v)} />
      <Field label="عنوان موقعیت" value={p.mapLocation || ""} onChange={(v) => set("mapLocation", v)} />
      <Field label="لینک نشان" value={p.mapUrl || ""} onChange={(v) => set("mapUrl", v)} />
    </div>
  );
}

function StyleEditor({
  block,
  device,
  patchProps,
  chooseBackground,
}: {
  block: Block;
  device: Device;
  patchProps: (props: Record<string, any>) => void;
  chooseBackground: () => void;
}) {
  const p = block.props || {};
  const design = {
    ...defaultDesign(),
    ...(p.design || {}),
    [device]: {
      ...defaultResponsive(),
      ...(p.design?.[device] || {}),
    },
  };
  const responsive = design[device];
  const setDesign = (key: string, value: any) =>
    patchProps({ ...p, design: { ...design, [key]: value } });
  const setResponsive = (key: string, value: any) =>
    patchProps({
      ...p,
      design: {
        ...design,
        [device]: { ...responsive, [key]: value },
      },
    });

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border/70 p-3">
        <strong className="text-xs">پس‌زمینه و قاب</strong>
        <div className="mt-3 grid gap-3">
          <ColorField label="رنگ پس‌زمینه" value={design.backgroundColor || ""} onChange={(v) => setDesign("backgroundColor", v)} />
          {design.backgroundImage ? (
            <img src={design.backgroundImage} alt="" className="h-24 w-full rounded-xl bg-muted object-contain" />
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={chooseBackground}>
              <ImagePlus className="size-4" />
              تصویر پس‌زمینه
            </Button>
            {design.backgroundImage && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setDesign("backgroundImage", "")}>حذف</Button>
            )}
          </div>
          <ColorField label="رنگ متن" value={design.textColor || ""} onChange={(v) => setDesign("textColor", v)} />
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="گردی گوشه" value={Number(design.radius || 0)} min={0} max={120} onChange={(v) => setDesign("radius", v)} />
            <NumberField label="ضخامت کادر" value={Number(design.borderWidth || 0)} min={0} max={20} onChange={(v) => setDesign("borderWidth", v)} />
          </div>
          <ColorField label="رنگ کادر" value={design.borderColor || ""} onChange={(v) => setDesign("borderColor", v)} />
          <SelectField label="سایه" value={design.shadow || "none"} onChange={(v) => setDesign("shadow", v)}>
            <option value="none">بدون سایه</option>
            <option value="sm">کم</option>
            <option value="md">متوسط</option>
            <option value="lg">زیاد</option>
            <option value="xl">خیلی زیاد</option>
          </SelectField>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/[0.025] p-3">
        <div className="flex items-center justify-between">
          <strong className="text-xs">Responsive: {device === "desktop" ? "دسکتاپ" : device === "tablet" ? "تبلت" : "موبایل"}</strong>
          <span className="text-[9px] text-muted-foreground">مقادیر px</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <NumberField label="عرض %" value={Number(responsive.widthPercent ?? 100)} min={10} max={100} onChange={(v) => setResponsive("widthPercent", v)} />
          <NumberField label="حداکثر عرض" value={Number(responsive.maxWidth || 0)} min={0} max={2200} onChange={(v) => setResponsive("maxWidth", v)} />
          <NumberField label="حداقل ارتفاع" value={Number(responsive.minHeight || 0)} min={0} max={1600} onChange={(v) => setResponsive("minHeight", v)} />
          <SelectField label="تراز متن" value={responsive.textAlign || "start"} onChange={(v) => setResponsive("textAlign", v)}>
            <option value="start">راست</option>
            <option value="center">وسط</option>
            <option value="end">چپ</option>
          </SelectField>
          <NumberField label="Padding بالا" value={Number(responsive.paddingTop || 0)} min={0} max={400} onChange={(v) => setResponsive("paddingTop", v)} />
          <NumberField label="Padding پایین" value={Number(responsive.paddingBottom || 0)} min={0} max={400} onChange={(v) => setResponsive("paddingBottom", v)} />
          <NumberField label="Padding راست" value={Number(responsive.paddingRight || 0)} min={0} max={400} onChange={(v) => setResponsive("paddingRight", v)} />
          <NumberField label="Padding چپ" value={Number(responsive.paddingLeft || 0)} min={0} max={400} onChange={(v) => setResponsive("paddingLeft", v)} />
          <NumberField label="Margin بالا" value={Number(responsive.marginTop || 0)} min={-300} max={400} onChange={(v) => setResponsive("marginTop", v)} />
          <NumberField label="Margin پایین" value={Number(responsive.marginBottom || 0)} min={-300} max={400} onChange={(v) => setResponsive("marginBottom", v)} />
          <NumberField label="حرکت افقی" value={Number(responsive.translateX || 0)} min={-500} max={500} onChange={(v) => setResponsive("translateX", v)} />
          <NumberField label="حرکت عمودی" value={Number(responsive.translateY || 0)} min={-500} max={500} onChange={(v) => setResponsive("translateY", v)} />
          <NumberField label="اندازه تیتر" value={Number(responsive.titleSize || 0)} min={0} max={120} onChange={(v) => setResponsive("titleSize", v)} />
          <NumberField label="اندازه متن" value={Number(responsive.bodySize || 0)} min={0} max={48} onChange={(v) => setResponsive("bodySize", v)} />
          <NumberField label="وزن تیتر" value={Number(responsive.titleWeight || 0)} min={0} max={900} onChange={(v) => setResponsive("titleWeight", v)} />
          <NumberField label="وزن متن" value={Number(responsive.bodyWeight || 0)} min={0} max={900} onChange={(v) => setResponsive("bodyWeight", v)} />
          <NumberField label="Line-height تیتر" value={Number(responsive.titleLineHeight || 0)} min={0} max={120} onChange={(v) => setResponsive("titleLineHeight", v)} />
          <NumberField label="Line-height متن" value={Number(responsive.bodyLineHeight || 0)} min={0} max={100} onChange={(v) => setResponsive("bodyLineHeight", v)} />
        </div>
      </div>
    </div>
  );
}

function AdvancedEditor({
  block,
  patchProps,
}: {
  block: Block;
  patchProps: (props: Record<string, any>) => void;
}) {
  const p = block.props || {};
  const design = { ...defaultDesign(), ...(p.design || {}) };
  const set = (key: string, value: any) =>
    patchProps({ ...p, design: { ...design, [key]: value } });

  return (
    <div className="grid gap-3">
      <SelectField label="موقعیت" value={design.position || "relative"} onChange={(v) => set("position", v)}>
        <option value="relative">عادی</option>
        <option value="sticky">چسبان هنگام اسکرول</option>
      </SelectField>
      {design.position === "sticky" && (
        <NumberField label="فاصله Sticky از بالا" value={Number(design.stickyTop || 0)} min={0} max={300} onChange={(v) => set("stickyTop", v)} />
      )}
      <NumberField label="Z-index" value={Number(design.zIndex || 0)} min={0} max={100} onChange={(v) => set("zIndex", v)} />
      <SelectField label="انیمیشن ورود" value={design.animation || "none"} onChange={(v) => set("animation", v)}>
        <option value="none">بدون حرکت</option>
        <option value="fade">Fade</option>
        <option value="fadeUp">Fade Up</option>
        <option value="slideRight">Slide Right</option>
        <option value="slideLeft">Slide Left</option>
        <option value="zoom">Zoom</option>
      </SelectField>
      <NumberField label="مدت انیمیشن (ms)" value={Number(design.animationDuration || 550)} min={150} max={3000} onChange={(v) => set("animationDuration", v)} />
      <label className="grid gap-1.5">
        <span className="text-[10px] font-black text-muted-foreground">شفافیت</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={Number(design.opacity ?? 1)}
          onChange={(event) => set("opacity", Number(event.target.value))}
        />
        <span className="text-[10px] text-muted-foreground">{Math.round(Number(design.opacity ?? 1) * 100)}%</span>
      </label>
    </div>
  );
}

export default function PageBuilderPro() {
  const role = useQuery(api.roles.myRole, {});
  const pages = useQuery(api.pages.listAdmin, {}) ?? [];
  const savePage = useMutation(api.pages.savePage);
  const publishPage = useMutation(api.pages.publishPage);
  const unpublishPage = useMutation(api.pages.unpublishPage);
  const duplicatePage = useMutation(api.pages.duplicatePage);
  const deletePage = useMutation(api.pages.deletePage);
  const ensureHomepage = useMutation(api.pages.ensureHomepageDraft);

  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [selectedId, setSelectedId] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [device, setDevice] = useState<Device>("desktop");
  const [showSiteChrome, setShowSiteChrome] = useState(false);
  const [busy, setBusy] = useState("");
  const [dragId, setDragId] = useState("");
  const [mediaTarget, setMediaTarget] = useState<MediaTarget>(null);
  const [sidebarTab, setSidebarTab] = useState("widgets");
  const [inspectorTab, setInspectorTab] = useState("content");
  const [htmlImportOpen, setHtmlImportOpen] = useState(false);
  const [htmlImportValue, setHtmlImportValue] = useState("");
  const [cssImportValue, setCssImportValue] = useState("");

  useEffect(() => {
    if (!selectedId) return;
    const row = pages.find((page: any) => String(page._id) === selectedId);
    if (!row) return;
    const next = fromRow(row);
    setDraft(next);
    setSelectedBlockId(next.blocks[0]?.id || "");
  }, [selectedId, pages]);

  const sortedBlocks = useMemo(
    () => [...draft.blocks].sort((a, b) => a.order - b.order),
    [draft.blocks],
  );
  const selectedBlock =
    findBlockInTree(sortedBlocks, selectedBlockId) || null;
  const flatBlocks = useMemo(() => flattenBlocks(sortedBlocks), [sortedBlocks]);
  const containers = flatBlocks
    .map((entry) => entry.block)
    .filter((block) => block.type === "container");

  const canvasWidth =
    device === "mobile" ? 390 : device === "tablet" ? 820 : 1280;

  const patchBlock = (blockId: string, patch: Partial<Block>) =>
    setDraft((current) => ({
      ...current,
      blocks: updateBlockInTree(current.blocks, blockId, (block) => ({
        ...block,
        ...patch,
      })),
    }));

  const patchBlockProps = (blockId: string, props: Record<string, any>) =>
    patchBlock(blockId, { props });

  const addBlock = (type: string) => {
    const block = newBlock(type);
    setDraft((current) => {
      const selected = findBlockInTree(current.blocks, selectedBlockId);
      if (selected?.type === "container") {
        return {
          ...current,
          blocks: appendBlockToContainer(current.blocks, selected.id, block),
        };
      }
      return {
        ...current,
        blocks: [
          ...current.blocks,
          { ...block, order: current.blocks.length },
        ],
      };
    });
    setSelectedBlockId(block.id);
    setInspectorTab("content");
    toast.success(BLOCK_LABELS[type] + " اضافه شد");
  };

  const insertPreset = (presetId: string) => {
    const preset = SECTION_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    const additions = preset.types.map((type, index) => ({
      ...newBlock(type),
      order: index,
    }));
    setDraft((current) => {
      const selected = findBlockInTree(current.blocks, selectedBlockId);
      if (selected?.type === "container") {
        let blocks = current.blocks;
        for (const addition of additions) {
          blocks = appendBlockToContainer(blocks, selected.id, addition);
        }
        return { ...current, blocks };
      }
      return {
        ...current,
        blocks: [...current.blocks, ...additions].map((block, order) => ({
          ...block,
          order,
        })),
      };
    });
    if (additions[0]) setSelectedBlockId(additions[0].id);
    setInspectorTab("content");
    toast.success("سکشن «" + preset.title + "» اضافه شد");
  };

  const removeBlock = (blockId: string) => {
    setDraft((current) => ({
      ...current,
      blocks: removeBlockFromTree(current.blocks, blockId),
    }));
    if (selectedBlockId === blockId) setSelectedBlockId("");
  };

  const duplicateBlock = (block: Block) => {
    const copy: Block = {
      ...block,
      id: id(),
      props: JSON.parse(JSON.stringify(block.props || {})),
      order: draft.blocks.length,
    };
    setDraft((current) => ({
      ...current,
      blocks: [...current.blocks, copy],
    }));
    setSelectedBlockId(copy.id);
  };

  const moveDroppedBlock = (sourceId: string, targetId: string) => {
    if (!sourceId || sourceId === targetId) return;
    setDraft((current) => {
      const blocks = [...current.blocks].sort((a, b) => a.order - b.order);
      const from = blocks.findIndex((block) => block.id === sourceId);
      const to = blocks.findIndex((block) => block.id === targetId);
      if (from < 0 || to < 0) return current;
      const [moved] = blocks.splice(from, 1);
      blocks.splice(to, 0, moved);
      return {
        ...current,
        blocks: blocks.map((block, order) => ({ ...block, order })),
      };
    });
  };

  const save = async () => {
    setBusy("save");
    try {
      const savedId = await savePage({
        id: draft.id,
        title: draft.title,
        slug: draft.slug,
        pageType: draft.pageType,
        isHomepage: draft.isHomepage,
        blocks: sortedBlocks,
        seoTitle: draft.seoTitle || undefined,
        seoDescription: draft.seoDescription || undefined,
        seoKeywords: draft.seoKeywords,
        canonicalUrl: draft.canonicalUrl || undefined,
        ogTitle: draft.ogTitle || undefined,
        ogDescription: draft.ogDescription || undefined,
        ogImage: draft.ogImage || undefined,
        noIndex: draft.noIndex,
        settings: draft.settings,
      });
      setDraft((current) => ({ ...current, id: savedId }));
      setSelectedId(String(savedId));
      toast.success("صفحه ذخیره شد");
      return savedId;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ذخیره صفحه ناموفق بود",
      );
      return null;
    } finally {
      setBusy("");
    }
  };

  const publish = async () => {
    let pageId = draft.id;
    if (!pageId) pageId = await save();
    if (!pageId) return;
    setBusy("publish");
    try {
      await publishPage({ id: pageId });
      setDraft((current) => ({ ...current, status: "published" }));
      toast.success("صفحه منتشر شد");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "انتشار صفحه ناموفق بود",
      );
    } finally {
      setBusy("");
    }
  };

  const chooseMedia = (item: SiteMediaItem) => {
    if (!item.url || !mediaTarget) return;
    if (mediaTarget.type === "browse") return;
    if (mediaTarget.type === "font") {
      setDraft((current) => ({
        ...current,
        settings: {
          ...current.settings,
          customFontUrl: item.url,
          customFontFamily:
            current.settings.customFontFamily ||
            item.fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, ""),
        },
      }));
      return;
    }
    if (mediaTarget.type === "ogImage") {
      setDraft((current) => ({ ...current, ogImage: item.url || "" }));
      return;
    }

    const block = draft.blocks.find((entry) => entry.id === mediaTarget.blockId);
    if (!block) return;
    if (mediaTarget.type === "background") {
      patchBlockProps(block.id, {
        ...block.props,
        design: {
          ...defaultDesign(),
          ...(block.props?.design || {}),
          backgroundImage: item.url,
        },
      });
      return;
    }
    patchBlockProps(block.id, {
      ...block.props,
      [mediaTarget.key]: item.url,
      ...(mediaTarget.key === "imageUrl" && !block.props.imageAlt
        ? { imageAlt: item.alt || item.title || "" }
        : {}),
    });
  };

  if (role === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="me-2 size-4 animate-spin" />
        در حال بارگذاری صفحه‌ساز…
      </div>
    );
  }

  if (!role?.canManageSite) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center p-5">
        <div className="rounded-3xl border border-border bg-card p-7 text-center">
          <h1 className="text-xl font-black">صفحه‌ساز فقط برای مدیر اصلی است</h1>
          <Button asChild className="mt-5">
            <Link to="/dashboard">بازگشت به داشبورد</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen max-w-[100dvw] overflow-x-hidden bg-muted/25">
      <header className="sticky top-0 z-[90] border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="flex min-h-14 items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">
                <ArrowRight className="size-4" />
                <span className="hidden sm:inline">داشبورد</span>
              </Link>
            </Button>
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Layers3 className="size-5" />
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-sm">Divsaz Builder Pro</strong>
              <span className="block truncate text-[9px] text-muted-foreground">
                صفحه‌ساز حرفه‌ای اختصاصی دیوساز
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden items-center rounded-xl border border-border/70 bg-muted/40 p-1 sm:flex">
              {[
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ].map(([value, Icon]: any) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setDevice(value)}
                  className={
                    "flex size-8 items-center justify-center rounded-lg " +
                    (device === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground")
                  }
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" disabled={busy === "save"} onClick={() => void save()}>
              {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              <span className="hidden sm:inline">ذخیره</span>
            </Button>
            <Button size="sm" disabled={busy === "publish"} onClick={() => void publish()}>
              {busy === "publish" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              <span className="hidden sm:inline">انتشار</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <DashboardSectionNav />

      <div className="grid min-h-[calc(100dvh-110px)] xl:grid-cols-[270px_minmax(0,1fr)_340px]">
        <aside className="border-b border-border/70 bg-card xl:border-b-0 xl:border-l">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex h-full flex-col">
            <TabsList className="m-2 grid grid-cols-4">
              <TabsTrigger value="widgets">ویجت</TabsTrigger>
              <TabsTrigger value="sections">سکشن</TabsTrigger>
              <TabsTrigger value="structure">ساختار</TabsTrigger>
              <TabsTrigger value="pages">صفحات</TabsTrigger>
            </TabsList>

            <TabsContent value="widgets" className="m-0 flex-1 overflow-y-auto p-3">
              <p className="mb-3 text-[10px] leading-5 text-muted-foreground">
                ویجت را اضافه کن، بعد از سمت راست محتوا و ظاهرش را تنظیم کن.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BLOCKS.map((item) => (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => addBlock(item.type)}
                    className="rounded-2xl border border-border/70 bg-background p-3 text-right transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                  >
                    <Plus className="size-4 text-primary" />
                    <strong className="mt-2 block text-xs">{item.label}</strong>
                    <span className="mt-1 block text-[9px] leading-4 text-muted-foreground">{item.note}</span>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full gap-2"
                onClick={() => setMediaTarget({ type: "browse" })}
              >
                <ImagePlus className="size-4" />
                کتابخانه تصاویر
              </Button>
            </TabsContent>

            <TabsContent value="sections" className="m-0 flex-1 overflow-y-auto p-3">
              <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-[10px] leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                سکشن‌های آماده فقط نقطه شروع هستند؛ بعد از افزودن، تمام رنگ‌ها،
                فاصله‌ها، فونت، تصویر و متن را خودت تغییر بده.
              </div>
              <div className="grid gap-2">
                {SECTION_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => insertPreset(preset.id)}
                    className="rounded-2xl border border-border/70 bg-background p-3 text-right transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs">{preset.title}</strong>
                      <Plus className="size-4 text-primary" />
                    </div>
                    <span className="mt-1 block text-[9px] leading-5 text-muted-foreground">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="structure" className="m-0 flex-1 overflow-y-auto p-3">
              <p className="mb-2 text-[10px] text-muted-foreground">
                برای جابه‌جایی، بلوک را بکش و روی بلوک مقصد رها کن.
              </p>
              <div className="grid gap-2">
                {sortedBlocks.map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(event: DragEvent<HTMLDivElement>) => {
                      setDragId(block.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      moveDroppedBlock(dragId, block.id);
                      setDragId("");
                    }}
                    onClick={() => {
                      setSelectedBlockId(block.id);
                      setInspectorTab("content");
                    }}
                    className={
                      "flex cursor-pointer items-center gap-2 rounded-2xl border p-2.5 transition-colors " +
                      (selectedBlockId === block.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                        : "border-border/70 bg-background")
                    }
                  >
                    <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-xs">
                        {BLOCK_LABELS[block.type] || block.type}
                      </strong>
                      <span className="block truncate text-[9px] text-muted-foreground">
                        {block.props?.title || block.props?.eyebrow || block.id}
                      </span>
                    </div>
                    {!block.enabled && <Badge variant="outline">خاموش</Badge>}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pages" className="m-0 flex-1 overflow-y-auto p-3">
              <Button
                type="button"
                className="w-full gap-2"
                onClick={() => {
                  const next = emptyDraft();
                  setDraft(next);
                  setSelectedId("");
                  setSelectedBlockId(next.blocks[0]?.id || "");
                }}
              >
                <FilePlus2 className="size-4" />
                صفحه جدید
              </Button>
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full"
                disabled={busy === "homepage"}
                onClick={async () => {
                  setBusy("homepage");
                  try {
                    const pageId = await ensureHomepage({});
                    setSelectedId(String(pageId));
                  } finally {
                    setBusy("");
                  }
                }}
              >
                ویرایش صفحه اصلی
              </Button>
              <div className="mt-3 grid gap-2">
                {pages.map((page: any) => (
                  <button
                    type="button"
                    key={String(page._id)}
                    onClick={() => setSelectedId(String(page._id))}
                    className={
                      "rounded-2xl border p-3 text-right " +
                      (String(page._id) === selectedId
                        ? "border-primary bg-primary/5"
                        : "border-border/70 bg-background")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="truncate text-xs">{page.title}</strong>
                      {page.isHomepage && <Badge>خانه</Badge>}
                    </div>
                    <span className="mt-1 block truncate text-[9px] text-muted-foreground" dir="ltr">
                      /{page.slug}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        <section className="min-w-0 overflow-hidden bg-[linear-gradient(45deg,rgba(148,163,184,.08)_25%,transparent_25%,transparent_75%,rgba(148,163,184,.08)_75%),linear-gradient(45deg,rgba(148,163,184,.08)_25%,transparent_25%,transparent_75%,rgba(148,163,184,.08)_75%)] bg-[length:24px_24px] bg-[position:0_0,12px_12px]">
          <div className="flex items-center justify-between border-b border-border/70 bg-background/90 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <strong className="truncate text-xs">{draft.title}</strong>
              <Badge variant="outline">{draft.status === "published" ? "منتشرشده" : "پیش‌نویس"}</Badge>
              <Button
                type="button"
                size="sm"
                variant={showSiteChrome ? "default" : "outline"}
                className="h-7 px-2 text-[9px]"
                aria-pressed={showSiteChrome}
                onClick={() => setShowSiteChrome((value) => !value)}
              >
                {showSiteChrome ? "پوسته سایت روشن" : "پیش‌نمایش پوسته"}
              </Button>
            </div>
            <div className="flex items-center gap-1 sm:hidden">
              <Button size="icon" variant={device === "desktop" ? "default" : "outline"} onClick={() => setDevice("desktop")}><Monitor className="size-4" /></Button>
              <Button size="icon" variant={device === "tablet" ? "default" : "outline"} onClick={() => setDevice("tablet")}><Tablet className="size-4" /></Button>
              <Button size="icon" variant={device === "mobile" ? "default" : "outline"} onClick={() => setDevice("mobile")}><Smartphone className="size-4" /></Button>
            </div>
          </div>

          <div className="h-[72dvh] overflow-auto p-3 sm:p-5 xl:h-[calc(100dvh-160px)]">
            <div
              className="mx-auto min-h-full overflow-hidden rounded-2xl border border-border/70 shadow-2xl transition-[width] duration-300"
              style={{
                width: "min(100%, " + canvasWidth + "px)",
                backgroundColor: draft.settings.backgroundColor || "#ffffff",
                color: draft.settings.textColor || "#0f172a",
              }}
            >
              {sortedBlocks.length ? (
                <SitePageRenderer
                  page={draft as any}
                  hideHeader={!showSiteChrome}
                  editor={{
                    selectedBlockId,
                    onSelectBlock: (blockId) => {
                      setSelectedBlockId(blockId);
                      setInspectorTab("content");
                    },
                  }}
                />
              ) : (
                <div className="flex min-h-[720px] items-center justify-center bg-white p-6 text-center text-slate-500">
                  <div>
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                      <Plus className="size-6" />
                    </div>
                    <strong className="mt-4 block text-sm text-slate-800">صفحه سفید آماده است</strong>
                    <p className="mt-2 max-w-xs text-xs leading-6">
                      از «ویجت» یک المان تکی اضافه کن یا از «سکشن» بخش‌های آماده مثل آگهی‌ها و جستجو را وارد کن.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <Button type="button" size="sm" onClick={() => insertPreset("featured-listings")}>
                        آگهی‌های منتخب
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => insertPreset("property-search")}>
                        جستجو و مسیرها
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => insertPreset("complete-landing")}>
                        لندینگ کامل
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="border-t border-border/70 bg-card xl:border-t-0 xl:border-r">
          <Tabs value={inspectorTab} onValueChange={setInspectorTab} className="flex h-full flex-col">
            <TabsList className="m-2 grid grid-cols-4">
              <TabsTrigger value="content">محتوا</TabsTrigger>
              <TabsTrigger value="style">استایل</TabsTrigger>
              <TabsTrigger value="advanced">پیشرفته</TabsTrigger>
              <TabsTrigger value="page">صفحه</TabsTrigger>
            </TabsList>

            <div className="max-h-[72dvh] flex-1 overflow-y-auto px-3 pb-5 xl:max-h-[calc(100dvh-170px)]">
              <TabsContent value="content" className="m-0">
                {!selectedBlock ? (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                    یک بلوک را از Canvas یا ساختار انتخاب کن.
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background p-2">
                      <div>
                        <strong className="block text-xs">{BLOCK_LABELS[selectedBlock.type] || selectedBlock.type}</strong>
                        <span className="text-[9px] text-muted-foreground">{selectedBlock.id}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" size="icon" variant="ghost" onClick={() => patchBlock(selectedBlock.id, { enabled: !selectedBlock.enabled })}>
                          <Eye className="size-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={() => duplicateBlock(selectedBlock)}>
                          <Copy className="size-4" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeBlock(selectedBlock.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <BlockContentEditor
                      block={selectedBlock}
                      patchProps={(props) => patchBlockProps(selectedBlock.id, props)}
                      chooseImage={(key) =>
                        setMediaTarget({
                          type: "blockImage",
                          blockId: selectedBlock.id,
                          key,
                        })
                      }
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="style" className="m-0">
                {!selectedBlock ? (
                  <p className="text-xs text-muted-foreground">یک بلوک انتخاب کن.</p>
                ) : (
                  <>
                    <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
                      {[
                        ["desktop", Monitor, "دسکتاپ"],
                        ["tablet", Tablet, "تبلت"],
                        ["mobile", Smartphone, "موبایل"],
                      ].map(([value, Icon, label]: any) => (
                        <button
                          type="button"
                          key={value}
                          onClick={() => setDevice(value)}
                          className={
                            "flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[9px] font-bold " +
                            (device === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground")
                          }
                        >
                          <Icon className="size-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                    <StyleEditor
                      block={selectedBlock}
                      device={device}
                      patchProps={(props) => patchBlockProps(selectedBlock.id, props)}
                      chooseBackground={() =>
                        setMediaTarget({
                          type: "background",
                          blockId: selectedBlock.id,
                        })
                      }
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="m-0">
                {!selectedBlock ? (
                  <p className="text-xs text-muted-foreground">یک بلوک انتخاب کن.</p>
                ) : (
                  <AdvancedEditor
                    block={selectedBlock}
                    patchProps={(props) => patchBlockProps(selectedBlock.id, props)}
                  />
                )}
              </TabsContent>

              <TabsContent value="page" className="m-0">
                <div className="grid gap-5">
                  <section className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <Settings2 className="size-4 text-primary" />
                      <strong className="text-xs">تنظیمات صفحه</strong>
                    </div>
                    <Field label="عنوان داخلی" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} />
                    <Field label="مسیر صفحه" value={draft.slug} onChange={(v) => setDraft((d) => ({ ...d, slug: v }))} placeholder="industrial-shahriar" />
                    <SelectField label="نوع صفحه" value={draft.pageType} onChange={(v) => setDraft((d) => ({ ...d, pageType: v as any }))}>
                      <option value="landing">لندینگ</option>
                      <option value="page">برگه معمولی</option>
                    </SelectField>
                    <label className="flex items-center gap-2 rounded-xl border border-border/70 p-3 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={draft.isHomepage}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            isHomepage: event.target.checked,
                            pageType: event.target.checked ? "landing" : current.pageType,
                          }))
                        }
                      />
                      صفحه اصلی سایت باشد
                    </label>
                  </section>

                  <section className="grid gap-3 border-t border-border/60 pt-4">
                    <div className="flex items-center gap-2">
                      <Paintbrush className="size-4 text-primary" />
                      <strong className="text-xs">استایل کلی صفحه</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            settings: {
                              ...d.settings,
                              backgroundColor: "#ffffff",
                              textColor: "#0f172a",
                              customFontFamily: "Vazirmatn",
                              customFontUrl: "",
                              showHeader: false,
                              showStories: false,
                              showBrandStory: false,
                            },
                          }))
                        }
                      >
                        بوم سفید
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            settings: {
                              ...d.settings,
                              backgroundColor: "#ffffff",
                              textColor: "#0f172a",
                              customFontFamily: "Vazirmatn",
                              customFontUrl: "",
                              showHeader: true,
                              showStories: true,
                              showBrandStory: true,
                            },
                          }))
                        }
                      >
                        قالب کامل سایت
                      </Button>
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3 text-xs">
                      <span>هدر سایت نمایش داده شود</span>
                      <input
                        type="checkbox"
                        checked={draft.settings.showHeader !== false}
                        onChange={(event) =>
                          setDraft((d) => ({
                            ...d,
                            settings: {
                              ...d.settings,
                              showHeader: event.target.checked,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3 text-xs">
                      <span>استوری‌ها نمایش داده شوند</span>
                      <input
                        type="checkbox"
                        checked={draft.settings.showStories !== false}
                        onChange={(event) =>
                          setDraft((d) => ({
                            ...d,
                            settings: {
                              ...d.settings,
                              showStories: event.target.checked,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3 text-xs">
                      <span>بخش داستان برند نمایش داده شود</span>
                      <input
                        type="checkbox"
                        checked={draft.settings.showBrandStory !== false}
                        onChange={(event) =>
                          setDraft((d) => ({
                            ...d,
                            settings: {
                              ...d.settings,
                              showBrandStory: event.target.checked,
                            },
                          }))
                        }
                      />
                    </label>

                    <ColorField label="رنگ پس‌زمینه صفحه" value={draft.settings.backgroundColor || ""} onChange={(v) => setDraft((d) => ({ ...d, settings: { ...d.settings, backgroundColor: v } }))} />
                    <ColorField label="رنگ متن پیش‌فرض" value={draft.settings.textColor || ""} onChange={(v) => setDraft((d) => ({ ...d, settings: { ...d.settings, textColor: v } }))} />
                    <NumberField label="اندازه فونت پایه" value={Number(draft.settings.baseFontSize || 16)} min={11} max={24} onChange={(v) => setDraft((d) => ({ ...d, settings: { ...d.settings, baseFontSize: v } }))} />

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs">فونت پیش‌فرض: وزیرمتن</strong>
                        {!draft.settings.customFontUrl && <Badge variant="outline">فعال</Badge>}
                      </div>
                      <p className="mt-1 text-[9px] leading-5 opacity-75">
                        Vazirmatn داخل خود پروژه نصب شده و برای لود شدن به سرویس خارجی وابسته نیست.
                      </p>
                    </div>

                    <Field label="نام فونت سفارشی" value={draft.settings.customFontFamily || "Vazirmatn"} onChange={(v) => setDraft((d) => ({ ...d, settings: { ...d.settings, customFontFamily: v } }))} placeholder="مثلاً DivosazBrand" />
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant="outline" className="gap-2" onClick={() => setMediaTarget({ type: "font" })}>
                        <Type className="size-4" />
                        فونت سفارشی
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            settings: {
                              ...d.settings,
                              customFontFamily: "Vazirmatn",
                              customFontUrl: "",
                            },
                          }))
                        }
                      >
                        بازگشت به وزیر
                      </Button>
                    </div>
                    {draft.settings.customFontUrl && (
                      <div className="rounded-xl bg-muted p-2 text-[9px] text-muted-foreground" dir="ltr">
                        {draft.settings.customFontUrl}
                      </div>
                    )}
                  </section>

                  <section className="grid gap-3 border-t border-border/60 pt-4">
                    <div className="flex items-center gap-2">
                      <Search className="size-4 text-primary" />
                      <strong className="text-xs">SEO صفحه</strong>
                    </div>
                    <SeoScore draft={draft} />
                    <Field label="SEO Title" value={draft.seoTitle} onChange={(v) => setDraft((d) => ({ ...d, seoTitle: v }))} />
                    <Area label="Meta Description" value={draft.seoDescription} onChange={(v) => setDraft((d) => ({ ...d, seoDescription: v }))} rows={4} />
                    <Area
                      label="Keywords - با کاما جدا کن"
                      value={draft.seoKeywords.join(", ")}
                      onChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          seoKeywords: v.split(",").map((item) => item.trim()).filter(Boolean),
                        }))
                      }
                      rows={2}
                    />
                    <Field label="Canonical URL" value={draft.canonicalUrl} onChange={(v) => setDraft((d) => ({ ...d, canonicalUrl: v }))} placeholder="https://divsaz.ir/..." />
                    <Field label="OG Title" value={draft.ogTitle} onChange={(v) => setDraft((d) => ({ ...d, ogTitle: v }))} />
                    <Area label="OG Description" value={draft.ogDescription} onChange={(v) => setDraft((d) => ({ ...d, ogDescription: v }))} rows={3} />
                    {draft.ogImage && (
                      <img src={draft.ogImage} alt="" className="h-32 w-full rounded-xl bg-muted object-contain" />
                    )}
                    <Button type="button" variant="outline" className="gap-2" onClick={() => setMediaTarget({ type: "ogImage" })}>
                      <ImagePlus className="size-4" />
                      تصویر شبکه اجتماعی
                    </Button>
                    <label className="flex items-center gap-2 rounded-xl border border-border/70 p-3 text-xs">
                      <input type="checkbox" checked={draft.noIndex} onChange={(event) => setDraft((d) => ({ ...d, noIndex: event.target.checked }))} />
                      جلوگیری از ایندکس موتورهای جستجو
                    </label>
                  </section>

                  {draft.id && (
                    <section className="grid gap-2 border-t border-border/60 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          const newId = await duplicatePage({ id: draft.id });
                          setSelectedId(String(newId));
                          toast.success("صفحه کپی شد");
                        }}
                      >
                        <Copy className="size-4" />
                        کپی صفحه
                      </Button>
                      {draft.status === "published" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            await unpublishPage({ id: draft.id });
                            setDraft((d) => ({ ...d, status: "draft" }));
                            toast.success("صفحه به پیش‌نویس برگشت");
                          }}
                        >
                          خارج کردن از انتشار
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="text-destructive"
                        onClick={async () => {
                          if (!window.confirm("این صفحه حذف شود؟")) return;
                          await deletePage({ id: draft.id });
                          const next = emptyDraft();
                          setDraft(next);
                          setSelectedId("");
                          setSelectedBlockId(next.blocks[0]?.id || "");
                          toast.success("صفحه حذف شد");
                        }}
                      >
                        <Trash2 className="size-4" />
                        حذف صفحه
                      </Button>
                    </section>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </aside>
      </div>

      <MediaLibraryDialog
        open={Boolean(mediaTarget)}
        onOpenChange={(open) => !open && setMediaTarget(null)}
        kind={mediaTarget?.type === "font" ? "font" : "image"}
        onSelect={chooseMedia}
        title={
          mediaTarget?.type === "font"
            ? "فونت‌های دیوساز"
            : "تصاویر دیوساز"
        }
      />
    </main>
  );
}
