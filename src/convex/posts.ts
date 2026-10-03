import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { OFFICE_ROLES } from "./schema";
import { roleForUser } from "./permissions";

const editorRoles = new Set<string>([OFFICE_ROLES.MANAGER]);

async function getEditor(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;

  const role = await roleForUser(ctx, String(userId));
  if (!editorRoles.has(role)) return null;

  const user = await ctx.db.get(userId);
  return {
    userId: String(userId),
    name: user?.name || user?.email || "تیم مکا",
  };
}

function cleanSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);
}

async function assertUniqueSlug(ctx: any, slug: string, ignoreId?: string) {
  const matches = await ctx.db
    .query("posts")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .take(2);

  if (matches.some((post: any) => String(post._id) !== ignoreId)) {
    throw new Error("این آدرس قبلاً برای مقاله دیگری استفاده شده است.");
  }
}

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const saved = await ctx.db
      .query("posts")
      .withIndex("by_status_published", (q) => q.eq("status", "published"))
      .order("desc")
      .take(100);

    if (saved.length > 0) return saved;
    return [publicSeedPost(INDUSTRIAL_RENT, 0), publicSeedPost(OFFICE_RENT, 1)];
  },
});

export const getPublishedBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (post?.status === "published") return post;

    const seed = [INDUSTRIAL_RENT, OFFICE_RENT].find((item) => item.slug === args.slug);
    return seed ? publicSeedPost(seed, seed.slug === INDUSTRIAL_RENT.slug ? 0 : 1) : null;
  },
});

export const listManage = query({
  args: {},
  handler: async (ctx) => {
    const editor = await getEditor(ctx);
    if (!editor) return [];
    return await ctx.db.query("posts").withIndex("by_updated").order("desc").take(200);
  },
});

export const getForEdit = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const editor = await getEditor(ctx);
    if (!editor) return null;
    return await ctx.db.get(args.id);
  },
});

