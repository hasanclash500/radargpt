import { action, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const MAX_RESULTS = 8;

type AssistantMatch = {
  ref: string;
  slug: string;
  title: string;
  city: string;
  propertyType: string;
  dealType: string;
  area: number | null;
  rooms: number | null;
  priceMillion: number;
  depositMillion: number | null;
  rentMillion: number | null;
  description: string;
  imageUrl: string | null;
  score: number;
};

type AssistantResponse = {
  answer: string;
  listings: AssistantMatch[];
  ai: boolean;
};

function englishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function normalize(value: string) {
  return englishDigits(value)
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[،؛,:;()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function priceMentions(text: string) {
  const normalized = normalize(text).replace(/٬/g, ",").replace(/٫/g, ".");
  const matches = Array.from(
    normalized.matchAll(/(\d+(?:[.,]\d+)?)\s*(میلیارد|میلیون)(?:\s*تومان)?/g),
  );
  return matches
    .map((match) => {
      const raw = Number(match[1].replace(/,/g, ""));
      if (!Number.isFinite(raw)) return null;
      return {
        million: match[2] === "میلیارد" ? raw * 1000 : raw,
        index: match.index ?? 0,
      };
    })
    .filter((value): value is { million: number; index: number } => Boolean(value));
}

function areaMention(text: string) {
  const normalized = normalize(text);
  const match = normalized.match(/(\d{2,6}(?:\.\d+)?)\s*(?:متر(?:مربع)?|متری)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

const PROPERTY_ALIASES: Array<[string, string[]]> = [
  ["سوله", ["سوله"]],
  ["کارخانه", ["کارخانه"]],
  ["کارگاه", ["کارگاه"]],
  ["انبار", ["انبار"]],
  ["زمین صنعتی", ["زمین صنعتی"]],
  ["زمین", ["زمین"]],
  ["دفتر اداری", ["دفتر اداری", "دفتر کار", "اداری"]],
  ["مغازه", ["مغازه", "تجاری"]],
  ["ویلا", ["ویلا"]],
  ["مسکونی", ["مسکونی", "آپارتمان", "خانه"]],
];

function propertyHint(question: string) {
  const q = normalize(question);
  for (const [canonical, aliases] of PROPERTY_ALIASES) {
    if (aliases.some((alias) => q.includes(alias))) return canonical;
  }
  return "";
}

function dealHint(question: string) {
  const q = normalize(question);
  if (/اجاره|رهن|ودیعه/.test(q)) return "رهن و اجاره";
  if (/فروش|خرید|می.?خرم|بخرم/.test(q)) return "فروش";
  return "";
}

function isListingIntent(question: string) {
  const q = normalize(question);
  return /(ملک|آگهی|فایل|سوله|کارخانه|کارگاه|انبار|زمین|دفتر|اداری|مغازه|ویلا|اجاره|رهن|خرید|فروش|متراژ|قیمت|بودجه)/.test(
    q,
  );
}

function closeness(value: number | null | undefined, target: number, tolerance: number) {
  if (value == null || value <= 0) return 0;
  const distance = Math.abs(value - target) / Math.max(target, 1);
  if (distance <= tolerance) return 1;
  if (distance <= tolerance * 2) return 0.55;
  if (distance <= tolerance * 4) return 0.18;
  return 0;
}

function relevantPrice(row: any, deal: string) {
  if (deal === "رهن و اجاره") {
    return {
      deposit: row.depositMillion ?? null,
      rent: row.rentMillion ?? null,
      sale: null,
    };
  }
  return {
    deposit: null,
    rent: null,
    sale: row.priceMillion ?? null,
  };
}

async function collectMatches(ctx: any, question: string): Promise<AssistantMatch[]> {
  if (!isListingIntent(question)) return [];

  const q = normalize(question);
  const property = propertyHint(question);
  const deal = dealHint(question);
  const area = areaMention(question);
  const prices = priceMentions(question);

  // فقط آگهی‌های عمومی خود مکا وارد موتور پیشنهاد می‌شوند.
  const rows = await ctx.db
    .query("listings")
    .withIndex("by_public_published", (builder: any) => builder.eq("isPublic", true))
    .order("desc")
    .collect();

  const requestedCities = Array.from(
    new Set(
      rows
        .map((row: any) => row.city?.trim())
        .filter(
          (city: string | undefined): city is string =>
            Boolean(city && q.includes(normalize(city))),
        ),
    ),
  );

  const scored = rows.map((row: any) => {
    const haystack = normalize(
      [
        row.title,
        row.description,
        row.city,
        row.propertyType,
        row.dealType,
      ]
        .filter(Boolean)
        .join(" "),
    );

    let score = 0;

    if (property) {
      const aliases =
        PROPERTY_ALIASES.find(([name]) => name === property)?.[1] ?? [property];
      if (aliases.some((alias) => haystack.includes(normalize(alias)))) score += 30;
      else score -= 15;
    }

    if (deal) {
      if (normalize(row.dealType ?? "").includes(normalize(deal))) score += 24;
      else score -= 10;
    }

    if (requestedCities.length > 0) {
      if (row.city && requestedCities.includes(row.city.trim())) score += 32;
      else score -= 45;
    }

    const queryTokens = q
      .split(" ")
      .filter((token) => token.length >= 3 && !/^\d/.test(token))
      .slice(0, 18);
    for (const token of queryTokens) {
      if (haystack.includes(token)) score += 2.5;
    }

    if (area != null) {
      score += 22 * closeness(row.area, area, 0.15);
    }

    if (prices.length > 0) {
      const values = relevantPrice(row, deal);
      for (const target of prices.slice(0, 2)) {
        score +=
          24 *
          Math.max(
            closeness(values.sale, target.million, 0.18),
            closeness(values.deposit, target.million, 0.2),
            closeness(values.rent, target.million, 0.25),
          );
      }
    }

    if (row.featuredOnHome) score += 1.5;
    return { row, score };
  });

  const meaningful = scored
    .filter((item: any) => item.score > 5)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  const hasStructuredConstraint =
    Boolean(property || deal || area != null || prices.length > 0) ||
    requestedCities.length > 0;

  const selected =
    meaningful.length > 0
      ? meaningful
      : hasStructuredConstraint
        ? []
        : scored
            .sort(
              (a: any, b: any) =>
                (b.row.publishedAt ?? b.row.createdAt ?? 0) -
                (a.row.publishedAt ?? a.row.createdAt ?? 0),
            )
            .slice(0, Math.min(4, MAX_RESULTS));

  return await Promise.all(
    selected.map(async ({ row, score }: any, index: number) => {
      const ordered = [...(row.listingImages ?? [])].sort(
        (a: any, b: any) => a.order - b.order,
      );
      const featured =
        ordered.find((image: any) => image.featured) ?? ordered[0] ?? null;
      const imageUrl = featured
        ? await ctx.storage.getUrl(featured.storageId)
        : null;

      return {
        ref: `MEKA-${index + 1}`,
        slug: row.publicSlug ?? "",
        title:
          row.title ||
          `${row.dealType || "آگهی"} ${row.propertyType || "ملک"}${row.area ? ` ${row.area} متری` : ""} در ${row.city || "شهریار"}`,
        city: row.city ?? "شهریار",
        propertyType: row.propertyType ?? "ملک",
        dealType: row.dealType ?? "",
        area: row.area ?? null,
        rooms: row.rooms ?? null,
        priceMillion: row.priceMillion ?? 0,
        depositMillion: row.depositMillion ?? null,
        rentMillion: row.rentMillion ?? null,
        description: (row.description ?? "").replace(/\s+/g, " ").slice(0, 500),
        imageUrl,
        score: Math.round(score * 10) / 10,
      };
    }),
  );
}

export const searchSiteListings = query({
  args: { question: v.string() },
  handler: async (ctx, args): Promise<AssistantMatch[]> => {
    const question = args.question.trim().slice(0, 800);
    if (!question) return [];
    return await collectMatches(ctx, question);
  },
});

export const searchSiteListingsInternal = internalQuery({
  args: { question: v.string() },
  handler: async (ctx, args) => {
    return await collectMatches(ctx, args.question.trim().slice(0, 800));
  },
});

function fallbackAnswer(question: string, matches: AssistantMatch[]) {
  if (isListingIntent(question)) {
    if (matches.length === 0) {
      return "فعلاً آگهی عمومی متناسبی داخل سایت مکا پیدا نکردم. می‌توانید شهر، نوع ملک، متراژ یا حدود قیمت را کمی بازتر بگویید.";
    }
    const exact = matches.slice(0, 3);
    return [
      `${matches.length.toLocaleString("fa-IR")} گزینه از آگهی‌های خود مکا پیدا کردم.`,
      ...exact.map(
        (item: any, index: number) =>
          `${index + 1}) ${item.title} — ${item.city}${item.area ? `، ${item.area.toLocaleString("fa-IR")} متر` : ""}`,
      ),
      "کارت‌های زیر مستقیماً از دیتابیس آگهی‌های مکا هستند.",
    ].join("\n");
  }
  return "دستیار هوشمند مکا آماده است، اما مدل ابری هنوز تنظیم نشده است. جستجوی آگهی‌های خود سایت بدون مدل ابری هم فعال است.";
}

export const ask = action({
  args: { question: v.string() },
  handler: async (ctx, args): Promise<AssistantResponse> => {
    const question = args.question.trim().slice(0, 1200);
    if (!question) throw new Error("سؤال را وارد کنید.");

    const matches: AssistantMatch[] = await ctx.runQuery(
      internal.assistant.searchSiteListingsInternal,
      { question },
    );

    const secrets = await ctx.runQuery(
      internal.integrations.getSecretsInternal,
      {},
    );
    const apiKey = (
      secrets?.openRouterApiKey ||
      process.env.OPENROUTER_API_KEY ||
      ""
    ).trim();
    const model = (
      secrets?.openRouterModel ||
      process.env.OPENROUTER_MODEL ||
      "openrouter/free"
    ).trim();

    if (!apiKey) {
      return {
        answer: fallbackAnswer(question, matches),
        listings: matches,
        ai: false,
      };
    }

    const listingContext = matches.map((item: any) => ({
      ref: item.ref,
      title: item.title,
      city: item.city,
      propertyType: item.propertyType,
      dealType: item.dealType,
      area: item.area,
      rooms: item.rooms,
      priceMillion: item.priceMillion,
      depositMillion: item.depositMillion,
      rentMillion: item.rentMillion,
      description: item.description,
    }));

    const system = [
      "تو دستیار هوشمند املاک مکا هستی و فارسی پاسخ می‌دهی.",
      "قانون قطعی برای جستجو و معرفی ملک: فقط آگهی‌های بخش CANDIDATES که از دیتابیس سایت مکا آمده‌اند مجازند.",
      "هرگز ملک، قیمت، منطقه، لینک یا مشخصاتی را که در CANDIDATES نیست اختراع یا از سایت دیگری پیشنهاد نکن.",
      "اگر CANDIDATES خالی است، صریح بگو در آگهی‌های فعلی مکا گزینه متناسب پیدا نشد.",
      "اگر کاربر رنج قیمت/متراژ گفته، گزینه‌های نزدیک را هم با بیان اینکه نزدیک هستند معرفی کن.",
      "برای سؤال حقوقی ملک، فقط اطلاعات عمومی و آموزشی بده و روشن بگو برای تصمیم یا دعوای حقوقی باید مدارک توسط وکیل/کارشناس بررسی شود.",
      "آدرس دقیق، محله خصوصی، شماره مالک و اطلاعات داخلی را افشا نکن.",
      "برای اشاره به ملک فقط refهای MEKA-* موجود را استفاده کن.",
      "خلاصه و کاربردی پاسخ بده.",
    ].join("\n");

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.SITE_URL ?? "https://meka.ir",
          "X-Title": "MEKA Real Estate Assistant",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content:
                `QUESTION:\n${question}\n\nCANDIDATES_FROM_MEKA_ONLY:\n${JSON.stringify(
                  listingContext,
                )}`,
            },
          ],
          temperature: 0.25,
          max_tokens: 900,
        }),
      });

      if (!response.ok) {
        return {
          answer: fallbackAnswer(question, matches),
          listings: matches,
          ai: false,
        };
      }

      const payload: any = await response.json();
      const answer =
        payload?.choices?.[0]?.message?.content?.trim() ||
        fallbackAnswer(question, matches);

      return {
        answer,
        listings: matches,
        ai: true,
      };
    } catch {
      return {
        answer: fallbackAnswer(question, matches),
        listings: matches,
        ai: false,
      };
    }
  },
});
