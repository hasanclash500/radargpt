import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { toEnglishDigits, type Listing as ListingRow } from "../lib/parser";
import { OFFICE_ROLES, PRIVILEGED_ROLES, type OfficeRole } from "./schema";

type Ctx = { db: QueryCtx["db"]; auth: QueryCtx["auth"] };

async function resolve(ctx: Ctx): Promise<{
  role: OfficeRole;
  privileged: boolean;
  userId: string;
} | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;

  const profs = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(2);
  const prof = profs[0];
  const role = (prof?.officeRole ?? OFFICE_ROLES.GUEST) as OfficeRole;
  return {
    role,
    privileged: PRIVILEGED_ROLES.includes(role),
    userId: String(userId),
  };
}

async function globalSettings(ctx: Ctx) {
  const rows = await ctx.db
    .query("appSettings")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .take(2);
  return rows[0] ?? null;
}

async function managerPhone(ctx: Ctx): Promise<string> {
  return (await globalSettings(ctx))?.managerPhone ?? "09120858095";
}

async function byKey(ctx: Ctx, key: string): Promise<Doc<"listings"> | null> {
  const rows = await ctx.db
    .query("listings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .take(2);
  return rows[0] ?? null;
}

function cleanSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06ff-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 95);
}

function shortHash(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).slice(0, 7);
}

function makePublicSlug(row: Doc<"listings">) {
  const parts = [
    row.dealType,
    row.propertyType,
    row.area ? `${row.area}-متر` : "",
    row.city,
  ].filter(Boolean);
  const base = cleanSlug(parts.join(" ")) || "melk";
  return `${base}-${shortHash(row.key)}`;
}

function autoSeoTitle(row: Doc<"listings">) {
  const type = row.propertyType || "ملک";
  const deal = row.dealType || "آگهی";
  const area = row.area ? ` ${row.area} متری` : "";
  const city = row.city || "شهریار";
  return `${deal} ${type}${area} در ${city} | مکا`.slice(0, 65);
}

