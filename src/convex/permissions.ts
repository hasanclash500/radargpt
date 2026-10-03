import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx } from "./_generated/server";
import {
  LISTING_ADMIN_ROLES,
  OFFICE_ROLES,
  PRIVILEGED_ROLES,
  type OfficeRole,
} from "./schema";

type RoleCtx = Pick<QueryCtx, "db" | "auth">;

export async function rawProfile(ctx: RoleCtx, userId: string) {
  const rows = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(2);
  return rows[0] ?? null;
}

async function isLegacyOwner(ctx: RoleCtx, userId: string, role: OfficeRole) {
  if (role !== OFFICE_ROLES.ADMIN) return false;

  const managers = await ctx.db
    .query("userProfiles")
    .withIndex("by_role", (q) => q.eq("officeRole", OFFICE_ROLES.MANAGER))
    .take(1);
  if (managers.length > 0) return false;

  const admins = await ctx.db
    .query("userProfiles")
    .withIndex("by_role", (q) => q.eq("officeRole", OFFICE_ROLES.ADMIN))
    .collect();

  admins.sort(
    (a, b) =>
      (a.createdAt ?? a._creationTime) - (b.createdAt ?? b._creationTime),
  );
  return admins[0]?.userId === userId;
}

/**
 * نقش مؤثر کاربر. برای مهاجرت بدون قفل‌شدن پنل، قدیمی‌ترین admin قبلی
 * تا زمان ذخیره شدن نقش جدید به‌عنوان manager شناخته می‌شود.
 */
export async function roleForUser(
  ctx: RoleCtx,
  userId: string,
): Promise<OfficeRole> {
  const profile = await rawProfile(ctx, userId);
  const role = (profile?.officeRole ?? OFFICE_ROLES.GUEST) as OfficeRole;
  if (await isLegacyOwner(ctx, userId, role)) return OFFICE_ROLES.MANAGER;
  return role;
}

export async function currentRole(ctx: RoleCtx): Promise<{
  userId: string;
  role: OfficeRole;
} | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return { userId: String(userId), role: await roleForUser(ctx, String(userId)) };
}

export const canManageSite = (role: OfficeRole) =>
  role === OFFICE_ROLES.MANAGER;

export const canManageListings = (role: OfficeRole) =>
  LISTING_ADMIN_ROLES.includes(role);

export const canWorkListings = (role: OfficeRole) =>
  PRIVILEGED_ROLES.includes(role);

export const ownsOnlyListings = (role: OfficeRole) =>
  role === OFFICE_ROLES.CONSULTANT;

export function canEditListing(
  role: OfficeRole,
  currentUserId: string,
  createdByUserId?: string,
) {
  if (canManageListings(role)) return true;
  return role === OFFICE_ROLES.CONSULTANT && createdByUserId === currentUserId;
}
