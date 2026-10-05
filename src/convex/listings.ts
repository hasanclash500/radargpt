import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { toEnglishDigits, type Listing as ListingRow } from "../lib/parser";
import { neshanAppLocationUrl } from "../lib/neshan";
import { OFFICE_ROLES, type OfficeRole } from "./schema";
import {
  canEditListing,
  canManageListings,
  canWorkListings,
  ownsOnlyListings,
  roleForUser,
} from "./permissions";

type Ctx = Pick<QueryCtx, "db" | "auth" | "storage">;

async function resolve(ctx: Ctx): Promise<{
  role: OfficeRole;
  privileged: boolean;
  userId: string;
} | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;

  const role = await roleForUser(ctx, String(userId));
  return {
    role,
    privileged: canWorkListings(role),
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

function listingSearchText(row: {
  radarCode?: string;
  city?: string;
  neighborhood?: string;
  title?: string;
  description?: string;
  phone?: string;
  dealType?: string;
  propertyType?: string;
  address?: string;
}) {
  const parts = [
    row.radarCode,
    row.city,
    row.neighborhood,
    row.title,
    row.description,
    row.phone,
    row.dealType,
    row.propertyType,
    row.address,
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());

  const raw = parts.join(" ");
  const latinDigits = toEnglishDigits(raw);
  return Array.from(new Set([raw, latinDigits]))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
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
  return `${deal} ${type}${area} در ${city} | دیوساز`.slice(0, 65);
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
  return `${details}. ${excerpt} برای اطلاعات و هماهنگی بازدید با دیوساز تماس بگیرید.`
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
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
    folderIds: row.folderIds,
    contactPhone,
    listingKind: row.listingKind,
    importBatchId: row.importBatchId,
    claimedFromImport: row.claimedFromImport ?? false,
    claimedAt: row.claimedAt,
    createdByUserId: row.createdByUserId,
    isPublic: row.isPublic ?? false,
    showOnLanding: row.showOnLanding ?? row.featuredOnHome ?? false,
    featuredOnHome: row.featuredOnHome ?? false,
    publicSlug: row.publicSlug,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoKeywords: row.seoKeywords,
    noIndex: row.noIndex ?? false,
    publicationStatus: row.publicationStatus ?? (row.isPublic ? "approved" : "private"),
    publicationRejectReason: row.publicationRejectReason,
    customFields: row.customFields ?? [],
  };
}