function autoSeoDescription(row: Doc<"listings">) {
  const details = [
    row.dealType,
    row.propertyType,
    row.area ? `${row.area} متر` : "",
    row.city ? `در ${row.city}` : "",
    row.depositMillion != null ? `ودیعه ${row.depositMillion} میلیون` : "",
    row.rentMillion != null ? `اجاره ${row.rentMillion} میلیون` : "",
    row.priceMillion ? `قیمت ${row.priceMillion} میلیون تومان` : "",
  ]
    .filter(Boolean)
    .join("، ");
  const excerpt = (row.description ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  return `${details}. ${excerpt} برای اطلاعات و هماهنگی بازدید با مکا تماس بگیرید.`
    .replace(/\s+/g, " ")
    .slice(0, 160);
}

function toListing(row: Doc<"listings">, contactPhone: string): ListingRow {
  return {
    id: row.key,
    radarCode: row.radarCode ?? "",
    city: row.city ?? "نامشخص",
    cityLabel: row.city ?? "نامشخص",
    neighborhood: row.neighborhood ?? "",
    area: row.area ?? null,
    rooms: row.rooms ?? null,
    priceMillion: row.priceMillion ?? 0,
    priceRaw: "",
    depositMillion: row.depositMillion ?? null,
    rentMillion: row.rentMillion ?? null,
    pricePerMeter: row.pricePerMeter ?? null,
    dealType: (row.dealType ?? "سایر") as ListingRow["dealType"],
    propertyType: (row.propertyType ?? "سایر") as ListingRow["propertyType"],
    title: row.title ?? "",
    description: row.description ?? "",
    phone: contactPhone,
    divarUrl: row.divarUrl ?? "",
    mapsUrl: row.mapsUrl ?? "",
    date: row.date ?? "",
    dateRaw: row.dateRaw ?? "",
    poster: row.poster ?? "",
    address: row.address ?? "",
    notes: row.notes,
    folderIds: row.folderIds,
    contactPhone,
    createdByUserId: row.createdByUserId,
    isPublic: row.isPublic ?? false,
    featuredOnHome: row.featuredOnHome ?? false,
    publicSlug: row.publicSlug,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoKeywords: row.seoKeywords,
    noIndex: row.noIndex ?? false,
  };
}

async function publicContext(ctx: Ctx) {
  const settings = await globalSettings(ctx);
  const profiles = await ctx.db.query("userProfiles").collect();
  return {
    officeName: settings?.officeName || "مکا",
    managerPhone: settings?.managerPhone || "09120858095",
    profiles,
  };
}

function defaultImageAlt(row: Doc<"listings">, index: number) {
  const area = row.area ? ` ${row.area} متری` : "";
  return [
    row.dealType || "آگهی",
    row.propertyType || "ملک",
    area,
    "در",
    row.city || "شهریار",
    index > 0 ? `- تصویر ${index + 1}` : "",
    "| مکا",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function resolveListingImages(ctx: Ctx, row: Doc<"listings">) {
  const ordered = [...(row.listingImages ?? [])].sort((a, b) => a.order - b.order);
  const resolved = await Promise.all(
    ordered.map(async (image, index) => ({
      storageId: image.storageId,
      url: await ctx.storage.getUrl(image.storageId),
      alt: image.alt.trim() || defaultImageAlt(row, index),
      order: image.order,
      featured: image.featured,
    })),
  );
  return resolved.filter((image) => Boolean(image.url));
}

async async function toPublicListing(
  ctx: Ctx,
  row: Doc<"listings">,
  context: Awaited<ReturnType<typeof publicContext>>,
) {
  const contacts: { name: string; phone: string; role: string }[] = [];
  if (context.managerPhone) {
    contacts.push({
      name: context.officeName || "مکا",
      phone: context.managerPhone,
      role: "مدیر",
    });
  }

  if (row.createdByUserId) {
    const creator = context.profiles.find(
      (profile) => profile.userId === row.createdByUserId,
    );
    const phone = creator?.publicPhone ?? "";
    if (phone && !contacts.some((item) => item.phone === phone)) {
      contacts.push({
        name: creator?.displayName || "مشاور مکا",
        phone,
        role: "مشاور ثبت‌کننده",
      });
    }
  }

  const images = await resolveListingImages(ctx, row);
  const featuredImage = images.find((image) => image.featured) ?? images[0];

  return {
    slug: row.publicSlug || makePublicSlug(row),
    title:
      row.title ||
      `${row.dealType || "آگهی"} ${row.propertyType || "ملک"}${row.area ? ` ${row.area} متری` : ""} در ${row.city || "شهریار"}`,
    description: row.description ?? "",
    city: row.city ?? "شهریار",
    area: row.area ?? null,
    rooms: row.rooms ?? null,
    priceMillion: row.priceMillion ?? 0,
    depositMillion: row.depositMillion ?? null,
    rentMillion: row.rentMillion ?? null,
    pricePerMeter: row.pricePerMeter ?? null,
    dealType: row.dealType ?? "سایر",
    propertyType: row.propertyType ?? "سایر",
    date: row.date ?? "",
    dateRaw: row.dateRaw ?? "",
    publishedAt: row.publishedAt ?? row.createdAt ?? Date.now(),
    updatedAt: row.updatedAt ?? row.createdAt ?? Date.now(),
    featuredOnHome: row.featuredOnHome ?? false,
    seoTitle: row.seoTitle || autoSeoTitle(row),
    seoDescription: row.seoDescription || autoSeoDescription(row),
    seoKeywords:
      row.seoKeywords ??
      [
        row.dealType,
        row.propertyType,
        row.city,
        row.area ? `${row.area} متر` : "",
        "املاک صنعتی و اداری",
        "مکا",
      ].filter((value): value is string => Boolean(value)),
    noIndex: row.noIndex ?? false,
    images: images.map(({ url, alt, featured, order }) => ({
      url,
      alt,
      featured,
      order,
    })),
    ogImage: featuredImage?.url ?? null,
    contacts,
  };
}

export const listListings = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const page = await ctx.db
      .query("listings")
      .order("desc")
      .paginate(args.paginationOpts);
    const fallback = r.privileged ? "" : await managerPhone(ctx);
    return {
      ...page,
      page: page.page.map((row) =>
        toListing(row, r.privileged ? (row.phone ?? "") : fallback),
      ),
    };
  },
});

