import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { OFFICE_ROLES } from "./schema";
import { currentRole, roleForUser } from "./permissions";

const GUEST_PREFIX = "guest:";

function canReceiveSiteChat(role: string) {
  return role === OFFICE_ROLES.MANAGER || role === OFFICE_ROLES.CONSULTANT;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

function guestPrincipal(token: string) {
  return GUEST_PREFIX + token;
}

function validateGuestToken(token: string) {
  const value = token.trim();
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(value)) {
    throw new Error("شناسه مهمان معتبر نیست.");
  }
  return value;
}

function normalizePhone(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "");
}

async function guestRow(ctx: any, token: string) {
  return (
    await ctx.db
      .query("chatGuests")
      .withIndex("by_token", (q: any) => q.eq("token", token))
      .take(1)
  )[0] ?? null;
}

async function principalForRequest(ctx: any, guestToken?: string) {
  const userId = await getAuthUserId(ctx);
  if (userId !== null) {
    const id = String(userId);
    return {
      key: id,
      userId: id,
      role: await roleForUser(ctx, id),
      isGuest: false,
    };
  }

  if (!guestToken) return null;
  const token = validateGuestToken(guestToken);
  const guest = await guestRow(ctx, token);
  if (!guest) return null;

  return {
    key: guestPrincipal(token),
    userId: "",
    role: OFFICE_ROLES.GUEST,
    isGuest: true,
    guest,
  };
}

async function personInfo(ctx: any, principal: string) {
  if (principal.startsWith(GUEST_PREFIX)) {
    const token = principal.slice(GUEST_PREFIX.length);
    const guest = await guestRow(ctx, token);
    return {
      userId: "",
      principal,
      displayName: guest?.name || "مهمان دیوساز",
      role: OFFICE_ROLES.GUEST,
      imageUrl: null,
      profileSlug: "",
      headline: guest?.phone ? `مهمان · ${guest.phone}` : "مهمان سایت",
      phone: guest?.phone || "",
      isGuest: true,
    };
  }

  const profile = (
    await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", principal))
      .take(1)
  )[0];
  const advisor = (
    await ctx.db
      .query("advisorProfiles")
      .withIndex("by_user", (q: any) => q.eq("userId", principal))
      .take(1)
  )[0];

  let authName = "";
  try {
    const authUser = await ctx.db.get(principal as any);
    authName = authUser?.name || authUser?.email || "";
  } catch {
    authName = "";
  }

  const role = await roleForUser(ctx, principal);
  const imageUrl = advisor?.profileImageStorageId
    ? await ctx.storage.getUrl(advisor.profileImageStorageId)
    : null;

  const fallback =
    role === OFFICE_ROLES.MANAGER
      ? "مدیر دیوساز"
      : role === OFFICE_ROLES.CONSULTANT
        ? "مشاور دیوساز"
        : role === OFFICE_ROLES.ADMIN
          ? "ادمین دیوساز"
          : "کاربر دیوساز";

  return {
    userId: principal,
    principal,
    displayName: profile?.displayName || authName || fallback,
    role,
    imageUrl,
    profileSlug: advisor?.publicProfile ? advisor.slug : "",
    headline:
      advisor?.headline ||
      (role === OFFICE_ROLES.MANAGER
        ? "مدیر دیوساز"
        : role === OFFICE_ROLES.CONSULTANT
          ? "مشاور دیوساز"
          : role === OFFICE_ROLES.ADMIN
            ? "ادمین دیوساز"
            : "کاربر دیوساز"),
    phone: profile?.publicPhone || "",
    isGuest: false,
  };
}

async function assertParticipant(
  ctx: any,
  conversationId: any,
  principal: string,
) {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) throw new Error("گفت‌وگو پیدا نشد.");
  if (
    conversation.participantA !== principal &&
    conversation.participantB !== principal
  ) {
    throw new Error("به این گفت‌وگو دسترسی ندارید.");
  }
  return conversation;
}

async function conversationForRead(
  ctx: any,
  conversationId: any,
  principal: Awaited<ReturnType<typeof principalForRequest>>,
) {
  if (!principal) throw new Error("برای مشاهده چت ابتدا هویت خود را مشخص کنید.");
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) throw new Error("گفت‌وگو پیدا نشد.");

  if (principal.role === OFFICE_ROLES.MANAGER) return conversation;
  if (
    conversation.participantA !== principal.key &&
    conversation.participantB !== principal.key
  ) {
    throw new Error("به این گفت‌وگو دسترسی ندارید.");
  }
  return conversation;
}

