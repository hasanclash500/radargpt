import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { currentRole } from "./permissions";
import { OFFICE_ROLES } from "./schema";

const blockValidator = v.object({
  id: v.string(),
  type: v.string(),
  enabled: v.boolean(),
  order: v.number(),
  props: v.any(),
});

const RESERVED_SLUGS = new Set([
  "",
  "admin",
  "api",
  "assistant",
  "auth",
  "blog",
  "dashboard",
  "listings",
  "request",
  "submit-listing",
  "p",
]);

const ALLOWED_BLOCK_TYPES = new Set([
  "hero",
  "intentHub",
  "listings",
  "services",
  "split",
  "richText",
  "cta",
  "contact",
]);

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-\u0600-\u06ff]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function normalizeBlocks(blocks: any[]) {
  return blocks
    .filter((block) => block && ALLOWED_BLOCK_TYPES.has(String(block.type)))
    .slice(0, 40)
    .map((block, index) => ({
      id:
        String(block.id || "").trim() ||
        globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 18),
      type: String(block.type),
      enabled: block.enabled !== false,
      order: index,
      props:
        block.props && typeof block.props === "object" && !Array.isArray(block.props)
          ? block.props
          : {},
    }));
}

async function requireManager(ctx: any) {
  const current = await currentRole(ctx);
  if (!current || current.role !== OFFICE_ROLES.MANAGER) {
    throw new Error("فقط مدیر اصلی اجازه مدیریت صفحه‌های عمومی سایت را دارد.");
  }
  return current;
}

export const listAdmin = query({
  args: {},
  handler: async (ctx) => {
    const current = await currentRole(ctx);
    if (!current || current.role !== OFFICE_ROLES.MANAGER) return [];
    return await ctx.db.query("sitePages").order("desc").collect();
  },
});

export const getAdmin = query({
  args: { id: v.id("sitePages") },
  handler: async (ctx, args) => {
    const current = await currentRole(ctx);
    if (!current || current.role !== OFFICE_ROLES.MANAGER) return null;
    return await ctx.db.get(args.id);
  },
});

export const getHomepage = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("sitePages")
      .withIndex("by_homepage_status", (q) =>
        q.eq("isHomepage", true).eq("status", "published"),
      )
      .order("desc")
      .take(2);
    return rows[0] ?? null;
  },
});

export const getPublishedBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const slug = normalizeSlug(args.slug);
    if (!slug) return null;
    const rows = await ctx.db
      .query("sitePages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .take(4);
    return (
      rows
        .filter((row) => row.status === "published")
        .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))[0] ?? null
    );
  },
});