export const listPublicPaged = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("listings")
      .withIndex("by_public_published", (q) => q.eq("isPublic", true))
      .order("desc")
      .paginate(args.paginationOpts);
    const context = await publicContext(ctx);
    return {
      ...page,
      page: await Promise.all(
        page.page.map((row) => toPublicListing(ctx, row, context)),
      ),
    };
  },
});

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("listings")
      .withIndex("by_public_published", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(200);
    const context = await publicContext(ctx);
    return await Promise.all(
      rows.map((row) => toPublicListing(ctx, row, context)),
    );
  },
});

export const listFeaturedPublic = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("listings")
      .withIndex("by_public_published", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(60);
    const context = await publicContext(ctx);
    return await Promise.all(
      rows
        .filter((row) => row.featuredOnHome)
        .slice(0, 6)
        .map((row) => toPublicListing(ctx, row, context)),
    );
  },
});

export const getPublicBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("listings")
      .withIndex("by_public_slug", (q) => q.eq("publicSlug", args.slug))
      .take(2);
    const row = rows[0];
    if (!row || !row.isPublic) return null;
    const context = await publicContext(ctx);
    return await toPublicListing(ctx, row, context);
  },
});

const listingFields = {
  radarCode: v.optional(v.string()),
  city: v.optional(v.string()),
  neighborhood: v.optional(v.string()),
  area: v.optional(v.number()),
  rooms: v.optional(v.number()),
  priceMillion: v.optional(v.number()),
  depositMillion: v.optional(v.number()),
  rentMillion: v.optional(v.number()),
  pricePerMeter: v.optional(v.number()),
  dealType: v.optional(v.string()),
  propertyType: v.optional(v.string()),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  address: v.optional(v.string()),
  mapsUrl: v.optional(v.string()),
  divarUrl: v.optional(v.string()),
  date: v.optional(v.string()),
  dateRaw: v.optional(v.string()),
  poster: v.optional(v.string()),
  phone: v.optional(v.string()),
};

export const upsertListings = mutation({
  args: { items: v.array(v.object({ key: v.string(), ...listingFields })) },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ افزودن آگهی را دارد.");
    }

    let added = 0;
    let updated = 0;
    for (const item of args.items) {
      const existing = await byKey(ctx, item.key);
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...item,
          createdByUserId: existing.createdByUserId ?? r.userId,
          updatedAt: Date.now(),
        });
        updated++;
      } else {
        await ctx.db.insert("listings", {
          ...item,
          createdByUserId: r.userId,
          isPublic: false,
          featuredOnHome: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        added++;
      }
    }
    return { added, updated, total: args.items.length };
  },
});

export const saveNotes = mutation({
  args: { key: v.string(), notes: v.string() },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ یادداشت‌گذاری را دارد.");
    }
    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");
    await ctx.db.patch(row._id, { notes: args.notes, updatedAt: Date.now() });
    return args.notes;
  },
});

export const toggleFolder = mutation({
  args: { key: v.string(), folderId: v.string() },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ بایگانی را دارد.");
    }
    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");
    const current: string[] = row.folderIds ?? [];
    const next = current.includes(args.folderId)
      ? current.filter((f) => f !== args.folderId)
      : [...current, args.folderId];
    await ctx.db.patch(row._id, { folderIds: next, updatedAt: Date.now() });
    return next;
  },
});

export const markShared = mutation({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r) throw new Error("ورود لازم است.");
    const now = Date.now();
    for (const key of args.keys) {
      const row = await byKey(ctx, key);
      if (!row) continue;
      await ctx.db.patch(row._id, {
        sentCount: (row.sentCount ?? 0) + 1,
        lastSharedAt: now,
      });
    }
    return args.keys.length;
  },
});

export const updateListing = mutation({
  args: {
    key: v.string(),
    patch: v.object({
      address: v.optional(v.string()),
      mapsUrl: v.optional(v.string()),
      divarUrl: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      priceMillion: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ ویرایش را دارد.");
    }
    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");
    await ctx.db.patch(row._id, { ...args.patch, updatedAt: Date.now() });
    return args.patch;
  },
});

export const generateListingUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ آپلود تصویر را دارد.");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const getListingImages = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) return [];
    const row = await byKey(ctx, args.key);
    if (!row) return [];
    return await resolveListingImages(ctx, row);
  },
});

