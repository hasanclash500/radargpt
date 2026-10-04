import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { OFFICE_ROLES } from "./schema";
import { currentRole, roleForUser } from "./permissions";

const DAY = 24 * 60 * 60 * 1000;

function safeLink(value?: string) {
  const raw = (value ?? "").trim();
  if (!raw) return undefined;
  if (
    raw.startsWith("/") ||
    raw.startsWith("#") ||
    raw.startsWith("tel:") ||
    /^https:\/\//i.test(raw)
  ) {
    return raw.slice(0, 500);
  }
  return undefined;
}

async function canManageStories(ctx: any) {
  const current = await currentRole(ctx);
  if (!current) return null;
  if (
    current.role !== OFFICE_ROLES.MANAGER &&
    current.role !== OFFICE_ROLES.CONSULTANT
  ) {
    return null;
  }
  return current;
}

async function assertStoryOwner(ctx: any, current: any, ownerUserId: string) {
  const ownerRole = await roleForUser(ctx, ownerUserId);
  if (
    ownerRole !== OFFICE_ROLES.CONSULTANT &&
    ownerRole !== OFFICE_ROLES.MANAGER
  ) {
    throw new Error("استوری فقط برای مدیر یا مشاور قابل ایجاد است.");
  }
  if (
    current.role === OFFICE_ROLES.CONSULTANT &&
    ownerUserId !== current.userId
  ) {
    throw new Error("مشاور فقط برای پروفایل خودش می‌تواند استوری بسازد.");
  }
}

async function advisorForUser(ctx: any, userId: string) {
  const row = (
    await ctx.db
      .query("advisorProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .take(1)
  )[0];
  const profile = (
    await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .take(1)
  )[0];

  return {
    slug: row?.slug ?? "",
    publicProfile: row?.publicProfile ?? false,
    displayName: profile?.displayName ?? "مشاور مکا",
    profileImageUrl: row?.profileImageStorageId
      ? await ctx.storage.getUrl(row.profileImageStorageId)
      : null,
    headline: row?.headline ?? "مشاور املاک صنعتی و اداری",
  };
}

async function resolveStory(ctx: any, row: any) {
  const advisor = await advisorForUser(ctx, row.ownerUserId);
  const mediaUrl = row.storageId
    ? await ctx.storage.getUrl(row.storageId)
    : null;
  const now = Date.now();
  const startsAt = row.startsAt ?? row.publishedAt ?? row.createdAt;
  const expiresAt = row.expiresAt ?? startsAt + DAY;
  const effectiveStatus =
    row.status === "archived" || row.status === "draft"
      ? row.status
      : startsAt > now
        ? "scheduled"
        : expiresAt <= now
          ? "expired"
          : "published";

  return {
    id: row._id,
    ownerUserId: row.ownerUserId,
    createdByUserId: row.createdByUserId,
    title: row.title ?? "",
    body: row.body ?? "",
    contentType: row.contentType,
    mediaUrl,
    linkUrl: row.linkUrl ?? "",
    linkLabel: row.linkLabel ?? "",
    stickerText: row.stickerText ?? "",
    stickerStyle: row.stickerStyle ?? "soft",
    background: row.background ?? "#0f5132",
    durationSec: Math.min(15, Math.max(3, row.durationSec || 15)),
    status: effectiveStatus,
    startsAt,
    expiresAt,
    publishedAt: row.publishedAt ?? null,
    viewCount: row.viewCount ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    advisor,
  };
}

export const listActivePublic = query({
  args: { advisorUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const rows = await ctx.db.query("advisorStories").order("desc").take(240);
    const active = rows.filter((row) => {
      if (args.advisorUserId && row.ownerUserId !== args.advisorUserId) {
        return false;
      }
      if (row.status !== "published" && row.status !== "scheduled") {
        return false;
      }
      const start = row.startsAt ?? row.publishedAt ?? row.createdAt;
      const end = row.expiresAt ?? start + DAY;
      return start <= now && end > now;
    });

    const resolved = [];
    for (const row of active.slice(0, 80)) {
      const advisor = await advisorForUser(ctx, row.ownerUserId);
      if (!advisor.publicProfile || !advisor.slug) continue;
      resolved.push(await resolveStory(ctx, row));
    }
    return resolved;
  },
});

export const listManage = query({
  args: {},
  handler: async (ctx) => {
    const current = await canManageStories(ctx);
    if (!current) return [];
    const rows =
      current.role === OFFICE_ROLES.MANAGER
        ? await ctx.db.query("advisorStories").order("desc").take(300)
        : await ctx.db
            .query("advisorStories")
            .withIndex("by_owner_updated", (q) =>
              q.eq("ownerUserId", current.userId),
            )
            .order("desc")
            .take(150);

    return await Promise.all(
      rows.map(async (row) => ({
        ...(await resolveStory(ctx, row)),
        storageId: row.storageId,
      })),
    );
  },
});

export const generateStoryUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const current = await canManageStories(ctx);
    if (!current) {
      throw new Error("فقط مدیر و مشاور اجازه آپلود استوری را دارند.");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveDraft = mutation({
  args: {
    id: v.optional(v.id("advisorStories")),
    ownerUserId: v.string(),
    title: v.string(),
    body: v.string(),
    contentType: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("text"),
    ),
    storageId: v.optional(v.id("_storage")),
    linkUrl: v.string(),
    linkLabel: v.string(),
    stickerText: v.string(),
    stickerStyle: v.string(),
    background: v.string(),
    durationSec: v.number(),
    startsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const current = await canManageStories(ctx);
    if (!current) throw new Error("دسترسی ساخت استوری ندارید.");
    await assertStoryOwner(ctx, current, args.ownerUserId);

    if (
      args.contentType !== "text" &&
      !args.storageId &&
      !args.id
    ) {
      throw new Error("برای استوری عکس یا ویدئو باید فایل انتخاب شود.");
    }

    const now = Date.now();
    const data = {
      ownerUserId: args.ownerUserId,
      createdByUserId: current.userId,
      title: args.title.trim().slice(0, 80) || undefined,
      body: args.body.trim().slice(0, 500) || undefined,
      contentType: args.contentType,
      storageId: args.storageId,
      linkUrl: safeLink(args.linkUrl),
      linkLabel: args.linkLabel.trim().slice(0, 40) || undefined,
      stickerText: args.stickerText.trim().slice(0, 80) || undefined,
      stickerStyle: args.stickerStyle.trim().slice(0, 40) || "soft",
      background: args.background.trim().slice(0, 40) || "#0f5132",
      durationSec: Math.min(15, Math.max(3, Math.round(args.durationSec))),
      startsAt: args.startsAt,
      updatedAt: now,
    };

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("استوری پیدا نشد.");
      if (
        current.role !== OFFICE_ROLES.MANAGER &&
        existing.ownerUserId !== current.userId
      ) {
        throw new Error("اجازه ویرایش این استوری را ندارید.");
      }
      await ctx.db.patch(existing._id, {
        ...data,
        storageId: args.storageId ?? existing.storageId,
        status: "draft",
        publishedAt: undefined,
        expiresAt: undefined,
      });
      return existing._id;
    }

    return await ctx.db.insert("advisorStories", {
      ...data,
      status: "draft",
      createdAt: now,
    });
  },
});