async function publicContext(ctx: Ctx) {
  const settings = await globalSettings(ctx);
  const profiles = await ctx.db.query("userProfiles").collect();
  const advisorProfiles = await ctx.db.query("advisorProfiles").collect();
  return {
    officeName: settings?.officeName || "دیوساز",
    managerPhone: settings?.managerPhone || "09120858095",
    profiles,
    advisorProfiles,
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
    "| دیوساز",
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
  return resolved.flatMap((image) =>
    typeof image.url === "string" && image.url.length > 0
      ? [{ ...image, url: image.url }]
      : [],
  );
}

async function toPublicListing(
  ctx: Ctx,
  row: Doc<"listings">,
  context: Awaited<ReturnType<typeof publicContext>>,
) {
  const contacts: { name: string; phone: string; role: string; profileSlug?: string }[] = [];
  if (context.managerPhone) {
    contacts.push({
      name: context.officeName || "دیوساز",
      phone: context.managerPhone,
      role: "مدیر",
    });
  }

  if (row.createdByUserId) {
    const creator = context.profiles.find(
      (profile) => profile.userId === row.createdByUserId,
    );
    const phone = creator?.publicPhone ?? "";
    const advisorProfile = context.advisorProfiles.find(
      (profile) =>
        profile.userId === row.createdByUserId && profile.publicProfile,
    );
    if (phone && !contacts.some((item) => item.phone === phone)) {
      contacts.push({
        name: creator?.displayName || "مشاور دیوساز",
        phone,
        role: "مشاور ثبت‌کننده",
        profileSlug: advisorProfile?.slug,
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
    showOnLanding: row.showOnLanding ?? row.featuredOnHome ?? false,
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
        "دیوساز",
      ].filter((value): value is string => Boolean(value)),
    noIndex: row.noIndex ?? false,
    customFields: (row.customFields ?? [])
      .filter((field) => field.public)
      .map((field) => ({
        fieldId: field.fieldId,
        label: field.label,
        value: field.value,
        type: field.type,
        unit: field.unit,
      })),
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
  args: {
    paginationOpts: paginationOptsValidator,
    view: v.optional(v.union(v.literal("member"), v.literal("imported"))),
  },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !canWorkListings(r.role)) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const view = args.view ?? "member";
    const page =
      view === "imported"
        ? await ctx.db
            .query("listings")
            .withIndex("by_kind_updated", (q) =>
              q.eq("listingKind", "imported"),
            )
            .order("desc")
            .paginate(args.paginationOpts)
        : ownsOnlyListings(r.role)
          ? await ctx.db
              .query("listings")
              .withIndex("by_owner_kind_updated", (q) =>
                q
                  .eq("createdByUserId", r.userId)
                  .eq("listingKind", "member"),
              )
              .order("desc")
              .paginate(args.paginationOpts)
          : await ctx.db
              .query("listings")
              .withIndex("by_kind_updated", (q) =>
                q.eq("listingKind", "member"),
              )
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

export const searchListings = query({
  args: {
    view: v.union(v.literal("member"), v.literal("imported")),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !canWorkListings(r.role)) return [];

    const term = toEnglishDigits(args.query)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
    if (term.length < 2) return [];

    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 120), 200));

    let search = ctx.db
      .query("listings")
      .withSearchIndex("search_listings", (q) =>
        q.search("searchText", term).eq("listingKind", args.view),
      );

    const rows =
      args.view === "member" && ownsOnlyListings(r.role)
        ? await ctx.db
            .query("listings")
            .withSearchIndex("search_listings", (q) =>
              q
                .search("searchText", term)
                .eq("listingKind", "member")
                .eq("createdByUserId", r.userId),
            )
            .take(limit)
        : await search.take(limit);

    const fallback = r.privileged ? "" : await managerPhone(ctx);
    return rows.map((row) =>
      toListing(row, r.privileged ? (row.phone ?? "") : fallback),
    );
  },
});