export const save = mutation({
  args: {
    id: v.optional(v.id("posts")),
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.string(),
    category: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    focusKeyword: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    canonicalUrl: v.optional(v.string()),
    ogTitle: v.optional(v.string()),
    ogDescription: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    noIndex: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const editor = await getEditor(ctx);
    if (!editor) throw new Error("دسترسی ویرایش وبلاگ را ندارید.");

    const title = args.title.trim();
    const content = args.content.trim();
    const slug = cleanSlug(args.slug || title);
    if (title.length < 5) throw new Error("عنوان مقاله خیلی کوتاه است.");
    if (content.length < 100) throw new Error("متن مقاله خیلی کوتاه است.");
    if (!slug) throw new Error("آدرس مقاله معتبر نیست.");

    await assertUniqueSlug(ctx, slug, args.id ? String(args.id) : undefined);

    const now = Date.now();
    const payload = {
      title,
      slug,
      excerpt: args.excerpt?.trim() || undefined,
      content,
      category: args.category?.trim() || undefined,
      featuredImage: args.featuredImage?.trim() || undefined,
      status: args.status,
      authorId: editor.userId,
      authorName: editor.name,
      metaTitle: args.metaTitle?.trim() || undefined,
      metaDescription: args.metaDescription?.trim() || undefined,
      focusKeyword: args.focusKeyword?.trim() || undefined,
      keywords: args.keywords?.map((k) => k.trim()).filter(Boolean) || undefined,
      canonicalUrl: args.canonicalUrl?.trim() || undefined,
      ogTitle: args.ogTitle?.trim() || undefined,
      ogDescription: args.ogDescription?.trim() || undefined,
      ogImage: args.ogImage?.trim() || undefined,
      noIndex: args.noIndex ?? false,
      updatedAt: now,
    };

    if (args.id) {
      const current = await ctx.db.get(args.id);
      if (!current) throw new Error("مقاله پیدا نشد.");
      await ctx.db.patch(args.id, {
        ...payload,
        publishedAt:
          args.status === "published"
            ? current.publishedAt ?? now
            : current.publishedAt,
      });
      return args.id;
    }

    return await ctx.db.insert("posts", {
      ...payload,
      publishedAt: args.status === "published" ? now : undefined,
      createdAt: now,
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const editor = await getEditor(ctx);
    if (!editor) throw new Error("دسترسی آپلود تصویر را ندارید.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const resolveStorageUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const editor = await getEditor(ctx);
    if (!editor) throw new Error("دسترسی تصویر را ندارید.");
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const editor = await getEditor(ctx);
    if (!editor) return null;
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const editor = await getEditor(ctx);
    if (!editor) throw new Error("دسترسی حذف مقاله را ندارید.");
    await ctx.db.delete(args.id);
    return true;
  },
});

const INDUSTRIAL_RENT = {
  title: "راهنمای اجاره املاک صنعتی در شهریار؛ از انتخاب سوله تا قرارداد مطمئن",
  slug: "industrial-property-rent-shahriar",
  excerpt:
    "برای اجاره سوله، کارخانه یا کارگاه فقط متراژ و مبلغ اجاره کافی نیست. در این راهنما مهم‌ترین معیارهای فنی، دسترسی، مجوزها و بندهای قرارداد املاک صنعتی را بررسی می‌کنیم.",
  category: "املاک صنعتی",
  metaTitle: "اجاره املاک صنعتی در شهریار | راهنمای انتخاب سوله و کارخانه",
  metaDescription:
    "راهنمای حرفه‌ای اجاره املاک صنعتی در شهریار؛ بررسی سوله، کارخانه و کارگاه از نظر برق، گاز، دسترسی، مجوز، قرارداد و هزینه‌های پنهان.",
  focusKeyword: "اجاره املاک صنعتی در شهریار",
  keywords: [
    "اجاره املاک صنعتی",
    "اجاره سوله شهریار",
    "اجاره کارخانه شهریار",
    "اجاره کارگاه شهریار",
    "ملک صنعتی شهریار",
  ],
  content: `## اجاره ملک صنعتی؛ تصمیمی فراتر از قیمت هر متر

اجاره یک سوله، کارخانه یا کارگاه با اجاره یک ملک معمولی تفاوت اساسی دارد. در املاک صنعتی، اشتباه در انتخاب ملک می‌تواند مستقیماً روی تولید، لجستیک، مجوز فعالیت و حتی هزینه انرژی کسب‌وکار اثر بگذارد. به همین دلیل قبل از مقایسه مبلغ رهن و اجاره باید مشخص کنید ملک قرار است دقیقاً چه نقشی در عملیات مجموعه شما داشته باشد.

برای شروع، نوع فعالیت، متراژ مفید مورد نیاز، تعداد نیروی انسانی، حجم ورود و خروج کالا، نوع ماشین‌آلات و نیاز به انبار را مشخص کنید. این اطلاعات باعث می‌شود بین یک سوله ساده، کارگاه، کارخانه آماده یا زمین صنعتی انتخاب دقیق‌تری داشته باشید.

## موقعیت و دسترسی؛ یکی از مهم‌ترین عوامل ارزش ملک صنعتی

برای بسیاری از کسب‌وکارها فاصله تا جاده‌های اصلی و مسیر تردد کامیون از خود ساختمان مهم‌تر است. هنگام بازدید ملک صنعتی در شهریار و اطراف آن، مسیر دسترسی خودروهای سنگین را در ساعات مختلف بررسی کنید. عرض معبر، امکان دور زدن کامیون، محدودیت تردد، فاصله تا مسیرهای اصلی و وضعیت آسفالت می‌تواند روی هزینه حمل‌ونقل روزانه اثر قابل توجهی داشته باشد.

اگر مشتری یا نیروی اداری نیز به محل رفت‌وآمد دارد، دسترسی خودروی سواری و حمل‌ونقل عمومی را جداگانه بررسی کنید.

## برق، گاز و زیرساخت را قبل از قرارداد بررسی کنید

یکی از رایج‌ترین مشکلات در اجاره املاک صنعتی، کافی نبودن زیرساخت انرژی است. تنها به عبارت «برق صنعتی دارد» اکتفا نکنید. آمپراژ، سه‌فاز بودن، ظرفیت کنتور و امکان افزایش ظرفیت باید با نیاز دستگاه‌های شما مقایسه شود.

در مورد گاز نیز ظرفیت انشعاب و محدودیت مصرف مهم است. اگر فعالیت شما مصرف آب بالایی دارد، وضعیت آب، مخزن، چاه یا انشعاب را بررسی کنید. برای کسب‌وکارهایی که وابسته به اینترنت هستند، پوشش اینترنت ثابت و موبایل نیز باید قبل از جابه‌جایی تست شود.

## ارتفاع سقف، کف‌سازی و سازه را جدی بگیرید

متراژ اعلام‌شده فقط یکی از اعداد مهم است. ارتفاع مفید سوله، فاصله ستون‌ها، مقاومت کف، محل ورود ماشین‌آلات و ابعاد درب‌ها را اندازه‌گیری کنید. اگر لیفتراک یا قفسه‌بندی سنگین دارید، کیفیت کف و ظرفیت سازه اهمیت بیشتری پیدا می‌کند.

وجود جرثقیل سقفی نیز به‌تنهایی مزیت نیست؛ ظرفیت، سلامت فنی و مدارک آن باید متناسب با کار شما باشد.

## کاربری و مجوز فعالیت را قبل از پرداخت بیعانه مشخص کنید

ممکن است یک ملک از نظر ظاهری برای فعالیت شما مناسب باشد اما امکان دریافت یا انتقال مجوز لازم را نداشته باشد. قبل از پرداخت مبلغ جدی، درباره کاربری ملک، محدودیت‌های منطقه و شرایط فعالیت صنف خود استعلام بگیرید.

اگر ملک داخل شهرک یا مجموعه صنعتی قرار دارد، مقررات داخلی، هزینه شارژ، ساعات تردد و ضوابط فعالیت را نیز بررسی کنید.

## هزینه‌های پنهان اجاره ملک صنعتی

هنگام محاسبه بودجه فقط رهن و اجاره را نبینید. هزینه آماده‌سازی برق، نصب تجهیزات، اصلاح کف، تعمیر سقف، سیستم اطفای حریق، امنیت، نگهبانی و جابه‌جایی ماشین‌آلات ممکن است بخش بزرگی از سرمایه اولیه شما را مصرف کند.

بهتر است قبل از تصمیم نهایی یک برآورد جداگانه برای «هزینه ورود به ملک» داشته باشید. گاهی ملکی با اجاره بالاتر اما زیرساخت آماده، در مجموع اقتصادی‌تر از گزینه ارزان‌تر است.

## در قرارداد اجاره صنعتی چه بندهایی مهم است؟

قرارداد باید دقیقاً روشن کند مسئول تعمیرات اساسی و جاری چه کسی است. وضعیت تجهیزات تحویلی، انشعابات، بدهی قبلی، خسارت احتمالی، حق نصب تابلو و تجهیزات، امکان تغییرات داخلی و شرایط بازگرداندن ملک در پایان قرارداد باید مکتوب شود.

اگر برای تجهیز ملک سرمایه‌گذاری قابل توجهی انجام می‌دهید، مدت قرارداد و امکان تمدید اهمیت ویژه‌ای دارد. توافق شفاهی درباره تمدید نمی‌تواند جای بند روشن قراردادی را بگیرد.

## چک‌لیست بازدید قبل از اجاره

در بازدید حضوری، فقط فضای اصلی را نبینید. محوطه، پارکینگ، نگهبانی، سرویس‌ها، دفتر اداری، انبار، سقف، دیوارها، مسیر آب باران و نقاط احتمالی رطوبت را بررسی کنید. بهتر است فیلم کوتاهی از مسیر دسترسی و وضعیت فعلی ملک داشته باشید تا بعداً گزینه‌ها را دقیق‌تر مقایسه کنید.

همچنین ساعات مختلف روز را در نظر بگیرید؛ ترافیک، صدای محیط و فعالیت همسایه‌ها در تصمیم نهایی اثر دارد.

## جمع‌بندی

اجاره املاک صنعتی زمانی تصمیم خوبی است که ملک با فرآیند واقعی کسب‌وکار شما هماهنگ باشد. قیمت مناسب بدون زیرساخت، دسترسی یا مجوز مناسب می‌تواند هزینه‌های بیشتری ایجاد کند.

مکا با تمرکز بر املاک صنعتی و اداری شهریار تلاش می‌کند قبل از بازدید، گزینه‌ها را بر اساس نوع فعالیت، متراژ، بودجه و نیاز زیرساختی محدود کند تا زمان کمتری صرف فایل‌های نامرتبط شود.

برای بررسی فایل‌های اجاره سوله، کارخانه و کارگاه در شهریار می‌توانید با مکا تماس بگیرید: 09120858095.`,
};

const OFFICE_RENT = {
  title: "راهنمای اجاره واحد اداری در شهریار؛ انتخاب دفتر مناسب برای کسب‌وکار",
  slug: "office-unit-rent-shahriar",
  excerpt:
    "دفتر مناسب فقط یک فضای زیبا نیست. دسترسی، پارکینگ، موقعیت ساختمان، هزینه شارژ و امکان توسعه تیم از مهم‌ترین معیارهای اجاره واحد اداری هستند.",
  category: "املاک اداری",
  metaTitle: "اجاره واحد اداری در شهریار | راهنمای انتخاب دفتر کار مناسب",
  metaDescription:
    "راهنمای اجاره واحد اداری در شهریار؛ بررسی موقعیت، پارکینگ، دسترسی، کاربری اداری، قرارداد، شارژ و نکات مهم انتخاب دفتر برای شرکت‌ها.",
  focusKeyword: "اجاره واحد اداری در شهریار",
  keywords: [
    "اجاره واحد اداری",
    "اجاره دفتر شهریار",
    "دفتر کار شهریار",
    "ملک اداری شهریار",
    "رهن دفتر اداری",
  ],
  content: `## دفتر کار مناسب چه ویژگی‌هایی دارد؟

اجاره واحد اداری روی تصویر برند، تجربه مشتری و کیفیت کار تیم اثر می‌گذارد. بنابراین انتخاب دفتر را نباید فقط به متراژ و قیمت محدود کرد. دفتر مناسب باید با مدل کاری شما هماهنگ باشد؛ یک شرکت خدماتی که مراجعه حضوری زیادی دارد نیاز متفاوتی با تیمی دارد که بیشتر جلسات آنلاین برگزار می‌کند.

قبل از جست‌وجو تعداد نفرات فعلی، رشد احتمالی تیم، تعداد اتاق‌های مورد نیاز، فضای جلسه، بایگانی، پذیرش و ساعت کاری را مشخص کنید.

## موقعیت ساختمان و دسترسی مشتریان

اگر مشتری حضوری دارید، پیدا کردن آدرس باید ساده باشد. نزدیکی به خیابان‌های اصلی، امکان توقف کوتاه خودرو و خوانا بودن پلاک ساختمان اهمیت دارد. برای تیم‌های پرسنلی نیز دسترسی به تاکسی و حمل‌ونقل عمومی می‌تواند روی رضایت کارکنان اثر مستقیم داشته باشد.

در شهریار، تفاوت چند خیابان می‌تواند روی ترافیک، جای پارک و سرعت دسترسی مشتریان اثر زیادی بگذارد. مسیر را در ساعات شلوغی نیز بررسی کنید.

## پارکینگ را به‌عنوان یک مزیت واقعی بسنجید

عبارت «پارکینگ دارد» همیشه به معنی حل مشکل نیست. مشخص کنید پارکینگ اختصاصی است یا مزاحم، سندی است یا توافقی و آیا برای مراجعه‌کنندگان نیز فضای توقف وجود دارد.

برای کسب‌وکارهایی مانند دفتر مهندسی، شرکت بازرگانی، کلینیک خدماتی یا مجموعه‌ای با مراجعه روزانه، کمبود پارکینگ می‌تواند به یک مشکل دائمی تبدیل شود.

## کاربری اداری و مقررات ساختمان

قبل از قرارداد درباره کاربری واحد و امکان فعالیت مورد نظر خود مطمئن شوید. بعضی ساختمان‌ها محدودیت تابلو، ساعات کاری یا رفت‌وآمد مراجعه‌کننده دارند. اگر شرکت شما نیاز به نصب تابلو، حضور نیرو در ساعات غیراداری یا مراجعه زیاد مشتری دارد، این موارد را از مدیر ساختمان سؤال کنید.

هزینه شارژ و خدماتی که در برابر آن دریافت می‌کنید نیز باید شفاف باشد.

## کیفیت اینترنت و آنتن‌دهی

برای بسیاری از شرکت‌ها اینترنت جزو زیرساخت‌های اصلی دفتر است. پیش از اجاره بررسی کنید چه سرویس‌هایی در ساختمان قابل ارائه است. در واحد مورد نظر سرعت اینترنت موبایل را نیز تست کنید.

اگر تلفن ثابت، مرکز تماس، دوربین آنلاین یا سیستم ابری دارید، امکان کابل‌کشی و تجهیزات شبکه را از قبل در نظر بگیرید.

## نور، چیدمان و استفاده واقعی از متراژ

دو دفتر با متراژ یکسان می‌توانند ظرفیت کاملاً متفاوتی داشته باشند. راهروهای زیاد، ستون‌های نامناسب یا اتاق‌های کوچک بخشی از متراژ را غیرقابل استفاده می‌کنند. در بازدید، جای میزها، اتاق جلسه، پذیرش و مسیر رفت‌وآمد را در ذهن شبیه‌سازی کنید.

نور طبیعی، تهویه و صدای محیط نیز روی کیفیت حضور طولانی کارکنان تأثیر دارد.

## ساختمان و اعتبار کسب‌وکار

ورودی ساختمان، آسانسور، لابی و وضعیت مشاعات بخشی از تجربه مشتری از برند شماست. لازم نیست همیشه لوکس‌ترین ساختمان را انتخاب کنید؛ مهم این است که سطح ساختمان با نوع مشتری و جایگاه کسب‌وکار شما هماهنگ باشد.

برای بعضی شرکت‌ها یک دفتر ساده با دسترسی عالی ارزش بیشتری از ساختمانی لوکس با مسیر دشوار دارد.

## هزینه واقعی دفتر فقط اجاره نیست

شارژ ماهانه، هزینه پارکینگ، اینترنت، نگهداری، سرمایش و گرمایش و تغییرات اولیه را به بودجه اضافه کنید. اگر واحد نیاز به پارتیشن، رنگ، نورپردازی یا کابل‌کشی دارد، این هزینه‌ها را قبل از قرارداد برآورد کنید.

همچنین مدت زمان آماده‌سازی دفتر را در نظر بگیرید؛ تأخیر در جابه‌جایی می‌تواند هزینه دو محل هم‌زمان ایجاد کند.

## نکات مهم قرارداد اجاره واحد اداری

مشخصات دقیق پارکینگ و انباری، مبلغ شارژ، مسئولیت تعمیرات، اجازه نصب تابلو، نحوه افزایش اجاره در تمدید و شرایط فسخ باید شفاف باشد. اگر تغییرات داخلی انجام می‌دهید، توافق کنید کدام تغییرات باید هنگام تخلیه به حالت قبل برگردد.

برای شرکت‌ها بهتر است امکان استفاده از آدرس در مکاتبات و امور ثبتی نیز از ابتدا بررسی شود.

## جمع‌بندی

بهترین واحد اداری، دفتری است که هم برای تیم کارآمد باشد و هم مراجعه مشتری را آسان کند. ترکیب دسترسی، پارکینگ، کاربری، کیفیت ساختمان و هزینه واقعی باید کنار هم سنجیده شود.

مکا در حوزه املاک صنعتی و اداری شهریار فعالیت می‌کند و می‌تواند بر اساس تعداد نیرو، نوع فعالیت، بودجه و محدوده مورد نظر، گزینه‌های مرتبط‌تری برای بازدید پیشنهاد دهد.

برای دریافت فایل‌های اجاره واحد اداری در شهریار با شماره 09120858095 تماس بگیرید.`,
};

function publicSeedPost(seed: typeof INDUSTRIAL_RENT | typeof OFFICE_RENT, index: number) {
  const timestamp = Date.now() - (index + 1) * 86400000;
  return {
    _id: `seed-${index}`,
    _creationTime: timestamp,
    ...seed,
    status: "published" as const,
    authorId: undefined,
    authorName: "تیم مکا",
    featuredImage: undefined,
    canonicalUrl: undefined,
    ogTitle: undefined,
    ogDescription: undefined,
    ogImage: undefined,
    noIndex: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: timestamp,
  };
}

export const ensureSeedPosts = mutation({
  args: {},
  handler: async (ctx) => {
    const editor = await getEditor(ctx);
    if (!editor) throw new Error("دسترسی ایجاد مقالات اولیه را ندارید.");

    const seeds = [INDUSTRIAL_RENT, OFFICE_RENT];
    const now = Date.now();
    let created = 0;

    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const existing = await ctx.db
        .query("posts")
        .withIndex("by_slug", (q) => q.eq("slug", seed.slug))
        .take(1);
      if (existing.length) continue;

      await ctx.db.insert("posts", {
        ...seed,
        status: "published",
        authorId: editor.userId,
        authorName: "تیم مکا",
        noIndex: false,
        createdAt: now - (i + 1) * 86400000,
        updatedAt: now - (i + 1) * 86400000,
        publishedAt: now - (i + 1) * 86400000,
      });
      created++;
    }

    return { created };
  },
});
