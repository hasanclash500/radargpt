import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { OFFICE_ROLES } from "./schema";
import { currentRole, roleForUser } from "./permissions";

function cleanSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-\u0600-\u06ff]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function cleanUrl(value?: string) {
  const raw = (value ?? "").trim();
  if (!raw) return undefined;
  if (/^https:\/\//i.test(raw)) return raw.slice(0, 500);
  return ("https://" + raw).slice(0, 500);
}

function cleanSocial(value?: string) {
  return (value ?? "").trim().replace(/^@/, "").slice(0, 100) || undefined;
}

function cleanPhone(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.slice(0, 15) || undefined;
}

async function assertAdvisorRole(ctx: any, userId: string) {
  const role = await roleForUser(ctx, userId);
  if (role !== OFFICE_ROLES.CONSULTANT && role !== OFFICE_ROLES.MANAGER) {
    throw new Error("پروفایل عمومی مشاور فقط برای مدیر و مشاور فعال است.");
  }
  return role;
}

async function resolveProfile(ctx: any, row: any) {
  const profileImageUrl = row.profileImageStorageId
    ? await ctx.storage.getUrl(row.profileImageStorageId)
    : null;
  const coverImageUrl = row.coverImageStorageId
    ? await ctx.storage.getUrl(row.coverImageStorageId)
    : null;
  const userProfile = (
    await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", row.userId))
      .take(1)
  )[0];
  const user = await ctx.db.get(row.userId as any).catch(() => null);
  return {
    id: row._id,
    userId: row.userId,
    slug: row.slug,
    publicProfile: row.publicProfile,
    displayName:
      userProfile?.displayName ||
      user?.name ||
      "مشاور دیوساز",
    headline: row.headline ?? "مشاور املاک صنعتی و اداری",
    bio: row.bio ?? "",
    city: row.city ?? "شهریار",
    region: row.region ?? "غرب تهران",
    publicPhone: row.publicPhone ?? userProfile?.publicPhone ?? "",
    whatsapp: row.whatsapp ?? "",
    instagram: row.instagram ?? "",
    telegram: row.telegram ?? "",
    website: row.website ?? "",
    specialties: row.specialties ?? [],
    profileImageUrl,
    coverImageUrl,
    verified: row.verified ?? false,
    successfulDeals: row.successfulDeals ?? 0,
    activeRequests: row.activeRequests ?? 0,
    updatedAt: row.updatedAt,
  };
}

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) return null;
    const userId = String(authId);
    const role = await roleForUser(ctx, userId);
    if (role !== OFFICE_ROLES.CONSULTANT && role !== OFFICE_ROLES.MANAGER) {
      return { allowed: false as const, role };
    }

    const row = (
      await ctx.db
        .query("advisorProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(1)
    )[0];
    if (!row) {
      const p = (
        await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .take(1)
      )[0];
      const user = await ctx.db.get(authId);
      return {
        allowed: true as const,
        exists: false as const,
        role,
        displayName: p?.displayName ?? user?.name ?? "",
        publicPhone: p?.publicPhone ?? "",
      };
    }

    return {
      allowed: true as const,
      exists: true as const,
      role,
      profileImageStorageId: row.profileImageStorageId,
      coverImageStorageId: row.coverImageStorageId,
      ...(await resolveProfile(ctx, row)),
    };
  },
});

export const saveMyProfile = mutation({
  args: {
    slug: v.string(),
    publicProfile: v.boolean(),
    displayName: v.string(),
    headline: v.string(),
    bio: v.string(),
    city: v.string(),
    region: v.string(),
    publicPhone: v.string(),
    whatsapp: v.string(),
    instagram: v.string(),
    telegram: v.string(),
    website: v.string(),
    specialties: v.array(v.string()),
    profileImageStorageId: v.optional(v.id("_storage")),
    coverImageStorageId: v.optional(v.id("_storage")),
    successfulDeals: v.optional(v.number()),
    activeRequests: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) throw new Error("ورود لازم است.");
    const userId = String(authId);
    await assertAdvisorRole(ctx, userId);

    const slug = cleanSlug(args.slug) || ("advisor-" + userId.slice(-8));
    const duplicates = await ctx.db
      .query("advisorProfiles")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .take(2);
    const existing = (
      await ctx.db
        .query("advisorProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(1)
    )[0];
    if (duplicates.some((item) => !existing || item._id !== existing._id)) {
      throw new Error("این آدرس پروفایل قبلاً استفاده شده است.");
    }

    const displayName = args.displayName.trim().slice(0, 100);
    if (!displayName) throw new Error("نام نمایشی را وارد کنید.");

    const publicPhone = cleanPhone(args.publicPhone);
    const now = Date.now();
    const data = {
      userId,
      slug,
      publicProfile: args.publicProfile,
      headline: args.headline.trim().slice(0, 160) || undefined,
      bio: args.bio.trim().slice(0, 2500) || undefined,
      city: args.city.trim().slice(0, 80) || undefined,
      region: args.region.trim().slice(0, 120) || undefined,
      publicPhone,
      whatsapp: cleanPhone(args.whatsapp),
      instagram: cleanSocial(args.instagram),
      telegram: cleanSocial(args.telegram),
      website: cleanUrl(args.website),
      specialties: args.specialties
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12),
      profileImageStorageId: args.profileImageStorageId,
      coverImageStorageId: args.coverImageStorageId,
      successfulDeals:
        args.successfulDeals == null
          ? undefined
          : Math.max(0, Math.floor(args.successfulDeals)),
      activeRequests:
        args.activeRequests == null
          ? undefined
          : Math.max(0, Math.floor(args.activeRequests)),
      updatedAt: now,
    };

    const userProfile = (
      await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(1)
    )[0];
    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        displayName,
        publicPhone,
      });
    }

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("advisorProfiles", {
      ...data,
      verified: false,
      createdAt: now,
    });
  },
});

