import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  canEditListing,
  canManageListings,
  canManageSite,
  canWorkListings,
  currentRole,
} from "./permissions";

const DAY = 24 * 60 * 60 * 1000;

function normalizeJalaliDate(value: string) {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .trim()
    .replace(/[/\.]/g, "-");
  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function daysInJalaliMonth(month: number) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // برای محاسبه پنجره ماهانه، ۳۰ روز در اسفند باعث از دست رفتن روز کبیسه نمی‌شود.
  return 30;
}

function formatJalali(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function subtractJalaliMonths(value: string, months: number) {
  const date = normalizeJalaliDate(value);
  if (!date) throw new Error("تاریخ امروز معتبر نیست.");
  const total = date.year * 12 + (date.month - 1) - months;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12 + 1;
  const day = Math.min(date.day, daysInJalaliMonth(month));
  return formatJalali(year, month, day);
}

async function getSettings(ctx: Parameters<typeof currentRole>[0]) {
  const rows = await ctx.db
    .query("appSettings")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .take(2);
  const row = rows[0];
  return {
    reminderAgeMonths: Math.min(
      36,
      Math.max(1, Math.round(row?.reminderAgeMonths ?? 11)),
    ),
    reminderVisibleDays: Math.min(
      30,
      Math.max(1, Math.round(row?.reminderVisibleDays ?? 10)),
    ),
  };
}

function summary(row: any) {
  return {
    listingId: row._id,
    key: row.key,
    radarCode: row.radarCode ?? "",
    title:
      row.title ||
      `${row.dealType || "آگهی"} ${row.propertyType || "ملک"}${row.area ? ` ${row.area} متری` : ""} در ${row.city || "شهریار"}`,
    city: row.city ?? "",
    neighborhood: row.neighborhood ?? "",
    propertyType: row.propertyType ?? "",
    dealType: row.dealType ?? "",
    area: row.area ?? null,
    phone: row.phone ?? "",
    date: row.date ?? "",
    dateRaw: row.dateRaw ?? "",
    divarUrl: row.divarUrl ?? "",
    publicSlug: row.isPublic ? row.publicSlug ?? "" : "",
    createdByUserId: row.createdByUserId ?? "",
  };
}

export const listPanel = query({
  args: {
    todayJalali: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const current = await currentRole(ctx);
    if (!current || !canWorkListings(current.role)) {
      return {
        settings: { reminderAgeMonths: 11, reminderVisibleDays: 10 },
        candidates: [],
        due: [],
      };
    }

    const today = normalizeJalaliDate(args.todayJalali);
    if (!today) throw new Error("تاریخ امروز معتبر نیست.");

    const settings = await getSettings(ctx);
    const newestEligible = subtractJalaliMonths(
      args.todayJalali,
      settings.reminderAgeMonths,
    );
    const oldestEligible = subtractJalaliMonths(
      args.todayJalali,
      settings.reminderAgeMonths + 1,
    );

    const candidateRows = await ctx.db
      .query("listings")
      .withIndex("by_date", (q) =>
        q.gt("date", oldestEligible).lte("date", newestEligible),
      )
      .order("desc")
      .take(1000);

    const reminders = await ctx.db.query("listingReminders").collect();
    const reminderByListing = new Map<string, typeof reminders>();
    for (const reminder of reminders) {
      const id = String(reminder.listingId);
      const list = reminderByListing.get(id) ?? [];
      list.push(reminder);
      reminderByListing.set(id, list);
    }

    const candidates = candidateRows
      .filter((row) =>
        canEditListing(current.role, current.userId, row.createdByUserId),
      )
      .map((row) => {
        const planned = (reminderByListing.get(String(row._id)) ?? [])
          .sort((a, b) => a.slot - b.slot)
          .map((item) => ({
            slot: item.slot,
            remindAt: item.remindAt,
          }));
        return { ...summary(row), planned };
      });

    const from = args.now - settings.reminderVisibleDays * DAY;
    const dueRows = await ctx.db
      .query("listingReminders")
      .withIndex("by_remind_at", (q) =>
        q.gte("remindAt", from).lte("remindAt", args.now),
      )
      .order("desc")
      .take(300);

    const dueByListing = new Map<
      string,
      { listing: any; reminders: Array<{ slot: 1 | 2; remindAt: number }> }
    >();

    for (const reminder of dueRows) {
      const listing = await ctx.db.get(reminder.listingId);
      if (!listing) continue;
      if (
        !canEditListing(current.role, current.userId, listing.createdByUserId)
      ) {
        continue;
      }

      const id = String(listing._id);
      const existing = dueByListing.get(id);
      const item = {
        slot: reminder.slot as 1 | 2,
        remindAt: reminder.remindAt,
      };
      if (existing) {
        existing.reminders.push(item);
      } else {
        dueByListing.set(id, {
          listing,
          reminders: [item],
        });
      }
    }

    const due = Array.from(dueByListing.values())
      .map(({ listing, reminders: items }) => ({
        ...summary(listing),
        reminders: items.sort((a, b) => a.remindAt - b.remindAt),
      }))
      .sort(
        (a, b) =>
          Math.max(...b.reminders.map((item) => item.remindAt)) -
          Math.max(...a.reminders.map((item) => item.remindAt)),
      );

    return { settings, candidates, due };
  },
});

export const setGlobalSettings = mutation({
  args: {
    reminderAgeMonths: v.number(),
    reminderVisibleDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const current = await currentRole(ctx);
    if (!current || !canManageSite(current.role)) {
      throw new Error("فقط مدیر اصلی می‌تواند تنظیمات سراسری یادآوری را تغییر دهد.");
    }

    const reminderAgeMonths = Math.min(
      36,
      Math.max(1, Math.round(args.reminderAgeMonths)),
    );
    const reminderVisibleDays = Math.min(
      30,
      Math.max(1, Math.round(args.reminderVisibleDays ?? 10)),
    );

    const rows = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .take(2);
    const existing = rows[0];
    const patch = {
      reminderAgeMonths,
      reminderVisibleDays,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("appSettings", { key: "global", ...patch });
    }

    return patch;
  },
});

export const setListingReminders = mutation({
  args: {
    listingId: v.id("listings"),
    firstAt: v.optional(v.number()),
    secondAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("ورود لازم است.");

    const current = await currentRole(ctx);
    if (!current || !canWorkListings(current.role)) {
      throw new Error("دسترسی تنظیم یادآوری ندارید.");
    }

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("آگهی پیدا نشد.");
    if (
      !canEditListing(current.role, current.userId, listing.createdByUserId)
    ) {
      throw new Error("این آگهی متعلق به مشاور دیگری است.");
    }

    if (
      args.firstAt != null &&
      args.secondAt != null &&
      Math.abs(args.firstAt - args.secondAt) < DAY
    ) {
      throw new Error("دو یادآوری باید برای دو روز متفاوت باشند.");
    }

    const existing = await ctx.db
      .query("listingReminders")
      .withIndex("by_listing_slot", (q) => q.eq("listingId", args.listingId))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);

    const now = Date.now();
    if (args.firstAt != null) {
      await ctx.db.insert("listingReminders", {
        listingId: listing._id,
        listingKey: listing.key,
        slot: 1,
        remindAt: args.firstAt,
        createdByUserId: current.userId,
        createdAt: now,
        updatedAt: now,
      });
    }
    if (args.secondAt != null) {
      await ctx.db.insert("listingReminders", {
        listingId: listing._id,
        listingKey: listing.key,
        slot: 2,
        remindAt: args.secondAt,
        createdByUserId: current.userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return true;
  },
});

export const clearListingReminders = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const current = await currentRole(ctx);
    if (!current || !canWorkListings(current.role)) {
      throw new Error("دسترسی حذف یادآوری ندارید.");
    }
    const listing = await ctx.db.get(args.listingId);
    if (!listing) return true;
    if (
      !canManageListings(current.role) &&
      listing.createdByUserId !== current.userId
    ) {
      throw new Error("این آگهی متعلق به مشاور دیگری است.");
    }

    const existing = await ctx.db
      .query("listingReminders")
      .withIndex("by_listing_slot", (q) => q.eq("listingId", args.listingId))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);
    return true;
  },
});
