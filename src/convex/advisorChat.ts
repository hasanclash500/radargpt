import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { OFFICE_ROLES } from "./schema";
import { currentRole, roleForUser } from "./permissions";

function canUseAdvisorChat(role: string) {
  return role === OFFICE_ROLES.MANAGER || role === OFFICE_ROLES.CONSULTANT;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

async function requireChatUser(ctx: any) {
  const current = await currentRole(ctx);
  if (!current || !canUseAdvisorChat(current.role)) {
    throw new Error("چت داخلی فقط برای مدیر و مشاوران دیوساز فعال است.");
  }
  return current;
}

async function personInfo(ctx: any, userId: string) {
  const profile = (
    await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .take(1)
  )[0];
  const advisor = (
    await ctx.db
      .query("advisorProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .take(1)
  )[0];

  const imageUrl = advisor?.profileImageStorageId
    ? await ctx.storage.getUrl(advisor.profileImageStorageId)
    : null;

  return {
    userId,
    displayName: profile?.displayName || "مشاور دیوساز",
    role: await roleForUser(ctx, userId),
    imageUrl,
    profileSlug: advisor?.publicProfile ? advisor.slug : "",
    headline: advisor?.headline || "",
  };
}

async function assertConversationAccess(ctx: any, conversationId: any, userId: string) {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) throw new Error("گفت‌وگو پیدا نشد.");
  if (
    conversation.participantA !== userId &&
    conversation.participantB !== userId
  ) {
    throw new Error("به این گفت‌وگو دسترسی ندارید.");
  }
  return conversation;
}

export const listContacts = query({
  args: {},
  handler: async (ctx) => {
    const current = await currentRole(ctx);
    if (!current || !canUseAdvisorChat(current.role)) return [];

    const profiles = await ctx.db.query("userProfiles").collect();
    const rows = [];
    for (const profile of profiles) {
      if (profile.userId === current.userId) continue;
      const role = await roleForUser(ctx, profile.userId);
      if (!canUseAdvisorChat(role)) continue;
      rows.push(await personInfo(ctx, profile.userId));
    }

    return rows.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "fa"),
    );
  },
});

export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const current = await currentRole(ctx);
    if (!current || !canUseAdvisorChat(current.role)) return [];

    const [asA, asB] = await Promise.all([
      ctx.db
        .query("advisorConversations")
        .withIndex("by_a_updated", (q: any) =>
          q.eq("participantA", current.userId),
        )
        .order("desc")
        .take(100),
      ctx.db
        .query("advisorConversations")
        .withIndex("by_b_updated", (q: any) =>
          q.eq("participantB", current.userId),
        )
        .order("desc")
        .take(100),
    ]);

    const conversations = [...asA, ...asB].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );

    return await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId =
          conversation.participantA === current.userId
            ? conversation.participantB
            : conversation.participantA;
        const other = await personInfo(ctx, otherUserId);
        const readRow = (
          await ctx.db
            .query("advisorConversationReads")
            .withIndex("by_conversation_user", (q: any) =>
              q
                .eq("conversationId", conversation._id)
                .eq("userId", current.userId),
            )
            .take(1)
        )[0];
        const lastReadAt = readRow?.lastReadAt ?? 0;
        const messages = await ctx.db
          .query("advisorMessages")
          .withIndex("by_conversation_created", (q: any) =>
            q.eq("conversationId", conversation._id),
          )
          .collect();
        const unreadCount = messages.filter(
          (message) =>
            message.senderUserId !== current.userId &&
            message.createdAt > lastReadAt,
        ).length;

        return {
          id: conversation._id,
          other,
          lastMessage: conversation.lastMessage || "",
          lastSenderUserId: conversation.lastSenderUserId || "",
          updatedAt: conversation.updatedAt,
          unreadCount,
        };
      }),
    );
  },
});

export const startConversation = mutation({
  args: { otherUserId: v.string() },
  handler: async (ctx, args) => {
    const current = await requireChatUser(ctx);
    if (args.otherUserId === current.userId) {
      throw new Error("ادیوسازن ایجاد گفت‌وگو با خودتان وجود ندارد.");
    }

    const otherRole = await roleForUser(ctx, args.otherUserId);
    if (!canUseAdvisorChat(otherRole)) {
      throw new Error("کاربر انتخاب‌شده عضو چت مشاوران نیست.");
    }

    const key = pairKey(current.userId, args.otherUserId);
    const existing = (
      await ctx.db
        .query("advisorConversations")
        .withIndex("by_pair", (q: any) => q.eq("pairKey", key))
        .take(1)
    )[0];
    if (existing) return existing._id;

    const [participantA, participantB] = [current.userId, args.otherUserId].sort();
    const now = Date.now();
    return await ctx.db.insert("advisorConversations", {
      pairKey: key,
      participantA,
      participantB,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getMessages = query({
  args: { conversationId: v.id("advisorConversations") },
  handler: async (ctx, args) => {
    const current = await currentRole(ctx);
    if (!current || !canUseAdvisorChat(current.role)) return [];
    await assertConversationAccess(
      ctx,
      args.conversationId,
      current.userId,
    );

    const rows = await ctx.db
      .query("advisorMessages")
      .withIndex("by_conversation_created", (q: any) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .take(300);

    return rows.map((row) => ({
      id: row._id,
      senderUserId: row.senderUserId,
      body: row.body,
      createdAt: row.createdAt,
      mine: row.senderUserId === current.userId,
    }));
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("advisorConversations"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const current = await requireChatUser(ctx);
    const conversation = await assertConversationAccess(
      ctx,
      args.conversationId,
      current.userId,
    );
    const body = args.body.trim().slice(0, 4000);
    if (!body) throw new Error("متن پیام خالی است.");

    const now = Date.now();
    const messageId = await ctx.db.insert("advisorMessages", {
      conversationId: conversation._id,
      senderUserId: current.userId,
      body,
      createdAt: now,
    });

    await ctx.db.patch(conversation._id, {
      lastMessage: body.slice(0, 180),
      lastSenderUserId: current.userId,
      updatedAt: now,
    });

    const read = (
      await ctx.db
        .query("advisorConversationReads")
        .withIndex("by_conversation_user", (q: any) =>
          q
            .eq("conversationId", conversation._id)
            .eq("userId", current.userId),
        )
        .take(1)
    )[0];
    if (read) {
      await ctx.db.patch(read._id, { lastReadAt: now });
    } else {
      await ctx.db.insert("advisorConversationReads", {
        conversationId: conversation._id,
        userId: current.userId,
        lastReadAt: now,
      });
    }

    return messageId;
  },
});

export const markRead = mutation({
  args: { conversationId: v.id("advisorConversations") },
  handler: async (ctx, args) => {
    const current = await requireChatUser(ctx);
    await assertConversationAccess(
      ctx,
      args.conversationId,
      current.userId,
    );
    const now = Date.now();
    const row = (
      await ctx.db
        .query("advisorConversationReads")
        .withIndex("by_conversation_user", (q: any) =>
          q
            .eq("conversationId", args.conversationId)
            .eq("userId", current.userId),
        )
        .take(1)
    )[0];

    if (row) {
      await ctx.db.patch(row._id, { lastReadAt: now });
    } else {
      await ctx.db.insert("advisorConversationReads", {
        conversationId: args.conversationId,
        userId: current.userId,
        lastReadAt: now,
      });
    }
    return true;
  },
});