export const listPendingPublications = query({
  args: {},
  handler: async (ctx) => {
    const r = await resolve(ctx);
    if (!r || !canManageListings(r.role)) return [];
    const rows = await ctx.db
      .query("listings")
      .withIndex("by_publication_status", (q) => q.eq("publicationStatus", "pending"))
      .order("desc")
      .take(100);
    return rows.map((row) => toListing(row, row.phone ?? ""));
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
      .take(120);
    const context = await publicContext(ctx);
    const landing = rows
      .filter((row) => row.showOnLanding ?? row.featuredOnHome ?? false)
      .sort((a, b) => {
        const featuredDelta =
          Number(Boolean(b.featuredOnHome)) - Number(Boolean(a.featuredOnHome));
        if (featuredDelta !== 0) return featuredDelta;
        return (b.publishedAt ?? b.updatedAt ?? 0) - (a.publishedAt ?? a.updatedAt ?? 0);
      })
      .slice(0, 6);
    return await Promise.all(
      landing.map((row) => toPublicListing(ctx, row, context)),
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

const customFieldValidator = v.object({
  fieldId: v.string(),
  label: v.string(),
  value: v.string(),
  type: v.string(),
  unit: v.optional(v.string()),
  public: v.boolean(),
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
  customFields: v.optional(v.array(customFieldValidator)),
};

export const upsertListings = mutation({
  args: {
    items: v.array(v.object({ key: v.string(), ...listingFields })),
    importBatchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !canManageListings(r.role)) {
      throw new Error("ورود فایل فقط برای مدیر و ادمین فعال است.");
    }

    let added = 0;
    let updated = 0;
    let skippedMember = 0;
    const now = Date.now();
    const importBatchId =
      args.importBatchId?.trim() || `import-${now.toString(36)}`;

    for (const item of args.items) {
      const existing = await byKey(ctx, item.key);
      if (existing) {
        const existingLooksMember =
          existing.listingKind === "member" ||
          existing.submissionSource === "public_mobile" ||
          Boolean(existing.isPublic) ||
          existing.publicationStatus === "pending" ||
          existing.publicationStatus === "approved" ||
          (existing.listingImages?.length ?? 0) > 0 ||
          (existing.customFields?.length ?? 0) > 0;
        if (existingLooksMember) {
          skippedMember++;
          continue;
        }
        await ctx.db.patch(existing._id, {
          ...item,
          searchText: listingSearchText(item),
          listingKind: "imported",
          importBatchId: existing.importBatchId || importBatchId,
          createdByUserId: undefined,
          claimedFromImport: undefined,
          claimedAt: undefined,
          isPublic: false,
          showOnLanding: false,
          featuredOnHome: false,
          publicationStatus: "private",
          updatedAt: now,
        });
        updated++;
      } else {
        await ctx.db.insert("listings", {
          ...item,
          searchText: listingSearchText(item),
          listingKind: "imported",
          importBatchId,
          isPublic: false,
          showOnLanding: false,
          featuredOnHome: false,
          publicationStatus: "private",
          createdAt: now,
          updatedAt: now,
        });
        added++;
      }
    }
    return {
      added,
      updated,
      skippedMember,
      total: args.items.length,
      importBatchId,
    };
  },
});

export const migrateLegacyListingKinds = mutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !canManageListings(r.role)) {
      throw new Error("دسترسی مهاجرت آگهی‌ها ندارید.");
    }

    const limit = Math.max(50, Math.min(Math.floor(args.limit ?? 400), 800));
    const rows = await ctx.db
      .query("listings")
      .withIndex("by_kind_updated", (q) => q.eq("listingKind", undefined))
      .take(limit);

    let imported = 0;
    let member = 0;
    const now = Date.now();

    for (const row of rows) {
      const publicSubmission = row.submissionSource === "public_mobile";
      const hasEditedContent =
        (row.listingImages?.length ?? 0) > 0 ||
        (row.customFields?.length ?? 0) > 0 ||
        Boolean(row.isPublic) ||
        row.publicationStatus === "pending" ||
        row.publicationStatus === "approved";

      const looksImported =
        !publicSubmission &&
        !hasEditedContent &&
        Boolean(row.radarCode || row.divarUrl);

      if (looksImported) {
        await ctx.db.patch(row._id, {
          listingKind: "imported",
          searchText: listingSearchText(row),
          importBatchId: row.importBatchId || "legacy-import",
          createdByUserId: undefined,
          updatedAt: row.updatedAt ?? row.createdAt ?? now,
        });
        imported++;
      } else {
        await ctx.db.patch(row._id, {
          listingKind: "member",
          searchText: listingSearchText(row),
          updatedAt: row.updatedAt ?? row.createdAt ?? now,
        });
        member++;
      }
    }

    if (rows.length < limit) {
      const settings = await globalSettings(ctx);
      if (settings) {
        await ctx.db.patch(settings._id, { listingKindMigrationDone: true });
      } else {
        await ctx.db.insert("appSettings", {
          key: "global",
          listingKindMigrationDone: true,
        });
      }
    }

    return {
      processed: rows.length,
      imported,
      member,
      done: rows.length < limit,
    };
  },
});

