import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { OFFICE_ROLES } from "./schema";
import { roleForUser } from "./permissions";

type ReadCtx = Pick<QueryCtx, "db" | "auth">;

async function currentRole(ctx: ReadCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await roleForUser(ctx, String(userId));
}

async function getSecrets(ctx: { db: QueryCtx["db"] }) {
  const rows = await ctx.db
    .query("integrationSecrets")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .take(2);
  return rows[0] ?? null;
}

export const getIntegrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const role = await currentRole(ctx);
    if (role !== OFFICE_ROLES.MANAGER) {
      return {
        allowed: false,
        telegramConfigured: false,
        telegramChatId: "",
        baleConfigured: false,
        baleChatId: "",
        notifyLeads: true,
        notifyPublicationRequests: true,
      };
    }

    const config = await getSecrets(ctx);
    return {
      allowed: true,
      telegramConfigured: Boolean(
        config?.telegramBotToken?.trim() && config?.telegramChatId?.trim(),
      ),
      telegramChatId: config?.telegramChatId ?? "",
      baleConfigured: Boolean(
        config?.baleBotToken?.trim() && config?.baleChatId?.trim(),
      ),
      baleChatId: config?.baleChatId ?? "",
      notifyLeads: config?.notifyLeads ?? true,
      notifyPublicationRequests: config?.notifyPublicationRequests ?? true,
    };
  },
});

export const saveIntegrationSettings = mutation({
  args: {
    telegramBotToken: v.optional(v.string()),
    telegramChatId: v.string(),
    clearTelegramToken: v.boolean(),
    baleBotToken: v.optional(v.string()),
    baleChatId: v.string(),
    clearBaleToken: v.boolean(),
    notifyLeads: v.boolean(),
    notifyPublicationRequests: v.boolean(),
  },
  handler: async (ctx, args) => {
    const role = await currentRole(ctx);
    if (role !== OFFICE_ROLES.MANAGER) {
      throw new Error("فقط مدیر اصلی اجازهٔ تغییر تنظیمات پیام‌رسان را دارد.");
    }

    const existing = await getSecrets(ctx);
    const telegramToken = args.clearTelegramToken
      ? undefined
      : args.telegramBotToken?.trim() || existing?.telegramBotToken;
    const baleToken = args.clearBaleToken
      ? undefined
      : args.baleBotToken?.trim() || existing?.baleBotToken;

    const payload = {
      key: "global",
      telegramBotToken: telegramToken,
      telegramChatId: args.telegramChatId.trim() || undefined,
      baleBotToken: baleToken,
      baleChatId: args.baleChatId.trim() || undefined,
      notifyLeads: args.notifyLeads,
      notifyPublicationRequests: args.notifyPublicationRequests,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("integrationSecrets", payload);
  },
});

export const saveDiscoveredChatId = internalMutation({
  args: {
    channel: v.union(v.literal("telegram"), v.literal("bale")),
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const config = await getSecrets(ctx);
    if (!config) throw new Error("ابتدا توکن ربات را ذخیره کنید.");
    await ctx.db.patch(config._id, {
      ...(args.channel === "telegram"
        ? { telegramChatId: args.chatId }
        : { baleChatId: args.chatId }),
      updatedAt: Date.now(),
    });
    return args.chatId;
  },
});

export const getSecretsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const config = await getSecrets(ctx);
    if (!config) return null;
    return {
      telegramBotToken: config.telegramBotToken ?? "",
      telegramChatId: config.telegramChatId ?? "",
      baleBotToken: config.baleBotToken ?? "",
      baleChatId: config.baleChatId ?? "",
      notifyLeads: config.notifyLeads ?? true,
      notifyPublicationRequests: config.notifyPublicationRequests ?? true,
    };
  },
});

export const actionRole = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const rows = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(2);
    return rows[0]?.officeRole ?? null;
  },
});

