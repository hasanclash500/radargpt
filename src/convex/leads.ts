import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { OFFICE_ROLES, type OfficeRole } from "./schema";
import { canManageLeads, roleForUser } from "./permissions";

async function role(ctx: Pick<QueryCtx, "db" | "auth">): Promise<OfficeRole> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return OFFICE_ROLES.GUEST;
  return await roleForUser(ctx, String(userId));
}

function cleanPhone(value: string) {
  return value.replace(/[^0-9۰-۹٠-٩]/g, "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
}

export const createLead = mutation({
  args: {
    intent: v.union(
      v.literal("buy"),
      v.literal("rent"),
      v.literal("sell"),
      v.literal("lease_out"),
    ),
    name: v.string(),
    phone: v.string(),
    city: v.string(),
    propertyType: v.string(),
    area: v.optional(v.number()),
    budget: v.optional(v.string()),
    details: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Honeypot ساده برای کاهش اسپم ربات‌ها.
    if (args.website?.trim()) {
      return { ok: true, id: null };
    }

    const name = args.name.trim().slice(0, 80);
    const phone = cleanPhone(args.phone).slice(0, 20);
    const city = args.city.trim().slice(0, 80);
    const propertyType = args.propertyType.trim().slice(0, 80);
    const budget = args.budget?.trim().slice(0, 160) || undefined;
    const details = args.details?.trim().slice(0, 1500) || undefined;

    if (name.length < 2) throw new Error("نام را کامل وارد کنید.");
    if (!/^09\d{9}$/.test(phone)) {
      throw new Error("شماره تماس معتبر وارد کنید.");
    }
    if (!city) throw new Error("شهر را وارد کنید.");
    if (!propertyType) throw new Error("نوع ملک را انتخاب کنید.");

    const now = Date.now();
    const id = await ctx.db.insert("propertyLeads", {
      intent: args.intent,
      name,
      phone,
      city,
      propertyType,
      area: args.area,
      budget,
      details,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.integrations.notifyLead, {
      intent: args.intent,
      name,
      phone,
      city,
      propertyType,
      ...(args.area != null ? { area: args.area } : {}),
      ...(budget ? { budget } : {}),
      ...(details ? { details } : {}),
    });

    return { ok: true, id };
  },
});

export const listLeads = query({
  args: {},
  handler: async (ctx) => {
    const r = await role(ctx);
    if (!canManageLeads(r)) return [];
    return await ctx.db.query("propertyLeads").withIndex("by_created").order("desc").take(300);
  },
});

export const setLeadStatus = mutation({
  args: {
    id: v.id("propertyLeads"),
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const r = await role(ctx);
    if (!canManageLeads(r)) {
      throw new Error("دسترسی کافی ندارید.");
    }
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.status;
  },
});