export const claimImportedListing = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !canWorkListings(r.role)) {
      throw new Error("برای برداشتن فایل باید وارد حساب کاری شوید.");
    }

    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");
    if (row.listingKind !== "imported") {
      throw new Error("این فایل قبلاً از بانک ایمپورت خارج شده است.");
    }

    const now = Date.now();
    await ctx.db.patch(row._id, {
      listingKind: "member",
      createdByUserId: r.userId,
      claimedFromImport: true,
      claimedAt: now,
      isPublic: false,
      showOnLanding: false,
      featuredOnHome: false,
      publicationStatus: "private",
      publicationRequestedAt: undefined,
      publicationReviewedAt: undefined,
      publicationReviewedBy: undefined,
      publicationRejectReason: undefined,
      updatedAt: now,
    });

    return {
      key: row.key,
      claimedAt: now,
      ownerUserId: r.userId,
    };
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
    if (!canEditListing(r.role, r.userId, row.createdByUserId)) {
      throw new Error("اجازهٔ تغییر این آگهی را ندارید.");
    }
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
    if (!canEditListing(r.role, r.userId, row.createdByUserId)) {
      throw new Error("اجازهٔ تغییر این آگهی را ندارید.");
    }
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
      if (!canEditListing(r.role, r.userId, row.createdByUserId)) continue;
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
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      mapsUrl: v.optional(v.string()),
      divarUrl: v.optional(v.string()),
      city: v.optional(v.string()),
      neighborhood: v.optional(v.string()),
      area: v.optional(v.number()),
      rooms: v.optional(v.number()),
      dealType: v.optional(v.string()),
      propertyType: v.optional(v.string()),
      phone: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      priceMillion: v.optional(v.number()),
      depositMillion: v.optional(v.number()),
      rentMillion: v.optional(v.number()),
      pricePerMeter: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !r.privileged) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ ویرایش را دارد.");
    }
    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");
    if (!canEditListing(r.role, r.userId, row.createdByUserId)) {
      throw new Error("اجازهٔ تغییر این آگهی را ندارید.");
    }
    const next = { ...row, ...args.patch };
    await ctx.db.patch(row._id, {
      ...args.patch,
      searchText: listingSearchText(next),
      updatedAt: Date.now(),
    });
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
    if (!canEditListing(r.role, r.userId, row.createdByUserId)) return [];
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
    if (!canEditListing(r.role, r.userId, row.createdByUserId)) {
      throw new Error("اجازهٔ تغییر این آگهی را ندارید.");
    }

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
    if (!canEditListing(r.role, r.userId, row.createdByUserId)) {
      throw new Error("اجازهٔ تغییر این آگهی را ندارید.");
    }

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
    showOnLanding: v.boolean(),
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
    if (!canEditListing(r.role, r.userId, row.createdByUserId)) {
      throw new Error("اجازهٔ تغییر این آگهی را ندارید.");
    }

    const now = Date.now();
    const publicSlug = row.publicSlug || makePublicSlug(row);
    const common = {
      createdByUserId: row.createdByUserId ?? r.userId,
      listingKind: "member" as const,
      showOnLanding: args.isPublic ? args.showOnLanding : false,
      featuredOnHome: args.isPublic ? args.featuredOnHome : false,
      publicSlug,
      seoTitle: args.seoTitle?.trim() || undefined,
      seoDescription: args.seoDescription?.trim() || undefined,
      seoKeywords: args.seoKeywords?.map((x) => x.trim()).filter(Boolean),
      noIndex: args.noIndex,
      updatedAt: now,
    };

    if (!args.isPublic) {
      await ctx.db.patch(row._id, {
        ...common,
        isPublic: false,
        publicationStatus: "private",
        publicationRejectReason: undefined,
      });
      return {
        isPublic: false,
        showOnLanding: false,
        featuredOnHome: false,
        publicSlug,
        publicationStatus: "private" as const,
      };
    }

    if (canManageListings(r.role)) {
      await ctx.db.patch(row._id, {
        ...common,
        isPublic: true,
        showOnLanding: args.showOnLanding,
        publicationStatus: "approved",
        publicationRequestedAt: row.publicationRequestedAt ?? now,
        publicationReviewedAt: now,
        publicationReviewedBy: r.userId,
        publicationRejectReason: undefined,
        publishedAt: row.publishedAt ?? now,
      });
      return {
        isPublic: true,
        showOnLanding: args.showOnLanding,
        featuredOnHome: args.featuredOnHome,
        publicSlug,
        publicationStatus: "approved" as const,
      };
    }

    await ctx.db.patch(row._id, {
      ...common,
      isPublic: false,
      showOnLanding: args.showOnLanding,
      publicationStatus: "pending",
      publicationRequestedAt: now,
      publicationReviewedAt: undefined,
      publicationReviewedBy: undefined,
      publicationRejectReason: undefined,
    });

    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", r.userId))
      .take(1);
    const consultant = profiles[0]?.displayName || "مشاور دیوساز";
    const title =
      row.title ||
      `${row.dealType || "آگهی"} ${row.propertyType || "ملک"}${row.area ? ` ${row.area} متری` : ""} در ${row.city || "شهریار"}`;

    await ctx.scheduler.runAfter(0, internal.integrations.notifyPublicationRequest, {
      key: row.key,
      title,
      city: row.city || "شهریار",
      propertyType: row.propertyType || "ملک",
      dealType: row.dealType || "آگهی",
      ...(row.area != null ? { area: row.area } : {}),
      ...(row.depositMillion != null ? { depositMillion: row.depositMillion } : {}),
      ...(row.rentMillion != null ? { rentMillion: row.rentMillion } : {}),
      ...(row.priceMillion != null ? { priceMillion: row.priceMillion } : {}),
      ...((row.description || "").trim()
        ? { description: (row.description || "").slice(0, 1200) }
        : {}),
      publicDetails: (row.customFields ?? [])
        .filter((field) => field.public)
        .map((field) => `${field.label}: ${field.value}${field.unit ? ` ${field.unit}` : ""}`)
        .slice(0, 12),
      consultant,
    });

    return {
      isPublic: false,
      showOnLanding: args.showOnLanding,
      featuredOnHome: args.featuredOnHome,
      publicSlug,
      publicationStatus: "pending" as const,
    };
  },
});

