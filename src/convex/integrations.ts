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
        aiConfigured: false,
        aiModel: "openrouter/free",
        notifyLeads: true,
        notifyPublicationRequests: true,
        notifyListingActivity: true,
        notifyChatMessages: true,
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
      aiConfigured: Boolean(
        config?.openRouterApiKey?.trim() || process.env.OPENROUTER_API_KEY?.trim(),
      ),
      aiModel:
        config?.openRouterModel?.trim() ||
        process.env.OPENROUTER_MODEL?.trim() ||
        "openrouter/free",
      notifyLeads: config?.notifyLeads ?? true,
      notifyPublicationRequests: config?.notifyPublicationRequests ?? true,
      notifyListingActivity: config?.notifyListingActivity ?? true,
      notifyChatMessages: config?.notifyChatMessages ?? true,
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
    openRouterApiKey: v.optional(v.string()),
    openRouterModel: v.string(),
    clearOpenRouterApiKey: v.boolean(),
    notifyLeads: v.boolean(),
    notifyPublicationRequests: v.boolean(),
    notifyListingActivity: v.optional(v.boolean()),
    notifyChatMessages: v.optional(v.boolean()),
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
    const openRouterApiKey = args.clearOpenRouterApiKey
      ? undefined
      : args.openRouterApiKey?.trim() || existing?.openRouterApiKey;

    const payload = {
      key: "global",
      telegramBotToken: telegramToken,
      telegramChatId: args.telegramChatId.trim() || undefined,
      baleBotToken: baleToken,
      baleChatId: args.baleChatId.trim() || undefined,
      openRouterApiKey,
      openRouterModel: args.openRouterModel.trim() || "openrouter/free",
      notifyLeads: args.notifyLeads,
      notifyPublicationRequests: args.notifyPublicationRequests,
      notifyListingActivity:
        args.notifyListingActivity ?? existing?.notifyListingActivity ?? true,
      notifyChatMessages: args.notifyChatMessages ?? existing?.notifyChatMessages ?? true,
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
      openRouterApiKey: config.openRouterApiKey ?? "",
      openRouterModel: config.openRouterModel ?? "openrouter/free",
      notifyLeads: config.notifyLeads ?? true,
      notifyPublicationRequests: config.notifyPublicationRequests ?? true,
      notifyListingActivity: config.notifyListingActivity ?? true,
      notifyChatMessages: config.notifyChatMessages ?? true,
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

export const testAiConnection = action({
  args: {},
  handler: async (ctx) => {
    const role = await ctx.runQuery(internal.integrations.actionRole, {});
    if (role !== OFFICE_ROLES.MANAGER) {
      throw new Error("فقط مدیر اصلی اجازه تست اتصال هوش مصنوعی را دارد.");
    }

    const config = await ctx.runQuery(
      internal.integrations.getSecretsInternal,
      {},
    );
    const apiKey = (
      config?.openRouterApiKey ||
      process.env.OPENROUTER_API_KEY ||
      ""
    ).trim();
    const model = (
      config?.openRouterModel ||
      process.env.OPENROUTER_MODEL ||
      "openrouter/free"
    ).trim();

    if (!apiKey) {
      return {
        ok: false,
        model,
        message:
          "کلید رایگان OpenRouter ثبت نشده است. یک API Key رایگان بسازید و در همین بخش ذخیره کنید.",
      };
    }

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer":
              process.env.MEKA_SITE_URL ||
              process.env.SITE_URL ||
              "https://divsaz.ir",
            "X-Title": "Divosaz AI Assistant",
          },
          body: JSON.stringify({
            model: model || "openrouter/free",
            messages: [
              {
                role: "user",
                content:
                  "فقط در یک جمله کوتاه فارسی بنویس: اتصال هوش مصنوعی دیوساز برقرار است.",
              },
            ],
            temperature: 0.1,
            max_tokens: 80,
          }),
        },
      );

      const raw = await response.text();
      let payload: any = null;
      try {
        payload = raw ? JSON.parse(raw) : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        return {
          ok: false,
          model,
          message:
            payload?.error?.message ||
            `اتصال OpenRouter ناموفق بود (HTTP ${response.status}).`,
        };
      }

      const answer =
        payload?.choices?.[0]?.message?.content?.trim() ||
        "اتصال برقرار شد.";

      return {
        ok: true,
        model: payload?.model || model,
        message: answer.slice(0, 300),
      };
    } catch (error) {
      return {
        ok: false,
        model,
        message:
          error instanceof Error
            ? error.message
            : "ارتباط با سرویس هوش مصنوعی برقرار نشد.",
      };
    }
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
    registeredBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(internal.integrations.getSecretsInternal, {});
    if (!config?.notifyLeads) return { skipped: true };

    const lines = [
      "#متقاضی_ثبت_شده",
      "🔔 متقاضی جدید در دیوساز ثبت شد",
      "",
      `نوع درخواست: ${INTENT_LABELS[args.intent] || args.intent}`,
      `نام: ${args.name}`,
      `تلفن: ${args.phone}`,
      `شهر: ${args.city}`,
      `نوع ملک: ${args.propertyType}`,
      args.area != null ? `متراژ حدودی: ${args.area} متر` : "",
      args.budget ? `بودجه/شرایط: ${args.budget}` : "",
      args.details ? `توضیحات: ${args.details}` : "",
      args.registeredBy ? `ثبت‌کننده: ${args.registeredBy}` : "",
      "",
      "📌 این درخواست در پنل مدیریت دیوساز ذخیره شده است.",
    ].filter(Boolean);

    return await sendConfigured(ctx, lines.join("\n"));
  },
});