export const publish = mutation({
  args: { id: v.id("advisorStories"), startsAt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const current = await canManageStories(ctx);
    if (!current) throw new Error("دسترسی انتشار استوری ندارید.");
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("استوری پیدا نشد.");
    if (
      current.role !== OFFICE_ROLES.MANAGER &&
      row.ownerUserId !== current.userId
    ) {
      throw new Error("اجازه انتشار این استوری را ندارید.");
    }

    if (row.contentType !== "text" && !row.storageId) {
      throw new Error("فایل استوری را انتخاب کنید.");
    }

    const now = Date.now();
    const startsAt = args.startsAt ?? row.startsAt ?? now;
    const scheduled = startsAt > now + 30_000;
    await ctx.db.patch(row._id, {
      status: scheduled ? "scheduled" : "published",
      startsAt,
      publishedAt: scheduled ? undefined : now,
      expiresAt: startsAt + DAY,
      updatedAt: now,
    });
    return true;
  },
});

export const archive = mutation({
  args: { id: v.id("advisorStories") },
  handler: async (ctx, args) => {
    const current = await canManageStories(ctx);
    if (!current) throw new Error("دسترسی آرشیو استوری ندارید.");
    const row = await ctx.db.get(args.id);
    if (!row) return true;
    if (
      current.role !== OFFICE_ROLES.MANAGER &&
      row.ownerUserId !== current.userId
    ) {
      throw new Error("اجازه آرشیو این استوری را ندارید.");
    }
    await ctx.db.patch(row._id, {
      status: "archived",
      expiresAt: Date.now(),
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const remove = mutation({
  args: { id: v.id("advisorStories") },
  handler: async (ctx, args) => {
    const current = await canManageStories(ctx);
    if (!current) throw new Error("دسترسی حذف استوری ندارید.");
    const row = await ctx.db.get(args.id);
    if (!row) return true;
    if (
      current.role !== OFFICE_ROLES.MANAGER &&
      row.ownerUserId !== current.userId
    ) {
      throw new Error("اجازه حذف این استوری را ندارید.");
    }
    await ctx.db.delete(row._id);
    return true;
  },
});

export const recordView = mutation({
  args: { id: v.id("advisorStories") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) return false;
    await ctx.db.patch(row._id, {
      viewCount: (row.viewCount ?? 0) + 1,
    });
    return true;
  },
});