export const approvePublication = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !canManageListings(r.role)) {
      throw new Error("فقط مدیر یا ادمین آگهی اجازهٔ تأیید انتشار را دارد.");
    }
    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");
    const now = Date.now();
    await ctx.db.patch(row._id, {
      isPublic: true,
      publicationStatus: "approved",
      publicationReviewedAt: now,
      publicationReviewedBy: r.userId,
      publicationRejectReason: undefined,
      publishedAt: row.publishedAt ?? now,
      updatedAt: now,
    });
    return true;
  },
});

export const rejectPublication = mutation({
  args: { key: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !canManageListings(r.role)) {
      throw new Error("فقط مدیر یا ادمین آگهی اجازهٔ رد انتشار را دارد.");
    }
    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");
    const now = Date.now();
    await ctx.db.patch(row._id, {
      isPublic: false,
      publicationStatus: "rejected",
      publicationReviewedAt: now,
      publicationReviewedBy: r.userId,
      publicationRejectReason: args.reason?.trim() || "نیاز به اصلاح دارد.",
      updatedAt: now,
    });
    return true;
  },
});

export const countListings = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("listings").take(2000);
    return { count: rows.length };
  },
});

export const deleteListing = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !canWorkListings(r.role)) {
      throw new Error("دسترسی حذف آگهی ندارید.");
    }
    const row = await byKey(ctx, args.key);
    if (!row) throw new Error("آگهی یافت نشد.");
    if (!canEditListing(r.role, r.userId, row.createdByUserId)) {
      throw new Error("اجازهٔ حذف این آگهی را ندارید.");
    }

    for (const image of row.listingImages ?? []) {
      try {
        await ctx.storage.delete(image.storageId);
      } catch {
        // فایل ممکن است قبلاً حذف شده باشد.
      }
    }

    const reminders = await ctx.db
      .query("listingReminders")
      .withIndex("by_listing_slot", (q) => q.eq("listingId", row._id))
      .collect();
    for (const reminder of reminders) {
      await ctx.db.delete(reminder._id);
    }

    await ctx.db.delete(row._id);
    return true;
  },
});