export const generateProfileUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);
    if (authId === null) throw new Error("ورود لازم است.");
    await assertAdvisorRole(ctx, String(authId));
    return await ctx.storage.generateUploadUrl();
  },
});

export const listStoryAuthors = query({
  args: {},
  handler: async (ctx) => {
    const current = await currentRole(ctx);
    if (!current) return [];
    if (
      current.role !== OFFICE_ROLES.MANAGER &&
      current.role !== OFFICE_ROLES.CONSULTANT
    ) {
      return [];
    }

    const profiles = await ctx.db.query("userProfiles").collect();
    const eligible = [];
    for (const profile of profiles) {
      const role = await roleForUser(ctx, profile.userId);
      if (
        role !== OFFICE_ROLES.CONSULTANT &&
        role !== OFFICE_ROLES.MANAGER
      ) {
        continue;
      }
      if (
        current.role === OFFICE_ROLES.CONSULTANT &&
        profile.userId !== current.userId
      ) {
        continue;
      }
      const advisor = (
        await ctx.db
          .query("advisorProfiles")
          .withIndex("by_user", (q) => q.eq("userId", profile.userId))
          .take(1)
      )[0];
      const resolved = advisor ? await resolveProfile(ctx, advisor) : null;
      eligible.push({
        userId: profile.userId,
        role,
        displayName:
          resolved?.displayName || profile.displayName || "مشاور دیوساز",
        profileImageUrl: resolved?.profileImageUrl ?? null,
        slug: resolved?.slug ?? "",
      });
    }
    return eligible;
  },
});

export const getPublicBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const slug = cleanSlug(args.slug);
    const row = (
      await ctx.db
        .query("advisorProfiles")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .take(1)
    )[0];
    if (!row || !row.publicProfile) return null;

    const profile = await resolveProfile(ctx, row);
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_created_by", (q) => q.eq("createdByUserId", row.userId))
      .order("desc")
      .collect();
    const publicListings = listings
      .filter((item) => item.isPublic && item.publicSlug)
      .slice(0, 12);

    const listingCards = await Promise.all(
      publicListings.map(async (item) => {
        const ordered = [...(item.listingImages ?? [])].sort(
          (a, b) => a.order - b.order,
        );
        const image = ordered.find((entry) => entry.featured) ?? ordered[0];
        const imageUrl = image ? await ctx.storage.getUrl(image.storageId) : null;
        return {
          slug: item.publicSlug!,
          title:
            item.title ||
            `${item.dealType || "آگهی"} ${item.propertyType || "ملک"}`,
          city: item.city ?? "",
          propertyType: item.propertyType ?? "",
          dealType: item.dealType ?? "",
          area: item.area ?? null,
          priceMillion: item.priceMillion ?? 0,
          depositMillion: item.depositMillion ?? null,
          rentMillion: item.rentMillion ?? null,
          imageUrl,
        };
      }),
    );

    return {
      ...profile,
      listingCount: listings.filter((item) => item.isPublic).length,
      listings: listingCards,
    };
  },
});

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("advisorProfiles")
      .withIndex("by_public_updated", (q) => q.eq("publicProfile", true))
      .order("desc")
      .take(100);
    return await Promise.all(rows.map((row) => resolveProfile(ctx, row)));
  },
});

export const setVerified = mutation({
  args: { userId: v.string(), verified: v.boolean() },
  handler: async (ctx, args) => {
    const current = await currentRole(ctx);
    if (!current || current.role !== OFFICE_ROLES.MANAGER) {
      throw new Error("فقط مدیر اصلی می‌تواند وضعیت تأیید را تغییر دهد.");
    }
    const row = (
      await ctx.db
        .query("advisorProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(1)
    )[0];
    if (!row) throw new Error("پروفایل مشاور ساخته نشده است.");
    await ctx.db.patch(row._id, {
      verified: args.verified,
      updatedAt: Date.now(),
    });
    return true;
  },
});