export const ensureHomepageDraft = mutation({
  args: {},
  handler: async (ctx) => {
    const current = await requireManager(ctx);
    const existing = await ctx.db
      .query("sitePages")
      .withIndex("by_homepage_status", (q) => q.eq("isHomepage", true))
      .order("desc")
      .take(1);
    if (existing[0]) return existing[0]._id;

    const now = Date.now();
    return await ctx.db.insert("sitePages", {
      title: "صفحه اصلی دیوساز",
      slug: "home",
      pageType: "landing",
      status: "draft",
      isHomepage: true,
      blocks: normalizeBlocks([
        {
          type: "intentHub",
          props: {
            title: "چه کاری می‌خواهید انجام دهید؟",
            text: "برای جستجوی ملک یا معرفی فایل، مسیر مناسب را انتخاب کنید.",
            propertyTypes: [
              "سوله",
              "کارخانه",
              "کارگاه",
              "انبار",
              "زمین صنعتی",
              "دفتر اداری",
            ],
          },
        },
        {
          type: "hero",
          props: {
            eyebrow: "مشاور تخصصی املاک کسب‌وکار در شهریار",
            title: "فضای مناسب کار شما",
            highlight: "از سوله تا دفتر اداری",
            text: "دیوساز برای خرید، فروش، رهن و اجاره املاک صنعتی و اداری در شهریار؛ با تمرکز روی موقعیت‌های واقعی کسب‌وکار و ارتباط مستقیم.",
            primaryLabel: "مشاهده آگهی‌ها",
            primaryHref: "/listings",
            secondaryLabel: "ثبت آگهی ملک",
            secondaryHref: "/submit-listing",
          },
        },
        {
          type: "listings",
          props: {
            eyebrow: "فایل‌های منتخب",
            title: "ویترین آگهی‌های دیوساز",
            text: "چند فایل منتخب از آگهی‌های منتشرشده دیوساز.",
            limit: 8,
          },
        },
        {
          type: "services",
          props: {
            title: "حوزه تخصصی دیوساز",
            text: "تمرکز روی املاک صنعتی و اداری شهریار و اطراف.",
            items: [
              {
                title: "املاک صنعتی",
                text: "سوله، کارخانه، کارگاه، انبار و زمین صنعتی.",
              },
              {
                title: "املاک اداری",
                text: "دفتر کار، ساختمان اداری و فضای شرکتی.",
              },
            ],
          },
        },
        {
          type: "cta",
          props: {
            title: "ملک مناسب را سریع‌تر پیدا کنید",
            text: "از دستیار هوشمند دیوساز برای جستجوی کلامی و صوتی در فایل‌های خود سایت استفاده کنید.",
            primaryLabel: "دستیار هوشمند",
            primaryHref: "/assistant",
            secondaryLabel: "ثبت تقاضای ملک",
            secondaryHref: "/request",
          },
        },
        {
          type: "contact",
          props: {
            title: "ارتباط با دیوساز",
            text: "برای مشاوره مستقیم با دفتر دیوساز تماس بگیرید یا مسیر دفتر را در نشان باز کنید.",
            phone: "09120858095",
            address: "شهریار، روبروی شهرک اداری تجربه",
          },
        },
      ]),
      createdByUserId: current.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const savePage = mutation({
  args: {
    id: v.optional(v.id("sitePages")),
    title: v.string(),
    slug: v.string(),
    pageType: v.union(v.literal("landing"), v.literal("page")),
    isHomepage: v.boolean(),
    blocks: v.array(blockValidator),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    noIndex: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const current = await requireManager(ctx);
    const title = args.title.trim().slice(0, 160);
    if (!title) throw new Error("عنوان صفحه را وارد کنید.");

    const slug = args.isHomepage ? "home" : normalizeSlug(args.slug);
    if (!args.isHomepage && (!slug || RESERVED_SLUGS.has(slug))) {
      throw new Error("مسیر این صفحه معتبر نیست یا با مسیرهای داخلی سایت تداخل دارد.");
    }

    const sameSlug = await ctx.db
      .query("sitePages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .collect();
    if (sameSlug.some((row) => !args.id || String(row._id) !== String(args.id))) {
      throw new Error("صفحه دیگری با این مسیر وجود دارد.");
    }

    const now = Date.now();
    const patch = {
      title,
      slug,
      pageType: args.pageType,
      isHomepage: args.isHomepage,
      blocks: normalizeBlocks(args.blocks),
      seoTitle: args.seoTitle?.trim() || undefined,
      seoDescription: args.seoDescription?.trim() || undefined,
      noIndex: args.noIndex ?? false,
      updatedAt: now,
    };

    if (args.id) {
      const row = await ctx.db.get(args.id);
      if (!row) throw new Error("صفحه پیدا نشد.");
      await ctx.db.patch(args.id, patch);
      return args.id;
    }

    return await ctx.db.insert("sitePages", {
      ...patch,
      status: "draft",
      createdByUserId: current.userId,
      createdAt: now,
    });
  },
});

export const publishPage = mutation({
  args: { id: v.id("sitePages") },
  handler: async (ctx, args) => {
    await requireManager(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("صفحه پیدا نشد.");

    if (row.isHomepage) {
      const others = await ctx.db
        .query("sitePages")
        .withIndex("by_homepage_status", (q) => q.eq("isHomepage", true))
        .collect();
      for (const other of others) {
        if (other._id !== row._id) {
          await ctx.db.patch(other._id, {
            isHomepage: false,
            updatedAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.patch(row._id, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const unpublishPage = mutation({
  args: { id: v.id("sitePages") },
  handler: async (ctx, args) => {
    await requireManager(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) return true;
    await ctx.db.patch(row._id, {
      status: "draft",
      publishedAt: undefined,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const duplicatePage = mutation({
  args: { id: v.id("sitePages") },
  handler: async (ctx, args) => {
    const current = await requireManager(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("صفحه پیدا نشد.");

    const now = Date.now();
    const base = normalizeSlug(row.slug === "home" ? "landing-copy" : row.slug + "-copy");
    let slug = base || "page-copy";
    let suffix = 2;
    while (true) {
      const existing = await ctx.db
        .query("sitePages")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .take(1);
      if (existing.length === 0) break;
      slug = base + "-" + suffix++;
    }

    return await ctx.db.insert("sitePages", {
      title: row.title + " - کپی",
      slug,
      pageType: row.pageType,
      status: "draft",
      isHomepage: false,
      blocks: normalizeBlocks(row.blocks),
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      noIndex: row.noIndex,
      createdByUserId: current.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deletePage = mutation({
  args: { id: v.id("sitePages") },
  handler: async (ctx, args) => {
    await requireManager(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) return true;
    await ctx.db.delete(row._id);
    return true;
  },
});

function extractJson(text: string) {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("خروجی هوش مصنوعی JSON معتبر نبود.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export const generateWithAi = action({
  args: {
    prompt: v.string(),
    pageType: v.union(v.literal("landing"), v.literal("page")),
  },
  handler: async (ctx, args) => {
    const role = await ctx.runQuery(internal.integrations.actionRole, {});
    if (role !== OFFICE_ROLES.MANAGER) {
      throw new Error("فقط مدیر اصلی اجازه ساخت صفحه با هوش مصنوعی را دارد.");
    }

    const config = await ctx.runQuery(internal.integrations.getSecretsInternal, {});
    const apiKey = (
      config?.openRouterApiKey ||
      process.env.OPENROUTER_API_KEY ||
      ""
    ).trim();
    const model = (
      config?.openRouterModel ||
      process.env.OPENROUTER_MODEL ||
      "openrouter/free"
    ).trim();
    if (!apiKey) {
      throw new Error("ابتدا کلید OpenRouter را در مدیریت > اتصال‌ها ذخیره کنید.");
    }

    const system = [
      "تو طراح حرفه‌ای صفحات وب برای برند املاک دیوساز هستی.",
      "خروجی فقط JSON معتبر و بدون markdown باشد.",
      "هیچ HTML، JavaScript یا CSS خام تولید نکن.",
      "فقط از block type های مجاز استفاده کن: hero, intentHub, listings, services, split, richText, cta, contact.",
      "زبان صفحه فارسی و راست‌به‌چپ است و رنگ‌بندی توسط قالب دیوساز اعمال می‌شود.",
      "ساختار خروجی: {title:string, seoTitle:string, seoDescription:string, blocks:[{id:string,type:string,enabled:true,order:number,props:object}]}",
      "برای لینک داخلی فقط مسیرهای امن مثل /listings, /assistant, /request, /submit-listing, /blog یا #section استفاده کن.",
      "intentHub برای چهار مسیر خرید، اجاره، فروش و اجاره‌دادن است.",
      "listings برای نمایش فایل‌های واقعی منتشرشده دیوساز است؛ ملک یا قیمت ساختگی داخل متن ایجاد نکن.",
      "services props: {title,text,items:[{title,text}]}",
      "hero props: {eyebrow,title,highlight,text,primaryLabel,primaryHref,secondaryLabel,secondaryHref}",
      "split props: {eyebrow,title,text,buttonLabel,buttonHref,imageUrl,imagePosition:'start'|'end'}",
      "richText props: {eyebrow,title,body,align:'start'|'center'}",
      "cta props: {title,text,primaryLabel,primaryHref,secondaryLabel,secondaryHref}",
      "contact props: {title,text,phone,address}",
      "هر صفحه بین 3 تا 10 بلوک داشته باشد.",
    ].join("\n");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL ?? "https://meka.ir",
        "X-Title": "MEKA Page Builder",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              `نوع صفحه: ${args.pageType === "landing" ? "لندینگ" : "برگه داخلی"}\nدرخواست مدیر:\n${args.prompt.slice(0, 4000)}`,
          },
        ],
        temperature: 0.45,
        max_tokens: 2600,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error("مدل هوش مصنوعی پاسخ نداد. دوباره تلاش کنید.");
    }

    let content = "";
    try {
      const payload = JSON.parse(raw);
      content = payload?.choices?.[0]?.message?.content ?? "";
    } catch {
      throw new Error("پاسخ سرویس هوش مصنوعی قابل خواندن نبود.");
    }

    const generated = extractJson(content);
    return {
      title: String(generated.title || "صفحه جدید دیوساز").slice(0, 160),
      seoTitle: String(generated.seoTitle || generated.title || "").slice(0, 180),
      seoDescription: String(generated.seoDescription || "").slice(0, 320),
      blocks: normalizeBlocks(Array.isArray(generated.blocks) ? generated.blocks : []),
    };
  },
});
