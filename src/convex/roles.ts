import {
  getAuthUserId,
  invalidateSessions,
  modifyAccountCredentials,
} from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import {
  action,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  OFFICE_ROLES,
  PRIVILEGED_ROLES,
  type OfficeRole,
} from "./schema";
import {
  canManageListings,
  canManageSite,
  currentRole,
  rawProfile,
  roleForUser,
} from "./permissions";

export const isPrivileged = (role: OfficeRole) =>
  PRIVILEGED_ROLES.includes(role);

async function requireManager(ctx: Parameters<typeof currentRole>[0]) {
  const current = await currentRole(ctx);
  if (!current || !canManageSite(current.role)) {
    throw new Error("فقط مدیر اصلی اجازهٔ مدیریت کاربران را دارد.");
  }
  return current;
}

async function clearUserSessions(ctx: MutationCtx, userId: Id<"users">) {
  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();

  for (const session of sessions) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const token of refreshTokens) await ctx.db.delete(token._id);

    const verifiers = await ctx.db.query("authVerifiers").collect();
    for (const verifier of verifiers) {
      if (verifier.sessionId === session._id) await ctx.db.delete(verifier._id);
    }

    await ctx.db.delete(session._id);
  }
}

async function maybePromoteLegacyOwner(ctx: MutationCtx, userId: string) {
  const profile = await rawProfile(ctx, userId);
  if (!profile) return null;

  const effective = await roleForUser(ctx, userId);
  if (
    effective === OFFICE_ROLES.MANAGER &&
    profile.officeRole !== OFFICE_ROLES.MANAGER
  ) {
    await ctx.db.patch(profile._id, { officeRole: OFFICE_ROLES.MANAGER });
  }
  return effective;
}

export const myRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const profile = await rawProfile(ctx, String(userId));
    if (!profile) return null;

    const role = await roleForUser(ctx, String(userId));
    return {
      role,
      isPrivileged: isPrivileged(role),
      canManageSite: canManageSite(role),
      canManageListings: canManageListings(role),
      ownsOnlyListings: role === OFFICE_ROLES.CONSULTANT,
      displayName: profile.displayName ?? "",
      publicPhone: profile.publicPhone ?? "",
    };
  },
});

/**
 * اولین حساب سیستم «مدیر» می‌شود. برای پروژه‌های قبلی، قدیمی‌ترین admin
 * به‌صورت امن به manager مهاجرت می‌کند.
 */
export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("ورود لازم است.");
    const id = String(userId);

    const existing = await rawProfile(ctx, id);
    if (existing) {
      const promoted = await maybePromoteLegacyOwner(ctx, id);
      const role =
        promoted ??
        ((existing.officeRole ?? OFFICE_ROLES.GUEST) as OfficeRole);
      return {
        role,
        isPrivileged: isPrivileged(role),
        canManageSite: canManageSite(role),
        canManageListings: canManageListings(role),
        ownsOnlyListings: role === OFFICE_ROLES.CONSULTANT,
        displayName: existing.displayName ?? "",
        publicPhone: existing.publicPhone ?? "",
      };
    }

    const authUser = await ctx.db.get(userId);
    const email = authUser?.email?.trim().toLowerCase() ?? "";
    const pending = email
      ? (
          await ctx.db
            .query("pendingUserRestores")
            .withIndex("by_email", (q) => q.eq("email", email))
            .take(1)
        )[0]
      : null;

    if (pending) {
      const restoredRole =
        (pending.officeRole as OfficeRole | undefined) ?? OFFICE_ROLES.USER;
      await ctx.db.insert("userProfiles", {
        userId: id,
        officeRole: restoredRole,
        displayName: pending.displayName,
        publicPhone: pending.publicPhone,
        createdAt: Date.now(),
      });

      const advisor = pending.advisorProfile as Record<string, any> | undefined;
      if (advisor?.slug) {
        const data: any = {
          ...advisor,
          userId: id,
          createdAt: Number(advisor.createdAt || Date.now()),
          updatedAt: Date.now(),
        };
        delete data._id;
        delete data._creationTime;
        delete data.backupId;
        delete data.backupCreationTime;
        await ctx.db.insert("advisorProfiles", data);
      }

      await ctx.db.delete(pending._id);
      return {
        role: restoredRole,
        isPrivileged: isPrivileged(restoredRole),
        canManageSite: canManageSite(restoredRole),
        canManageListings: canManageListings(restoredRole),
        ownsOnlyListings: restoredRole === OFFICE_ROLES.CONSULTANT,
        displayName: pending.displayName ?? "",
        publicPhone: pending.publicPhone ?? "",
      };
    }

    const profiles = await ctx.db.query("userProfiles").take(1);
    const role: OfficeRole =
      profiles.length === 0 ? OFFICE_ROLES.MANAGER : OFFICE_ROLES.USER;
    await ctx.db.insert("userProfiles", {
      userId: id,
      officeRole: role,
      createdAt: Date.now(),
    });
    return {
      role,
      isPrivileged: isPrivileged(role),
      canManageSite: canManageSite(role),
      canManageListings: canManageListings(role),
      ownsOnlyListings: false,
      displayName: "",
      publicPhone: "",
    };
  },
});