async function conversationSummary(ctx: any, conversation: any, viewer?: string) {
  const [participantA, participantB] = await Promise.all([
    personInfo(ctx, conversation.participantA),
    personInfo(ctx, conversation.participantB),
  ]);

  let unreadCount = 0;
  if (viewer) {
    const readRow = (
      await ctx.db
        .query("advisorConversationReads")
        .withIndex("by_conversation_user", (q: any) =>
          q.eq("conversationId", conversation._id).eq("userId", viewer),
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
    unreadCount = messages.filter(
      (message: any) =>
        message.senderUserId !== viewer && message.createdAt > lastReadAt,
    ).length;
  }

  const other =
    viewer === conversation.participantA
      ? participantB
      : viewer === conversation.participantB
        ? participantA
        : null;

  return {
    id: conversation._id,
    participantA,
    participantB,
    other,
    lastMessage: conversation.lastMessage || "",
    lastSenderUserId: conversation.lastSenderUserId || "",
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
    unreadCount,
  };
}

export const registerGuest = mutation({
  args: {
    guestToken: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = validateGuestToken(args.guestToken);
    const name = args.name.trim().slice(0, 80);
    if (name.length < 2) throw new Error("نام خود را وارد کنید.");

    const phone = normalizePhone(args.phone || "");
    if (phone && !/^09\d{9}$/.test(phone)) {
      throw new Error("شماره موبایل باید ۱۱ رقم و با 09 شروع شود.");
    }

    const existing = await guestRow(ctx, token);
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name,
        phone: phone || undefined,
        updatedAt: now,
      });
      return { name, phone };
    }

    await ctx.db.insert("chatGuests", {
      token,
      name,
      phone: phone || undefined,
      createdAt: now,
      updatedAt: now,
    });
    return { name, phone };
  },
});

export const getGuestProfile = query({
  args: { guestToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.guestToken) return null;
    try {
      const token = validateGuestToken(args.guestToken);
      const guest = await guestRow(ctx, token);
      return guest ? { name: guest.name, phone: guest.phone || "" } : null;
    } catch {
      return null;
    }
  },
});

export const listContacts = query({
  args: {},
  handler: async (ctx) => {
    const current = await currentRole(ctx);
    const currentId = current?.userId || "";
    const profiles = await ctx.db.query("userProfiles").collect();
    const rows = [];

    for (const profile of profiles) {
      if (profile.userId === currentId) continue;
      const role = await roleForUser(ctx, profile.userId);
      if (!canReceiveSiteChat(role)) continue;
      rows.push(await personInfo(ctx, profile.userId));
    }

    return rows.sort((a, b) => {
      if (a.role === OFFICE_ROLES.MANAGER && b.role !== OFFICE_ROLES.MANAGER) return -1;
      if (b.role === OFFICE_ROLES.MANAGER && a.role !== OFFICE_ROLES.MANAGER) return 1;
      return a.displayName.localeCompare(b.displayName, "fa");
    });
  },
});

export const listConversations = query({
  args: { guestToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const principal = await principalForRequest(ctx, args.guestToken);
    if (!principal) return [];

    const [asA, asB] = await Promise.all([
      ctx.db
        .query("advisorConversations")
        .withIndex("by_a_updated", (q: any) =>
          q.eq("participantA", principal.key),
        )
        .order("desc")
        .take(100),
      ctx.db
        .query("advisorConversations")
        .withIndex("by_b_updated", (q: any) =>
          q.eq("participantB", principal.key),
        )
        .order("desc")
        .take(100),
    ]);

    const unique = new Map<string, any>();
    for (const row of [...asA, ...asB]) unique.set(String(row._id), row);
    const conversations = [...unique.values()].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );

    return await Promise.all(
      conversations.map((conversation) =>
        conversationSummary(ctx, conversation, principal.key),
      ),
    );
  },
});

export const listAllConversations = query({
  args: {},
  handler: async (ctx) => {
    const current = await currentRole(ctx);
    if (!current || current.role !== OFFICE_ROLES.MANAGER) return null;

    const rows = await ctx.db.query("advisorConversations").collect();
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    return await Promise.all(
      rows.slice(0, 500).map((conversation) =>
        conversationSummary(ctx, conversation),
      ),
    );
  },
});

