import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { OFFICE_ROLES } from "./schema";
import { currentRole } from "./permissions";
import { listingSearchText } from "../lib/listing-search";

async function requireManager(ctx: any) {
  const current = await currentRole(ctx);
  if (!current || current.role !== OFFICE_ROLES.MANAGER) {
    throw new Error("فقط مدیر اصلی به پشتیبان‌گیری و بازیابی دسترسی دارد.");
  }
  return current;
}

function stripMeta(row: any) {
  if (!row) return row;
  const { _id, _creationTime, ...rest } = row;
  return { ...rest, backupId: String(_id), backupCreationTime: _creationTime };
}

function cleanObject(value: any) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

export const exportCore = query({
  args: {},
  handler: async (ctx) => {
    await requireManager(ctx);

    const [
      settings,
      folders,
      leads,
      users,
      profiles,
      pages,
      posts,
      advisorProfiles,
      integrationRows,
    ] = await Promise.all([
      ctx.db.query("appSettings").collect(),
      ctx.db.query("folders").collect(),
      ctx.db.query("propertyLeads").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("userProfiles").collect(),
      ctx.db.query("sitePages").collect(),
      ctx.db.query("posts").collect(),
      ctx.db.query("advisorProfiles").collect(),
      ctx.db.query("integrationSecrets").collect(),
    ]);

    return {
      format: "divsaz-backup",
      version: 1,
      exportedAt: Date.now(),
      settings: settings.map(stripMeta),
      folders: folders.map(stripMeta),
      leads: leads.map(stripMeta),
      users: users.map((user: any) => ({
        backupId: String(user._id),
        name: user.name ?? "",
        email: user.email ?? "",
        isAnonymous: Boolean(user.isAnonymous),
      })),
      profiles: profiles.map(stripMeta),
      pages: pages.map(stripMeta),
      posts: posts.map(stripMeta),
      advisorProfiles: advisorProfiles.map(stripMeta),
      integrations: integrationRows.map((row: any) => ({
        key: row.key,
        telegramChatId: row.telegramChatId,
        baleChatId: row.baleChatId,
        openRouterModel: row.openRouterModel,
        notifyLeads: row.notifyLeads,
        notifyPublicationRequests: row.notifyPublicationRequests,
        notifyChatMessages: row.notifyChatMessages,
        updatedAt: row.updatedAt,
      })),
      note:
        "توکن‌های تلگرام/بله، کلید OpenRouter و رمزهای عبور کاربران عمداً در فایل پشتیبان ذخیره نمی‌شوند.",
    };
  },
});

export const exportListingsPage = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireManager(ctx);
    const page = await ctx.db
      .query("listings")
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...page,
      page: page.page.map((row: any) => {
        const value = stripMeta(row);
        delete value.publicSubmissionToken;
        delete value.publicSubmissionExpiresAt;
        return value;
      }),
    };
  },
});