export const updateMyPublicContact = mutation({
  args: {
    displayName: v.string(),
    publicPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("ورود لازم است.");
    const existing = await rawProfile(ctx, String(userId));
    if (!existing) throw new Error("پروفایل کاربر ساخته نشده است.");

    const displayName = args.displayName.trim();
    const publicPhone = args.publicPhone.replace(/\D/g, "");
    if (publicPhone && !/^09\d{9}$/.test(publicPhone)) {
      throw new Error("شماره تماس عمومی باید ۱۱ رقم و با 09 شروع شود.");
    }

    await ctx.db.patch(existing._id, {
      displayName: displayName || undefined,
      publicPhone: publicPhone || undefined,
    });
    return { displayName, publicPhone };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const current = await currentRole(ctx);
    if (!current || !canManageSite(current.role)) return null;

    const profiles = await ctx.db.query("userProfiles").collect();
    const users = await ctx.db.query("users").collect();
    return await Promise.all(
      users.map(async (user) => {
        const profile = profiles.find((item) => item.userId === String(user._id));
        const role = profile
          ? await roleForUser(ctx, String(user._id))
          : OFFICE_ROLES.USER;
        return {
          userId: user._id,
          name: user.name ?? "",
          email: user.email ?? "",
          isAnonymous: user.isAnonymous ?? false,
          role,
          displayName: profile?.displayName ?? "",
          publicPhone: profile?.publicPhone ?? "",
          isSelf: String(user._id) === current.userId,
        };
      }),
    );
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal(OFFICE_ROLES.MANAGER),
      v.literal(OFFICE_ROLES.ADMIN),
      v.literal(OFFICE_ROLES.CONSULTANT),
      v.literal(OFFICE_ROLES.USER),
    ),
  },
  handler: async (ctx, args) => {
    const current = await requireManager(ctx);
    const targetId = String(args.userId);

    if (targetId === current.userId && args.role !== OFFICE_ROLES.MANAGER) {
      const managers = await ctx.db
        .query("userProfiles")
        .withIndex("by_role", (q) => q.eq("officeRole", OFFICE_ROLES.MANAGER))
        .collect();
      if (managers.length <= 1) {
        throw new Error("آخرین مدیر سیستم را نمی‌توان تنزل نقش داد.");
      }
    }

    const profile = await rawProfile(ctx, targetId);
    if (profile) {
      await ctx.db.patch(profile._id, { officeRole: args.role });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: targetId,
        officeRole: args.role,
        createdAt: Date.now(),
      });
    }
    return args.role;
  },
});

export const updateUserEmail = mutation({
  args: { userId: v.id("users"), email: v.string() },
  handler: async (ctx, args) => {
    await requireManager(ctx);

    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("ایمیل معتبر وارد کنید.");
    }

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("کاربر پیدا نشد.");

    const duplicateUsers = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .take(2);
    if (duplicateUsers.some((user) => user._id !== args.userId)) {
      throw new Error("این ایمیل قبلاً استفاده شده است.");
    }

    const passwordAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", args.userId).eq("provider", "password"),
      )
      .unique();

    if (passwordAccount) {
      const duplicateAccount = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", email),
        )
        .unique();
      if (duplicateAccount && duplicateAccount._id !== passwordAccount._id) {
        throw new Error("برای این ایمیل حساب ورود دیگری وجود دارد.");
      }
      await ctx.db.patch(passwordAccount._id, { providerAccountId: email });
    }

    await ctx.db.patch(args.userId, { email });
    await clearUserSessions(ctx, args.userId);
    return email;
  },
});

export const managerCredentialTarget = internalQuery({
  args: {
    requesterId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const role = await roleForUser(ctx, String(args.requesterId));
    if (!canManageSite(role)) {
      throw new Error("فقط مدیر اصلی اجازهٔ تغییر رمز عبور را دارد.");
    }

    const target = await ctx.db.get(args.targetUserId);
    if (!target?.email) throw new Error("حساب مقصد ایمیل ورود ندارد.");

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", args.targetUserId).eq("provider", "password"),
      )
      .unique();
    if (!account) throw new Error("برای این کاربر حساب رمزعبور وجود ندارد.");

    return { email: target.email };
  },
});

export const resetUserPassword = action({
  args: { userId: v.id("users"), newPassword: v.string() },
  handler: async (ctx, args) => {
    const requesterId = await getAuthUserId(ctx);
    if (requesterId === null) throw new Error("ورود لازم است.");
    if (args.newPassword.length < 8) {
      throw new Error("رمز عبور باید حداقل ۸ کاراکتر باشد.");
    }

    const target = await ctx.runQuery(internal.roles.managerCredentialTarget, {
      requesterId,
      targetUserId: args.userId,
    });

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: target.email, secret: args.newPassword },
    });
    await invalidateSessions(ctx, { userId: args.userId });
    return true;
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const current = await requireManager(ctx);
    if (String(args.userId) === current.userId) {
      throw new Error("حسابی که با آن وارد شده‌اید قابل حذف نیست.");
    }

    const targetProfile = await rawProfile(ctx, String(args.userId));
    const targetRole = targetProfile
      ? await roleForUser(ctx, String(args.userId))
      : OFFICE_ROLES.USER;

    if (targetRole === OFFICE_ROLES.MANAGER) {
      const managers = await ctx.db
        .query("userProfiles")
        .withIndex("by_role", (q) => q.eq("officeRole", OFFICE_ROLES.MANAGER))
        .collect();
      if (managers.length <= 1) {
        throw new Error("آخرین مدیر سیستم قابل حذف نیست.");
      }
    }

    await clearUserSessions(ctx, args.userId);

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId))
      .collect();

    for (const account of accounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) await ctx.db.delete(code._id);
      await ctx.db.delete(account._id);
    }

    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", String(args.userId)))
      .collect();
    for (const profile of profiles) await ctx.db.delete(profile._id);

    await ctx.db.delete(args.userId);
    return true;
  },
});