export const startConversation = mutation({
  args: {
    otherUserId: v.string(),
    guestToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const principal = await principalForRequest(ctx, args.guestToken);
    if (!principal) {
      throw new Error("برای شروع گفتگو ابتدا نام خود را ثبت کنید.");
    }
    if (args.otherUserId === principal.key) {
      throw new Error("امکان ایجاد گفت‌وگو با خودتان وجود ندارد.");
    }

    const otherRole = await roleForUser(ctx, args.otherUserId);
    if (!canReceiveSiteChat(otherRole)) {
      throw new Error("فرد انتخاب‌شده برای چت عمومی در دسترس نیست.");
    }

    const key = pairKey(principal.key, args.otherUserId);
    const existing = (
      await ctx.db
        .query("advisorConversations")
        .withIndex("by_pair", (q: any) => q.eq("pairKey", key))
        .take(1)
    )[0];
    if (existing) return existing._id;

    const [participantA, participantB] = [
      principal.key,
      args.otherUserId,
    ].sort();
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
  args: {
    conversationId: v.id("advisorConversations"),
    guestToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const principal = await principalForRequest(ctx, args.guestToken);
    const conversation = await conversationForRead(
      ctx,
      args.conversationId,
      principal,
    );

    const rows = await ctx.db
      .query("advisorMessages")
      .withIndex("by_conversation_created", (q: any) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .take(500);

    const [participantA, participantB] = await Promise.all([
      personInfo(ctx, conversation.participantA),
      personInfo(ctx, conversation.participantB),
    ]);
    const people: Record<string, any> = {
      [conversation.participantA]: participantA,
      [conversation.participantB]: participantB,
    };

    return rows.map((row) => ({
      id: row._id,
      senderUserId: row.senderUserId,
      senderName: people[row.senderUserId]?.displayName || "کاربر دیوساز",
      senderRole: people[row.senderUserId]?.role || "",
      body: row.body,
      createdAt: row.createdAt,
      mine: principal ? row.senderUserId === principal.key : false,
    }));
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("advisorConversations"),
    body: v.string(),
    guestToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const principal = await principalForRequest(ctx, args.guestToken);
    if (!principal) throw new Error("برای ارسال پیام ابتدا هویت خود را مشخص کنید.");

    const conversation = await assertParticipant(
      ctx,
      args.conversationId,
      principal.key,
    );
    const body = args.body.trim().slice(0, 4000);
    if (!body) throw new Error("متن پیام خالی است.");

    const now = Date.now();

    if (principal.isGuest) {
      const recent = await ctx.db
        .query("advisorMessages")
        .withIndex("by_conversation_created", (q: any) =>
          q.eq("conversationId", conversation._id),
        )
        .order("desc")
        .take(20);
      const rapidCount = recent.filter(
        (item: any) =>
          item.senderUserId === principal.key && item.createdAt > now - 60_000,
      ).length;
      if (rapidCount >= 8) {
        throw new Error("تعداد پیام‌ها زیاد است؛ یک دقیقه بعد دوباره تلاش کنید.");
      }
    }

    const messageId = await ctx.db.insert("advisorMessages", {
      conversationId: conversation._id,
      senderUserId: principal.key,
      body,
      createdAt: now,
    });

    await ctx.db.patch(conversation._id, {
      lastMessage: body.slice(0, 180),
      lastSenderUserId: principal.key,
      updatedAt: now,
    });

    const read = (
      await ctx.db
        .query("advisorConversationReads")
        .withIndex("by_conversation_user", (q: any) =>
          q
            .eq("conversationId", conversation._id)
            .eq("userId", principal.key),
        )
        .take(1)
    )[0];
    if (read) {
      await ctx.db.patch(read._id, { lastReadAt: now });
    } else {
      await ctx.db.insert("advisorConversationReads", {
        conversationId: conversation._id,
        userId: principal.key,
        lastReadAt: now,
      });
    }

    if (principal.role !== OFFICE_ROLES.MANAGER) {
      const otherPrincipal =
        conversation.participantA === principal.key
          ? conversation.participantB
          : conversation.participantA;
      const [sender, recipient] = await Promise.all([
        personInfo(ctx, principal.key),
        personInfo(ctx, otherPrincipal),
      ]);

      await ctx.scheduler.runAfter(0, internal.integrations.notifyChatMessage, {
        senderName: sender.displayName,
        senderRole: sender.role,
        senderPhone: sender.phone || undefined,
        recipientName: recipient.displayName,
        body: body.slice(0, 700),
      });
    }

    return messageId;
  },
});

export const markRead = mutation({
  args: {
    conversationId: v.id("advisorConversations"),
    guestToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const principal = await principalForRequest(ctx, args.guestToken);
    if (!principal) return false;

    await assertParticipant(ctx, args.conversationId, principal.key);
    const now = Date.now();
    const row = (
      await ctx.db
        .query("advisorConversationReads")
        .withIndex("by_conversation_user", (q: any) =>
          q
            .eq("conversationId", args.conversationId)
            .eq("userId", principal.key),
        )
        .take(1)
    )[0];

    if (row) {
      await ctx.db.patch(row._id, { lastReadAt: now });
    } else {
      await ctx.db.insert("advisorConversationReads", {
        conversationId: args.conversationId,
        userId: principal.key,
        lastReadAt: now,
      });
    }
    return true;
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("advisorConversations") },
  handler: async (ctx, args) => {
    const current = await currentRole(ctx);
    if (!current || current.role !== OFFICE_ROLES.MANAGER) {
      throw new Error("فقط مدیر اصلی می‌تواند تاریخچه گفتگو را حذف کند.");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return true;

    const [messages, reads] = await Promise.all([
      ctx.db
        .query("advisorMessages")
        .withIndex("by_conversation_created", (q: any) =>
          q.eq("conversationId", args.conversationId),
        )
        .collect(),
      ctx.db
        .query("advisorConversationReads")
        .withIndex("by_conversation_user", (q: any) =>
          q.eq("conversationId", args.conversationId),
        )
        .collect(),
    ]);

    for (const message of messages) await ctx.db.delete(message._id);
    for (const read of reads) await ctx.db.delete(read._id);
    await ctx.db.delete(args.conversationId);
    return true;
  },
});
