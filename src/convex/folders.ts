import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { OFFICE_ROLES } from "./schema";
import {
  canManageListings,
  canManageSite,
  canWorkListings,
  currentRole,
} from "./permissions";
import { DEFAULT_LISTING_FIELD_CONFIGS } from "../lib/listing-field-config";

const fieldDefinitionValidator = v.object({
  id: v.string(),
  label: v.string(),
  type: v.union(
    v.literal("text"),
    v.literal("number"),
    v.literal("boolean"),
    v.literal("select"),
    v.literal("textarea"),
  ),
  required: v.boolean(),
  public: v.boolean(),
  unit: v.optional(v.string()),
  placeholder: v.optional(v.string()),
  options: v.optional(v.array(v.string())),
  order: v.number(),
});

const fieldConfigValidator = v.object({
  id: v.string(),
  name: v.string(),
  propertyTypes: v.array(v.string()),
  fields: v.array(fieldDefinitionValidator),
});

/** همهٔ زونکن‌های بایگانی. */
export const listFolders = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("folders").order("asc").collect();
  },
});

/** ساخت زونکن جدید — فقط مدیر و مشاور. */
export const createFolder = mutation({
  args: { name: v.string(), color: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const current = await currentRole(ctx);
    if (!current || !canWorkListings(current.role)) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ ساخت زونکن را دارد.");
    }
    const count = await ctx.db.query("folders").take(500);
    return await ctx.db.insert("folders", {
      name: args.name,
      color: args.color,
      order: count.length,
      createdAt: Date.now(),
    });
  },
});

/** حذف زونکن — فقط مدیر و مشاور. */
export const deleteFolder = mutation({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const current = await currentRole(ctx);
    if (!current || !canWorkListings(current.role)) {
      throw new Error("فقط مدیر یا مشاور اجازهٔ حذف زونکن را دارد.");
    }
    await ctx.db.delete(args.folderId);
    return args.folderId;
  },
});

/** تنظیمات دفتر: نام، شمارهٔ تماس، متن پایانی پیام‌ها و دسته‌های سفارشی. */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    // take به‌جای unique: اگر دو ردیف تنظیمات موجود باشد، کوئری کرش نکند
    const rows = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .take(2);
    const settings = rows[0] ?? null;
    const current = await currentRole(ctx);
    const canSeeImportSettings =
      current !== null && canManageListings(current.role);

    return {
      key: "global",
      officeName: settings?.officeName ?? "مکا",
      managerPhone: settings?.managerPhone ?? "09120858095",
      shareFooter: settings?.shareFooter ?? "",
      customCities: settings?.customCities ?? [],
      customDeals: settings?.customDeals ?? [],
      customPropertyTypes: settings?.customPropertyTypes ?? [],
      listingFieldConfigs:
        settings?.listingFieldConfigs ?? DEFAULT_LISTING_FIELD_CONFIGS,
      sourceUrl: canSeeImportSettings ? (settings?.sourceUrl ?? "") : "",
      lastImportAt: canSeeImportSettings ? settings?.lastImportAt : undefined,
      lastImportAdded: canSeeImportSettings ? settings?.lastImportAdded : undefined,
      lastImportUpdated: canSeeImportSettings ? settings?.lastImportUpdated : undefined,
      lastImportError: canSeeImportSettings ? settings?.lastImportError : undefined,
      updatedAt: settings?.updatedAt,
    };
  },
});

/** ذخیرهٔ تنظیمات. */
export const updateSettings = mutation({
  args: {
    officeName: v.optional(v.string()),
    managerPhone: v.optional(v.string()),
    shareFooter: v.optional(v.string()),
    customCities: v.optional(v.array(v.string())),
    customDeals: v.optional(v.array(v.string())),
    customPropertyTypes: v.optional(v.array(v.string())),
    listingFieldConfigs: v.optional(v.array(fieldConfigValidator)),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const current = await currentRole(ctx);
    if (!current) throw new Error("ورود لازم است.");
    const manager = canManageSite(current.role);
    const listingAdmin = canManageListings(current.role);
    if (!manager && !listingAdmin) {
      throw new Error("دسترسی تغییر تنظیمات را ندارید.");
    }
    if (
      !manager &&
      (args.officeName !== undefined ||
        args.managerPhone !== undefined ||
        args.shareFooter !== undefined)
    ) {
      throw new Error("فقط مدیر اصلی می‌تواند اطلاعات دفتر را تغییر دهد.");
    }
    const rows = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .take(2);
    const existing = rows[0];
    const data = { ...args, key: "global", updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("appSettings", data);
  },
});