export const notifyListingActivity = internalAction({
  args: {
    event: v.union(
      v.literal("created"),
      v.literal("claimed"),
      v.literal("public_created"),
    ),
    actorName: v.string(),
    actorRole: v.optional(v.string()),
    key: v.string(),
    radarCode: v.optional(v.string()),
    title: v.string(),
    city: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    dealType: v.optional(v.string()),
    area: v.optional(v.number()),
    phone: v.optional(v.string()),
    priceMillion: v.optional(v.number()),
    depositMillion: v.optional(v.number()),
    rentMillion: v.optional(v.number()),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    divarUrl: v.optional(v.string()),
    mapsUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(
      internal.integrations.getSecretsInternal,
      {},
    );
    if (!config?.notifyListingActivity) return { skipped: true };

    const hashtag =
      args.event === "claimed"
        ? "#آگهی_برداشته_شده"
        : "#آگهی_ثبت_شده";
    const heading =
      args.event === "claimed"
        ? "📥 آگهی از بانک ایمپورت برداشته شد"
        : args.event === "public_created"
          ? "📝 آگهی جدید از سایت ثبت شد"
          : "📝 آگهی جدید توسط عضو تیم ثبت شد";

    const roleLabels: Record<string, string> = {
      manager: "مدیر",
      admin: "ادمین",
      consultant: "مشاور",
      user: "کاربر",
      guest: "مهمان",
    };

    const lines = [
      hashtag,
      heading,
      "",
      `ثبت‌کننده: ${args.actorName}${
        args.actorRole
          ? ` (${roleLabels[args.actorRole] || args.actorRole})`
          : ""
      }`,
      `عنوان: ${args.title}`,
      args.radarCode ? `کد رادار: ${args.radarCode}` : "",
      args.dealType || args.propertyType
        ? `نوع: ${[args.dealType, args.propertyType].filter(Boolean).join(" / ")}`
        : "",
      args.city
        ? `محدوده: ${[args.city, args.neighborhood].filter(Boolean).join(" - ")}`
        : "",
      args.area != null ? `متراژ: ${args.area} متر` : "",
      args.phone ? `تلفن فایل: ${args.phone}` : "",
      args.depositMillion != null
        ? `ودیعه: ${args.depositMillion} میلیون تومان`
        : "",
      args.rentMillion != null
        ? `اجاره: ${args.rentMillion} میلیون تومان`
        : "",
      args.rentMillion == null &&
      args.priceMillion != null &&
      args.priceMillion > 0
        ? `قیمت: ${args.priceMillion} میلیون تومان`
        : "",
      args.address ? `آدرس: ${args.address}` : "",
      args.description
        ? `\nتوضیحات:\n${args.description.slice(0, 1200)}`
        : "",
      args.divarUrl ? `\nلینک منبع: ${args.divarUrl}` : "",
      args.mapsUrl ? `لوکیشن: ${args.mapsUrl}` : "",
      `کد داخلی: ${args.key}`,
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
      "✅ برای انتشار عمومی، مدیر باید این آگهی را در داشبورد دیوساز تأیید کند.",
    ].filter(Boolean);

    return await sendConfigured(ctx, text.join("\n"));
  },
});