export const submitPublicListing = mutation({
  args: {
    phone: v.string(),
    city: v.string(),
    propertyType: v.string(),
    dealType: v.string(),
    area: v.optional(v.number()),
    priceMillion: v.optional(v.number()),
    depositMillion: v.optional(v.number()),
    rentMillion: v.optional(v.number()),
    title: v.string(),
    description: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.website?.trim()) {
      return {
        ok: true,
        trackingCode: "",
        key: "",
        uploadToken: "",
      };
    }

    const phone = toEnglishDigits(args.phone).replace(/\D/g, "");
    if (!/^09\d{9}$/.test(phone)) {
      throw new Error("شماره موبایل معتبر وارد کنید.");
    }

    const city = args.city.trim().slice(0, 80);
    const propertyType = args.propertyType.trim().slice(0, 80);
    const dealType = args.dealType.trim().slice(0, 80);
    const title = args.title.trim().slice(0, 180);
    const description = args.description.trim().slice(0, 4000);
    if (!city || !propertyType || !dealType) {
      throw new Error("شهر، نوع ملک و نوع معامله را کامل کنید.");
    }
    if (title.length < 8) throw new Error("عنوان آگهی را کامل‌تر بنویسید.");
    if (description.length < 30) throw new Error("توضیحات آگهی خیلی کوتاه است.");

    const hasLatitude = args.latitude != null;
    const hasLongitude = args.longitude != null;
    if (hasLatitude !== hasLongitude) {
      throw new Error("مختصات نقشه ناقص است.");
    }
    if (
      hasLatitude &&
      hasLongitude &&
      (args.latitude! < -90 ||
        args.latitude! > 90 ||
        args.longitude! < -180 ||
        args.longitude! > 180)
    ) {
      throw new Error("مختصات نقشه معتبر نیست.");
    }

    const now = Date.now();
    const recent = await ctx.db
      .query("listings")
      .withIndex("by_submitter_created", (q) =>
        q.eq("submittedByPhone", phone).gte("createdAt", now - 60 * 60 * 1000),
      )
      .order("desc")
      .take(3);
    if (recent.length >= 3) {
      throw new Error("برای این شماره در یک ساعت بیش از سه آگهی قابل ثبت نیست.");
    }

    const key = `public-${phone}-${now}`;
    const uploadToken = globalThis.crypto.randomUUID().replace(/-/g, "");
    const id = await ctx.db.insert("listings", {
      key,
      city,
      propertyType,
      dealType,
      area: args.area,
      priceMillion: args.priceMillion,
      depositMillion: args.depositMillion,
      rentMillion: args.rentMillion,
      title,
      description,
      phone,
      searchText: listingSearchText({
        city,
        propertyType,
        dealType,
        title,
        description,
        phone,
      }),
      latitude: args.latitude,
      longitude: args.longitude,
      mapsUrl:
        hasLatitude && hasLongitude
          ? neshanAppLocationUrl(args.latitude!, args.longitude!)
          : undefined,
      submittedByPhone: phone,
      submissionSource: "public_mobile",
      listingKind: "member",
      publicSubmissionToken: uploadToken,
      publicSubmissionExpiresAt: now + 30 * 60 * 1000,
      publicUploadCount: 0,
      isPublic: false,
      showOnLanding: false,
      featuredOnHome: false,
      publicationStatus: "pending",
      publicationRequestedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const row = await ctx.db.get(id);
    if (row) {
      await ctx.db.patch(id, { publicSlug: makePublicSlug(row) });
    }

    await ctx.scheduler.runAfter(0, internal.integrations.notifyPublicationRequest, {
      key,
      title,
      city,
      propertyType,
      dealType,
      ...(args.area != null ? { area: args.area } : {}),
      ...(args.depositMillion != null ? { depositMillion: args.depositMillion } : {}),
      ...(args.rentMillion != null ? { rentMillion: args.rentMillion } : {}),
      ...(args.priceMillion != null ? { priceMillion: args.priceMillion } : {}),
      description: description.slice(0, 1200),
      publicDetails: [],
      consultant: `ثبت عمومی • ${phone}`,
    });

    return {
      ok: true,
      trackingCode: shortHash(key),
      key,
      uploadToken,
    };
  },
});

export const generatePublicListingUploadUrl = mutation({
  args: {
    key: v.string(),
    uploadToken: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await byKey(ctx, args.key);
    if (
      !row ||
      row.submissionSource !== "public_mobile" ||
      !row.publicSubmissionToken ||
      row.publicSubmissionToken !== args.uploadToken ||
      (row.publicSubmissionExpiresAt ?? 0) < Date.now()
    ) {
      throw new Error("مجوز آپلود تصویر منقضی یا نامعتبر است.");
    }

    const used = row.publicUploadCount ?? 0;
    if (used >= 12) {
      throw new Error("تعداد تلاش‌های آپلود این آگهی بیش از حد مجاز است.");
    }

    await ctx.db.patch(row._id, {
      publicUploadCount: used + 1,
      updatedAt: Date.now(),
    });
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachPublicListingImages = mutation({
  args: {
    key: v.string(),
    uploadToken: v.string(),
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const row = await byKey(ctx, args.key);
    if (
      !row ||
      row.submissionSource !== "public_mobile" ||
      !row.publicSubmissionToken ||
      row.publicSubmissionToken !== args.uploadToken ||
      (row.publicSubmissionExpiresAt ?? 0) < Date.now()
    ) {
      throw new Error("مجوز تکمیل تصاویر منقضی یا نامعتبر است.");
    }

    const uniqueStorageIds = args.storageIds
      .filter(
        (storageId, index, all) =>
          all.findIndex((candidate) => candidate === storageId) === index,
      )
      .slice(0, 10);

    for (const storageId of uniqueStorageIds) {
      const url = await ctx.storage.getUrl(storageId);
      if (!url) throw new Error("یکی از تصاویر آپلودشده معتبر نیست.");
    }

    const listingImages = uniqueStorageIds.map((storageId, index) => ({
      storageId,
      alt: defaultImageAlt(row, index),
      order: index,
      featured: index === 0,
    }));

    await ctx.db.patch(row._id, {
      listingImages,
      publicSubmissionToken: undefined,
      publicSubmissionExpiresAt: undefined,
      publicUploadCount: undefined,
      updatedAt: Date.now(),
    });

    return listingImages.length;
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
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    mapsUrl: v.optional(v.string()),
    divarUrl: v.optional(v.string()),
    date: v.optional(v.string()),
    dateRaw: v.optional(v.string()),
    poster: v.optional(v.string()),
    customFields: v.optional(v.array(customFieldValidator)),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const r = await resolve(ctx);
    if (!r || !canWorkListings(r.role)) {
      throw new Error("دسترسی افزودن آگهی ندارید.");
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
      searchText: listingSearchText({ ...rest, phone }),
      listingKind: "member",
      createdByUserId: r.userId,
      isPublic: false,
      showOnLanding: false,
      featuredOnHome: false,
      publicationStatus: "private",
      createdAt: now,
      updatedAt: now,
    });
    return stableKey;
  },
});