export const saveListingImages = mutation({
  args: {
    key: v.string(),
    images: v.array(
      v.object({
        storageId: v.id("_storage"),
        alt: v.string(),
        order: v.number(),
        featured: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ مدیریت تصاویر را دارد.");
    }
    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");

    const sorted = [...args.images]
      .sort((a, b) => a.order - b.order)
      .slice(0, 20)
      .map((image, index) => ({
        storageId: image.storageId,
        alt: image.alt.trim() || defaultImageAlt(row, index),
        order: index,
        featured: image.featured,
      }));

    if (sorted.length > 0) {
      const featuredIndex = sorted.findIndex((image) => image.featured);
      sorted.forEach((image, index) => {
        image.featured = index === (featuredIndex >= 0 ? featuredIndex : 0);
      });
    }

    await ctx.db.patch(row._id, {
      listingImages: sorted,
      updatedAt: Date.now(),
    });
    return sorted.length;
  },
});

export const removeListingImage = mutation({
  args: {
    key: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ حذف تصویر را دارد.");
    }
    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");

    const remaining = (row.listingImages ?? [])
      .filter((image) => image.storageId !== args.storageId)
      .sort((a, b) => a.order - b.order)
      .map((image, index) => ({
        ...image,
        order: index,
      }));

    if (remaining.length > 0 && !remaining.some((image) => image.featured)) {
      remaining[0] = { ...remaining[0], featured: true };
    }

    await ctx.db.patch(row._id, {
      listingImages: remaining,
      updatedAt: Date.now(),
    });
    await ctx.storage.delete(args.storageId);
    return remaining.length;
  },
});

export const updatePublicSettings = mutation({
  args: {
    key: v.string(),
    isPublic: v.boolean(),
    featuredOnHome: v.boolean(),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    seoKeywords: v.optional(v.array(v.string())),
    noIndex: v.boolean(),
  },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ انتشار عمومی را دارد.");
    }
    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");

    const now = Date.now();
    const publicSlug = row.publicSlug || makePublicSlug(row);
    await ctx.db.patch(row._id, {
      isPublic: args.isPublic,
      featuredOnHome: args.isPublic ? args.featuredOnHome : false,
      publicSlug,
      publishedAt:
        args.isPublic ? row.publishedAt ?? now : row.publishedAt,
      seoTitle: args.seoTitle?.trim() || undefined,
      seoDescription: args.seoDescription?.trim() || undefined,
      seoKeywords: args.seoKeywords?.map((x) => x.trim()).filter(Boolean),
      noIndex: args.noIndex,
      updatedAt: now,
    });

    return {
      isPublic: args.isPublic,
      featuredOnHome: args.isPublic ? args.featuredOnHome : false,
      publicSlug,
    };
  },
});

export const countListings = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("listings").take(2000);
    return { count: rows.length };
  },
});

export const createListing = mutation({
  args: {
    key: v.optional(v.string()),
    radarCode: v.optional(v.string()),
    city: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    area: v.optional(v.number()),
    rooms: v.optional(v.number()),
    priceMillion: v.optional(v.number()),
    depositMillion: v.optional(v.number()),
    rentMillion: v.optional(v.number()),
    dealType: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    mapsUrl: v.optional(v.string()),
    divarUrl: v.optional(v.string()),
    date: v.optional(v.string()),
    dateRaw: v.optional(v.string()),
    poster: v.optional(v.string()),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ افزودن آگهی را دارد.");
    }
    const phone = toEnglishDigits(args.phone).replace(/\D/g, "");
    if (!/^09\d{9}$/.test(phone)) {
      throw new Error("شمارهٔ تلفن باید ۱۱ رقم و با 09 شروع شود.");
    }
    const { key, ...rest } = args;
    delete (rest as { phone?: string }).phone;
    const stableKey = (key ?? "").trim() || rest.divarUrl || rest.radarCode || `${phone}-${Date.now()}`;
    if (await byKey(ctx, stableKey)) {
      throw new Error("آگهی با این لینک یا کد رادار قبلاً ثبت شده است.");
    }
    const now = Date.now();
    await ctx.db.insert("listings", {
      ...rest,
      key: stableKey,
      phone,
      createdByUserId: r.userId,
      isPublic: false,
      featuredOnHome: false,
      createdAt: now,
      updatedAt: now,
    });
    return stableKey;
  },
});