export const restoreCore = mutation({
  args: { core: v.any() },
  handler: async (ctx, args) => {
    const manager = await requireManager(ctx);
    const core = cleanObject(args.core);

    const userIdMap: Record<string, string> = {};
    const folderIdMap: Record<string, string> = {};
    const unmatchedUsers: string[] = [];

    const currentUsers = await ctx.db.query("users").collect();
    const usersByEmail = new Map(
      currentUsers
        .filter((user: any) => user.email)
        .map((user: any) => [String(user.email).toLowerCase(), user]),
    );

    const backupProfiles = Array.isArray(core.profiles) ? core.profiles : [];
    for (const backupUser of Array.isArray(core.users) ? core.users : []) {
      const oldId = String(backupUser?.backupId || "");
      const email = String(backupUser?.email || "").trim().toLowerCase();
      if (!oldId || !email) continue;
      const currentUser: any = usersByEmail.get(email);
      if (!currentUser) {
        unmatchedUsers.push(email);
        continue;
      }

      userIdMap[oldId] = String(currentUser._id);
      const backupProfile = backupProfiles.find(
        (profile: any) => String(profile?.userId || "") === oldId,
      );
      if (!backupProfile) continue;

      const existing = (
        await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q: any) =>
            q.eq("userId", String(currentUser._id)),
          )
          .take(1)
      )[0];

      const profileData: any = {
        userId: String(currentUser._id),
        officeRole: backupProfile.officeRole,
        displayName: backupProfile.displayName,
        publicPhone: backupProfile.publicPhone,
        createdAt: backupProfile.createdAt || Date.now(),
      };
      delete profileData.backupId;
      delete profileData.backupCreationTime;

      if (existing) await ctx.db.patch(existing._id, profileData);
      else await ctx.db.insert("userProfiles", profileData);
    }

    const currentSettings = await ctx.db.query("appSettings").collect();
    for (const setting of Array.isArray(core.settings) ? core.settings : []) {
      if (!setting?.key) continue;
      const existing = currentSettings.find((row: any) => row.key === setting.key);
      const data: any = { ...setting };
      delete data.backupId;
      delete data.backupCreationTime;
      delete data._id;
      delete data._creationTime;
      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("appSettings", data);
    }

    const currentFolders = await ctx.db.query("folders").collect();
    for (const folder of Array.isArray(core.folders) ? core.folders : []) {
      const oldId = String(folder?.backupId || "");
      const name = String(folder?.name || "").trim();
      if (!oldId || !name) continue;
      let existing = currentFolders.find((row: any) => row.name === name);
      const data: any = {
        name,
        color: folder.color,
        order: folder.order,
        createdBy: folder.createdBy
          ? userIdMap[String(folder.createdBy)] || folder.createdBy
          : undefined,
        createdAt: folder.createdAt || Date.now(),
      };
      if (existing) {
        await ctx.db.patch(existing._id, data);
      } else {
        const id = await ctx.db.insert("folders", data);
        const created = await ctx.db.get(id);
        if (created) existing = created;
      }
      if (existing) folderIdMap[oldId] = String(existing._id);
    }

    const existingLeads = await ctx.db.query("propertyLeads").collect();
    const leadKeys = new Set(
      existingLeads.map(
        (lead: any) =>
          `${lead.phone}|${lead.createdAt}|${lead.intent}|${lead.propertyType}`,
      ),
    );
    let restoredLeads = 0;
    for (const lead of Array.isArray(core.leads) ? core.leads : []) {
      if (!lead?.phone || !lead?.intent || !lead?.propertyType) continue;
      const key = `${lead.phone}|${lead.createdAt}|${lead.intent}|${lead.propertyType}`;
      if (leadKeys.has(key)) continue;
      const data: any = { ...lead };
      delete data.backupId;
      delete data.backupCreationTime;
      if (data.createdByUserId) {
        data.createdByUserId =
          userIdMap[String(data.createdByUserId)] || undefined;
      }
      await ctx.db.insert("propertyLeads", data);
      leadKeys.add(key);
      restoredLeads++;
    }

    const restoreBySlug = async (
      table: "sitePages" | "posts",
      rows: any[],
    ) => {
      let count = 0;
      for (const row of rows) {
        const slug = String(row?.slug || "").trim();
        if (!slug) continue;
        const existing = (
          await ctx.db
            .query(table)
            .withIndex("by_slug", (q: any) => q.eq("slug", slug))
            .take(1)
        )[0];
        const data: any = { ...row };
        delete data.backupId;
        delete data.backupCreationTime;
        if (table === "sitePages") {
          data.createdByUserId =
            userIdMap[String(data.createdByUserId || "")] || manager.userId;
        } else if (data.authorId) {
          data.authorId = userIdMap[String(data.authorId)] || manager.userId;
        }
        if (existing) await ctx.db.patch(existing._id, data);
        else await ctx.db.insert(table, data);
        count++;
      }
      return count;
    };

    let restoredAdvisorProfiles = 0;
    for (const profile of Array.isArray(core.advisorProfiles)
      ? core.advisorProfiles
      : []) {
      const mappedUserId = userIdMap[String(profile?.userId || "")];
      if (!mappedUserId) continue;

      const existing = (
        await ctx.db
          .query("advisorProfiles")
          .withIndex("by_user", (q: any) => q.eq("userId", mappedUserId))
          .take(1)
      )[0];

      const data: any = { ...profile, userId: mappedUserId };
      delete data.backupId;
      delete data.backupCreationTime;
      delete data._id;
      delete data._creationTime;
      if (data.createdByUserId) {
        data.createdByUserId =
          userIdMap[String(data.createdByUserId)] || mappedUserId;
      }

      if (existing) await ctx.db.patch(existing._id, data);
      else await ctx.db.insert("advisorProfiles", data);
      restoredAdvisorProfiles++;
    }

    for (const integration of Array.isArray(core.integrations)
      ? core.integrations
      : []) {
      const key = String(integration?.key || "").trim();
      if (!key) continue;
      const existing = (
        await ctx.db
          .query("integrationSecrets")
          .withIndex("by_key", (q: any) => q.eq("key", key))
          .take(1)
      )[0];

      const safeData: any = {
        key,
        telegramChatId: integration.telegramChatId,
        baleChatId: integration.baleChatId,
        openRouterModel: integration.openRouterModel,
        notifyLeads: integration.notifyLeads,
        notifyPublicationRequests: integration.notifyPublicationRequests,
        notifyChatMessages: integration.notifyChatMessages,
        updatedAt: Date.now(),
      };

      if (existing) {
        await ctx.db.patch(existing._id, safeData);
      } else {
        await ctx.db.insert("integrationSecrets", safeData);
      }
    }

    const restoredPages = await restoreBySlug(
      "sitePages",
      Array.isArray(core.pages) ? core.pages : [],
    );
    const restoredPosts = await restoreBySlug(
      "posts",
      Array.isArray(core.posts) ? core.posts : [],
    );

    return {
      userIdMap,
      folderIdMap,
      unmatchedUsers,
      restoredLeads,
      restoredPages,
      restoredPosts,
      restoredAdvisorProfiles,
    };
  },
});