export const notifyChatMessage = internalAction({
  args: {
    senderName: v.string(),
    senderRole: v.string(),
    senderPhone: v.optional(v.string()),
    recipientName: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.runQuery(internal.integrations.getSecretsInternal, {});
    if (!config?.notifyChatMessages) return { skipped: true };

    const roleLabels: Record<string, string> = {
      manager: "مدیر",
      admin: "ادمین",
      consultant: "مشاور",
      user: "کاربر",
      guest: "مهمان",
    };

    const text = [
      "💬 پیام جدید در چت دیوساز",
      "",
      `فرستنده: ${args.senderName} (${roleLabels[args.senderRole] || args.senderRole})`,
      args.senderPhone ? `موبایل: ${args.senderPhone}` : "",
      `مخاطب: ${args.recipientName}`,
      "",
      `پیام: ${args.body}`,
      "",
      "🔔 برای پاسخ، وارد پنل یا چت سایت دیوساز شوید.",
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
      "✅ اتصال پیام‌رسان دیوساز با موفقیت برقرار است.",
      args.channel,
    );
  },
});

export const testAi = action({
  args: {},
  handler: async (ctx) => {
    const role = await ctx.runQuery(internal.integrations.actionRole, {});
    if (role !== OFFICE_ROLES.MANAGER) {
      throw new Error("فقط مدیر می‌تواند اتصال هوش مصنوعی را آزمایش کند.");
    }

    const config = await ctx.runQuery(
      internal.integrations.getSecretsInternal,
      {},
    );
    const apiKey = (
      config?.openRouterApiKey ||
      process.env.OPENROUTER_API_KEY ||
      ""
    ).trim();
    const model = (
      config?.openRouterModel ||
      process.env.OPENROUTER_MODEL ||
      "openrouter/free"
    ).trim();

    if (!apiKey) {
      return {
        ok: false,
        model,
        error:
          "کلید رایگان OpenRouter ثبت نشده است. یک API Key رایگان بسازید و در همین بخش ذخیره کنید.",
      };
    }

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.SITE_URL ?? "https://divsaz.ir",
            "X-Title": "Divosaz AI Connection Test",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content:
                  "فقط با یک جمله کوتاه فارسی پاسخ بده: اتصال هوش مصنوعی دیوساز برقرار است.",
              },
            ],
            temperature: 0,
            max_tokens: 80,
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

      if (!response.ok) {
        return {
          ok: false,
          model,
          error:
            body?.error?.message ||
            `OpenRouter پاسخ ناموفق داد (HTTP ${response.status}).`,
        };
      }

      const answer = String(
        body?.choices?.[0]?.message?.content || "",
      ).trim();

      return {
        ok: true,
        model,
        answer: answer || "اتصال هوش مصنوعی برقرار است.",
      };
    } catch (error) {
      return {
        ok: false,
        model,
        error:
          error instanceof Error
            ? error.message
            : "ارتباط با OpenRouter برقرار نشد.",
      };
    }
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