async function postMessage(
  baseUrl: string,
  token: string,
  chatId: string,
  text: string,
) {
  if (!token.trim() || !chatId.trim()) return { skipped: true as const };

  const response = await fetch(
    `${baseUrl}/bot${token.trim()}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: text.slice(0, 3900),
      }),
    },
  );

  const raw = await response.text();
  let body: any = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!response.ok || body?.ok === false) {
    throw new Error(
      body?.description ||
        `ارسال پیام ناموفق بود (HTTP ${response.status}).`,
    );
  }
  return { skipped: false as const };
}

async function sendConfigured(
  ctx: any,
  text: string,
  channel: "all" | "telegram" | "bale" = "all",
) {
  const config = await ctx.runQuery(internal.integrations.getSecretsInternal, {});
  if (!config) {
    return { telegram: "skipped", bale: "skipped" };
  }

  const result: Record<string, string> = {
    telegram: "skipped",
    bale: "skipped",
  };

  if (
    (channel === "all" || channel === "telegram") &&
    config.telegramBotToken &&
    config.telegramChatId
  ) {
    try {
      await postMessage(
        "https://api.telegram.org",
        config.telegramBotToken,
        config.telegramChatId,
        text,
      );
      result.telegram = "sent";
    } catch (error) {
      result.telegram =
        error instanceof Error ? `error: ${error.message}` : "error";
    }
  }

  if (
    (channel === "all" || channel === "bale") &&
    config.baleBotToken &&
    config.baleChatId
  ) {
    try {
      await postMessage(
        "https://tapi.bale.ai",
        config.baleBotToken,
        config.baleChatId,
        text,
      );
      result.bale = "sent";
    } catch (error) {
      result.bale =
        error instanceof Error ? `error: ${error.message}` : "error";
    }
  }

  return result;
}

const INTENT_LABELS: Record<string, string> = {
  buy: "می‌خرم",
  rent: "اجاره می‌کنم",
  sell: "می‌فروشم",
  lease_out: "اجاره می‌دهم",
};

export const notifyLead = internalAction({
  args: {
    intent: v.string(),
    name: v.string(),
    phone: v.string(),
    city: v.string(),
    propertyType: v.string(),
    area: v.optional(v.number()),
    budget: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(internal.integrations.getSecretsInternal, {});
    if (!config?.notifyLeads) return { skipped: true };

    const lines = [
      "🔔 درخواست جدید از سایت مکا",
      "",
      `نوع درخواست: ${INTENT_LABELS[args.intent] || args.intent}`,
      `نام: ${args.name}`,
      `تلفن: ${args.phone}`,
      `شهر: ${args.city}`,
      `نوع ملک: ${args.propertyType}`,
      args.area != null ? `متراژ حدودی: ${args.area} متر` : "",
      args.budget ? `بودجه/شرایط: ${args.budget}` : "",
      args.details ? `توضیحات: ${args.details}` : "",
      "",
      "📌 این درخواست در پنل مدیریت مکا ذخیره شده است.",
    ].filter(Boolean);

    return await sendConfigured(ctx, lines.join("\n"));
  },
});

export const notifyPublicationRequest = internalAction({
  args: {
    key: v.string(),
    title: v.string(),
    city: v.string(),
    propertyType: v.string(),
    dealType: v.string(),
    area: v.optional(v.number()),
    depositMillion: v.optional(v.number()),
    rentMillion: v.optional(v.number()),
    priceMillion: v.optional(v.number()),
    description: v.optional(v.string()),
    publicDetails: v.optional(v.array(v.string())),
    consultant: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(internal.integrations.getSecretsInternal, {});
    if (!config?.notifyPublicationRequests) return { skipped: true };

    const text = [
      "🟠 درخواست تأیید انتشار آگهی",
      "",
      `عنوان: ${args.title}`,
      `نوع: ${args.dealType} / ${args.propertyType}`,
      `شهر: ${args.city}`,
      args.area != null ? `متراژ: ${args.area} متر` : "",
      args.depositMillion != null ? `ودیعه: ${args.depositMillion} میلیون تومان` : "",
      args.rentMillion != null ? `اجاره: ${args.rentMillion} میلیون تومان` : "",
      args.rentMillion == null && args.priceMillion != null && args.priceMillion > 0
        ? `قیمت: ${args.priceMillion} میلیون تومان`
        : "",
      ...(args.publicDetails ?? []),
      args.description ? `\nتوضیحات:\n${args.description}` : "",
      args.consultant ? `ثبت‌کننده: ${args.consultant}` : "",
      `کد داخلی: ${args.key}`,
      "",
      "✅ برای انتشار عمومی، مدیر باید این آگهی را در داشبورد مکا تأیید کند.",
    ].filter(Boolean);

    return await sendConfigured(ctx, text.join("\n"));
  },
});

export const testIntegrations = action({
  args: { channel: v.union(v.literal("telegram"), v.literal("bale"), v.literal("all")) },
  handler: async (ctx, args) => {
    const role = await ctx.runQuery(internal.integrations.actionRole, {});
    if (role !== OFFICE_ROLES.MANAGER) {
      throw new Error("فقط مدیر می‌تواند اتصال پیام‌رسان را آزمایش کند.");
    }
    return await sendConfigured(
      ctx,
      "✅ اتصال پیام‌رسان مکا با موفقیت برقرار است.",
      args.channel,
    );
  },
});


export const discoverChatId = action({
  args: {
    channel: v.union(v.literal("telegram"), v.literal("bale")),
  },
  handler: async (ctx, args) => {
    const role = await ctx.runQuery(internal.integrations.actionRole, {});
    if (role !== OFFICE_ROLES.MANAGER) {
      throw new Error("فقط مدیر اصلی می‌تواند Chat ID را دریافت کند.");
    }

    const config = await ctx.runQuery(internal.integrations.getSecretsInternal, {});
    const token =
      args.channel === "telegram"
        ? config?.telegramBotToken
        : config?.baleBotToken;
    if (!token) throw new Error("ابتدا توکن ربات را ذخیره کنید.");

    const base =
      args.channel === "telegram"
        ? "https://api.telegram.org"
        : "https://tapi.bale.ai";
    const response = await fetch(`${base}/bot${token}/getUpdates`);
    const body = await response.json();
    if (!response.ok || body?.ok === false) {
      throw new Error(body?.description || "دریافت پیام‌های ربات ناموفق بود.");
    }

    const updates = Array.isArray(body?.result) ? body.result : [];
    let chatId = "";
    for (let i = updates.length - 1; i >= 0; i--) {
      const update = updates[i];
      const value =
        update?.message?.chat?.id ??
        update?.edited_message?.chat?.id ??
        update?.callback_query?.message?.chat?.id;
      if (value !== undefined && value !== null) {
        chatId = String(value);
        break;
      }
    }

    if (!chatId) {
      throw new Error("پیامی پیدا نشد. ابتدا در ربات /start بفرستید و دوباره امتحان کنید.");
    }

    await ctx.runMutation(internal.integrations.saveDiscoveredChatId, {
      channel: args.channel,
      chatId,
    });
    return { chatId };
  },
});