export const restoreListings = mutation({
  args: {
    items: v.array(v.any()),
    userIdMap: v.any(),
    folderIdMap: v.any(),
  },
  handler: async (ctx, args) => {
    await requireManager(ctx);
    const userIdMap = cleanObject(args.userIdMap) as Record<string, string>;
    const folderIdMap = cleanObject(args.folderIdMap) as Record<string, string>;

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const raw of args.items) {
      if (!raw || typeof raw !== "object") {
        skipped++;
        continue;
      }
      const key = String(raw.key || "").trim();
      if (!key) {
        skipped++;
        continue;
      }

      const data: any = { ...raw, key };
      delete data.backupId;
      delete data.backupCreationTime;
      delete data._id;
      delete data._creationTime;
      delete data.publicSubmissionToken;
      delete data.publicSubmissionExpiresAt;

      if (data.createdByUserId) {
        data.createdByUserId =
          userIdMap[String(data.createdByUserId)] || data.createdByUserId;
      }
      if (Array.isArray(data.folderIds)) {
        data.folderIds = data.folderIds
          .map((id: any) => folderIdMap[String(id)] || String(id))
          .filter(Boolean);
      }
      if (!data.listingKind) {
        data.listingKind =
          data.submissionSource === "public_mobile" ||
          data.isPublic ||
          data.publicationStatus === "approved" ||
          data.publicationStatus === "pending"
            ? "member"
            : data.radarCode || data.divarUrl
              ? "imported"
              : "member";
      }
      data.searchText = listingSearchText(data);
      if (data.showOnLanding === undefined) {
        data.showOnLanding = Boolean(data.featuredOnHome && data.isPublic);
      }

      const existing = (
        await ctx.db
          .query("listings")
          .withIndex("by_key", (q: any) => q.eq("key", key))
          .take(1)
      )[0];

      if (existing) {
        await ctx.db.patch(existing._id, data);
        updated++;
      } else {
        await ctx.db.insert("listings", data);
        added++;
      }
    }

    return { added, updated, skipped };
  },
});
