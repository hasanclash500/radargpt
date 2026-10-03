import { query } from "./_generated/server";
import { canManageListings, currentRole } from "./permissions";

function normalize(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .toLowerCase()
    .replace(/[،؛,:;()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function amounts(text = "") {
  const value = normalize(text).replace(/٬/g, ",").replace(/٫/g, ".");
  return Array.from(
    value.matchAll(/(\d+(?:[.,]\d+)?)\s*(میلیارد|میلیون)(?:\s*تومان)?/g),
  )
    .map((match) => {
      const number = Number(match[1].replace(/,/g, ""));
      if (!Number.isFinite(number)) return null;
      return {
        million: match[2] === "میلیارد" ? number * 1000 : number,
        index: match.index ?? 0,
      };
    })
    .filter((item): item is { million: number; index: number } => Boolean(item));
}

function labeledAmount(text: string, labels: string[]) {
  const normalized = normalize(text);
  let best: number | null = null;
  for (const label of labels) {
    let cursor = normalized.indexOf(label);
    while (cursor >= 0) {
      const window = normalized.slice(cursor, cursor + 70);
      const found = amounts(window)[0]?.million;
      if (found != null) {
        best = found;
        break;
      }
      cursor = normalized.indexOf(label, cursor + label.length);
    }
    if (best != null) break;
  }
  return best;
}

function genericBudget(text: string) {
  const values = amounts(text).map((item) => item.million);
  if (values.length === 0) return null;
  if (values.length === 1) return { min: values[0] * 0.82, max: values[0] * 1.18, target: values[0] };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    target: (sorted[0] + sorted[sorted.length - 1]) / 2,
  };
}

function similarity(value: number | null | undefined, target: number, good = 0.18) {
  if (value == null || value <= 0 || target <= 0) return 0;
  const distance = Math.abs(value - target) / target;
  if (distance <= good) return 1;
  if (distance <= good * 1.7) return 0.65;
  if (distance <= good * 2.8) return 0.3;
  return 0;
}

function propertyMatch(leadType: string, listingType: string, title: string, description: string) {
  const lead = normalize(leadType);
  const haystack = normalize([listingType, title, description].join(" "));
  if (!lead || lead === "سایر") return 0.5;
  if (haystack.includes(lead)) return 1;

  const aliases: Record<string, string[]> = {
    "دفتر اداری": ["اداری", "دفتر کار", "واحد اداری"],
    "سوله": ["سوله", "صنعتی"],
    "کارخانه": ["کارخانه", "صنعتی"],
    "کارگاه": ["کارگاه", "صنعتی"],
    "انبار": ["انبار", "صنعتی"],
    "زمین صنعتی": ["زمین صنعتی", "زمین", "صنعتی"],
    "مسکونی": ["آپارتمان", "خانه", "مسکونی"],
  };
  const options = aliases[leadType] ?? [lead];
  return options.some((option) => haystack.includes(normalize(option))) ? 0.82 : 0;
}

function dealMatches(intent: string, dealType: string) {
  const deal = normalize(dealType);
  if (intent === "buy") return /فروش|پیش فروش/.test(deal);
  if (intent === "rent") return /اجاره|رهن/.test(deal);
  return false;
}

function matchLabel(score: number) {
  if (score >= 82) return "خیلی نزدیک";
  if (score >= 68) return "مناسب";
  if (score >= 52) return "نزدیک";
  return "قابل بررسی";
}

function tokenOverlap(details: string, row: any) {
  const tokens = normalize(details)
    .split(" ")
    .filter((token) => token.length >= 3 && !/^\d/.test(token))
    .slice(0, 18);
  if (tokens.length === 0) return 0;
  const haystack = normalize(
    [row.title, row.description, row.city, row.propertyType, row.dealType]
      .filter(Boolean)
      .join(" "),
  );
  const hits = tokens.filter((token) => haystack.includes(token)).length;
  return Math.min(1, hits / Math.min(tokens.length, 6));
}

export const listSmartMatches = query({
  args: {},
  handler: async (ctx) => {
    const current = await currentRole(ctx);
    if (!current || !canManageListings(current.role)) {
      return { allowed: false, groups: [] };
    }

    const [leads, listings] = await Promise.all([
      ctx.db
        .query("propertyLeads")
        .withIndex("by_created")
        .order("desc")
        .take(200),
      ctx.db.query("listings").order("desc").take(6000),
    ]);

    const activeLeads = leads.filter(
      (lead) =>
        (lead.intent === "buy" || lead.intent === "rent") &&
        lead.status !== "closed",
    );

    const groups = [];

    for (const lead of activeLeads) {
      const budgetText = [lead.budget, lead.details].filter(Boolean).join(" ");
      const generic = genericBudget(budgetText);
      const depositTarget = labeledAmount(budgetText, ["ودیعه", "رهن"]);
      const rentTarget = labeledAmount(budgetText, ["اجاره"]);
      const city = normalize(lead.city);
      const leadArea = lead.area ?? null;

      const candidates = listings
        .filter((row) => dealMatches(lead.intent, row.dealType ?? ""))
        .map((row) => {
          let score = 22;
          const reasons: string[] = ["نوع معامله هماهنگ"];

          const rowCity = normalize(row.city ?? "");
          if (city && rowCity === city) {
            score += 24;
            reasons.push("شهر یکسان");
          } else if (city && (rowCity.includes(city) || city.includes(rowCity))) {
            score += 16;
            reasons.push("محدوده شهری نزدیک");
          }

          const typeScore = propertyMatch(
            lead.propertyType,
            row.propertyType ?? "",
            row.title ?? "",
            row.description ?? "",
          );
          score += 22 * typeScore;
          if (typeScore >= 0.8) reasons.push("نوع ملک منطبق");

          if (leadArea != null && leadArea > 0) {
            const areaScore = similarity(row.area, leadArea, 0.15);
            score += 18 * areaScore;
            if (areaScore >= 0.65) reasons.push("متراژ نزدیک");
          }

          if (lead.intent === "buy" && generic) {
            const priceScore = similarity(row.priceMillion, generic.target, 0.2);
            score += 22 * priceScore;
            if (priceScore >= 0.65) reasons.push("قیمت نزدیک بودجه");
          }

          if (lead.intent === "rent") {
            let financeScore = 0;
            let financeParts = 0;
            if (depositTarget != null) {
              financeScore += similarity(row.depositMillion, depositTarget, 0.22);
              financeParts++;
            }
            if (rentTarget != null) {
              financeScore += similarity(row.rentMillion, rentTarget, 0.28);
              financeParts++;
            }
            if (financeParts === 0 && generic) {
              financeScore = similarity(row.depositMillion, generic.target, 0.25);
              financeParts = 1;
            }
            if (financeParts > 0) {
              const normalizedFinance = financeScore / financeParts;
              score += 22 * normalizedFinance;
              if (normalizedFinance >= 0.6) reasons.push("رهن/اجاره نزدیک بودجه");
            }
          }

          const detailsScore = tokenOverlap(lead.details ?? "", row);
          score += 8 * detailsScore;
          if (detailsScore >= 0.45) reasons.push("توضیحات مشابه نیاز متقاضی");

          if (row.isPublic) score += 2;
          score = Math.max(0, Math.min(100, Math.round(score)));

          return { row, score, reasons };
        })
        .filter((item) => item.score >= 42)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      const matches = await Promise.all(
        candidates.map(async ({ row, score, reasons }) => {
          const images = [...(row.listingImages ?? [])].sort(
            (a, b) => a.order - b.order,
          );
          const featured = images.find((image) => image.featured) ?? images[0];
          const imageUrl = featured
            ? await ctx.storage.getUrl(featured.storageId)
            : null;

          return {
            score,
            label: matchLabel(score),
            reasons: reasons.slice(0, 5),
            listing: {
              id: row._id,
              key: row.key,
              title:
                row.title ||
                `${row.dealType || "آگهی"} ${row.propertyType || "ملک"}${row.area ? ` ${row.area} متری` : ""} در ${row.city || "شهریار"}`,
              city: row.city ?? "",
              propertyType: row.propertyType ?? "",
              dealType: row.dealType ?? "",
              area: row.area ?? null,
              priceMillion: row.priceMillion ?? 0,
              depositMillion: row.depositMillion ?? null,
              rentMillion: row.rentMillion ?? null,
              phone: row.phone ?? "",
              isPublic: row.isPublic ?? false,
              publicSlug: row.publicSlug ?? "",
              publicationStatus:
                row.publicationStatus ?? (row.isPublic ? "approved" : "private"),
              imageUrl,
            },
          };
        }),
      );

      groups.push({
        lead: {
          id: lead._id,
          name: lead.name,
          phone: lead.phone,
          intent: lead.intent,
          city: lead.city,
          propertyType: lead.propertyType,
          area: lead.area ?? null,
          budget: lead.budget ?? "",
          details: lead.details ?? "",
          status: lead.status,
          createdAt: lead.createdAt,
        },
        matches,
      });
    }

    return {
      allowed: true,
      groups: groups
        .filter((group) => group.matches.length > 0)
        .sort(
          (a, b) =>
            (b.matches[0]?.score ?? 0) - (a.matches[0]?.score ?? 0),
        ),
    };
  },
});
