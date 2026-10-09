import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

/** نقش‌های دفتر املاک: فقط مدیر و مشاور به شمارهٔ آگهی دسترسی دارند. */
export const OFFICE_ROLES = {
  /** مدیر اصلی: دسترسی کامل به سایت، تنظیمات و کاربران */
  MANAGER: "manager",
  /** ادمین آگهی: مدیریت کامل آگهی‌ها و بخش‌های مرتبط */
  ADMIN: "admin",
  /** مشاور: فقط فایل‌های متعلق به خودش */
  CONSULTANT: "consultant",
  /** حساب عادی قدیمی؛ دسترسی داخلی ندارد */
  USER: "user",
  /** مهمان/بدون حساب */
  GUEST: "guest",
} as const;

export type OfficeRole =
  (typeof OFFICE_ROLES)[keyof typeof OFFICE_ROLES];

export const officeRoleValidator = v.union(
  v.literal(OFFICE_ROLES.MANAGER),
  v.literal(OFFICE_ROLES.ADMIN),
  v.literal(OFFICE_ROLES.CONSULTANT),
  v.literal(OFFICE_ROLES.USER),
  v.literal(OFFICE_ROLES.GUEST),
);

/** نقش‌هایی که شمارهٔ تلفن آگهی را می‌بینند. */
export const PRIVILEGED_ROLES: OfficeRole[] = [
  OFFICE_ROLES.MANAGER,
  OFFICE_ROLES.ADMIN,
  OFFICE_ROLES.CONSULTANT,
];

export const LISTING_ADMIN_ROLES: OfficeRole[] = [
  OFFICE_ROLES.MANAGER,
  OFFICE_ROLES.ADMIN,
];

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    /**
     * نقش کاربر در دفتر املاک. جدول جدا از users است تا بتوان نقش را
     * بدون دست‌زدن به جدول auth تغییر داد. اولین کاربرِ ثبت‌نام‌شده مدیر می‌شود.
     */
    userProfiles: defineTable({
      userId: v.string(),
      officeRole: v.optional(officeRoleValidator),
      displayName: v.optional(v.string()),
      /** شماره‌ای که خود مشاور اجازه داده در آگهی‌های عمومی نمایش داده شود */
      publicPhone: v.optional(v.string()),
      createdAt: v.optional(v.number()),
    })
      .index("by_user", ["userId"])
      .index("by_role", ["officeRole"]),

    /**
     * بازیابی امن کاربران بدون ذخیره رمز عبور.
     * اگر حساب هنوز در Auth ساخته نشده باشد، نقش/پروفایل با ایمیل نگه داشته
     * می‌شود و در اولین ورود یا ثبت‌نام همان ایمیل اعمال می‌شود.
     */
    pendingUserRestores: defineTable({
      email: v.string(),
      officeRole: v.optional(officeRoleValidator),
      displayName: v.optional(v.string()),
      publicPhone: v.optional(v.string()),
      advisorProfile: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_email", ["email"]),

    /**
     * آگهی‌ها روی سرور ذخیره می‌شوند تا هر روز بتوان آگهی تازه اضافه کرد و
     * دسترسی شمارهٔ تلفن واقعاً کنترل شود: فیلد phone فقط برای مدیر/مشاور
     * در پاسخ query برگردانده می‌شود و بقیه شمارهٔ مدیر را می‌بینند.
     */
    listings: defineTable({
      /** کلید پایدار برای ادغام آگهی‌های تکراری و یادداشت‌گذاری */
      key: v.string(),
      radarCode: v.optional(v.string()),
      city: v.optional(v.string()),
      neighborhood: v.optional(v.string()),
      area: v.optional(v.number()),
      rooms: v.optional(v.number()),
      priceMillion: v.optional(v.number()),
      depositMillion: v.optional(v.number()),
      rentMillion: v.optional(v.number()),
      pricePerMeter: v.optional(v.number()),
      dealType: v.optional(v.string()),
      propertyType: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      address: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      mapsUrl: v.optional(v.string()),
      divarUrl: v.optional(v.string()),
      date: v.optional(v.string()),
      dateRaw: v.optional(v.string()),
      poster: v.optional(v.string()),
      /** متن نرمال‌شده برای جستجوی سریع سمت سرور */
      searchText: v.optional(v.string()),
      /** حساس: فقط برای نقش‌های مجاز برگردانده می‌شود */
      phone: v.optional(v.string()),
      /** یادداشت‌های دفتر (مثل یادداشت روی پرونده) */
      notes: v.optional(v.string()),
      /** شناسهٔ زونکن‌هایی که آگهی در آن‌ها بایگانی شده است */
      folderIds: v.optional(v.array(v.string())),
      /** عکس‌های قدیمی؛ برای سازگاری نگه داشته شده است */
      images: v.optional(v.array(v.string())),
      /** گالری حرفه‌ای آگهی: ترتیب، عکس شاخص و Alt Text برای SEO */
      listingImages: v.optional(
        v.array(
          v.object({
            storageId: v.id("_storage"),
            alt: v.string(),
            order: v.number(),
            featured: v.boolean(),
          }),
        ),
      ),
      /** فیلدهای اختصاصی فرم بر اساس دسته ملک */
      customFields: v.optional(
        v.array(
          v.object({
            fieldId: v.string(),
            label: v.string(),
            value: v.string(),
            type: v.string(),
            unit: v.optional(v.string()),
            public: v.boolean(),
          }),
        ),
      ),
      /** نوع رکورد: بانک ایمپورت یا فایل ثبت‌شده اعضای تیم */
      listingKind: v.optional(
        v.union(v.literal("imported"), v.literal("member")),
      ),
      /** شناسه دسته ورود فایل برای گزارش و بازیابی */
      importBatchId: v.optional(v.string()),
      /** اگر فایل از بانک ایمپورت به نام یک مشاور منتقل شده باشد */
      claimedFromImport: v.optional(v.boolean()),
      claimedAt: v.optional(v.number()),
      /** کاربری که اولین بار این آگهی را در سیستم ثبت/تحویل گرفته است */
      createdByUserId: v.optional(v.string()),
      /** ثبت مستقیم عمومی بدون حساب */
      submissionSource: v.optional(v.string()),
      submittedByPhone: v.optional(v.string()),
      /** توکن کوتاه‌عمر برای تکمیل آپلود تصاویر ثبت عمومی */
      publicSubmissionToken: v.optional(v.string()),
      publicSubmissionExpiresAt: v.optional(v.number()),
      publicUploadCount: v.optional(v.number()),
      /** کنترل انتشار عمومی */
      isPublic: v.optional(v.boolean()),
      /** نمایش در سکشن آگهی‌های صفحه اصلی */
      showOnLanding: v.optional(v.boolean()),
      /** برچسب ویژه برای آگهی */
      featuredOnHome: v.optional(v.boolean()),
      publicSlug: v.optional(v.string()),
      publishedAt: v.optional(v.number()),
      publicationStatus: v.optional(
        v.union(
          v.literal("private"),
          v.literal("pending"),
          v.literal("approved"),
          v.literal("rejected"),
        ),
      ),
      publicationRequestedAt: v.optional(v.number()),
      publicationReviewedAt: v.optional(v.number()),
      publicationReviewedBy: v.optional(v.string()),
      publicationRejectReason: v.optional(v.string()),
      /** SEO عمومی آگهی؛ در صورت خالی بودن، مقدار مناسب به‌صورت خودکار ساخته می‌شود */
      seoTitle: v.optional(v.string()),
      seoDescription: v.optional(v.string()),
      seoKeywords: v.optional(v.array(v.string())),
      noIndex: v.optional(v.boolean()),
      /** تعداد دفعات ارسال‌شده در شبکه‌های اجتماعی */
      sentCount: v.optional(v.number()),
      lastSharedAt: v.optional(v.number()),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    })
      .index("by_key", ["key"])
      .index("by_date", ["date"])
      .index("by_city", ["city"])
      .index("by_created_by", ["createdByUserId"])
      .index("by_kind_updated", ["listingKind", "updatedAt"])
      .index("by_owner_kind_updated", ["createdByUserId", "listingKind", "updatedAt"])
      .index("by_kind_date", ["listingKind", "date"])
      .index("by_owner_kind_date", ["createdByUserId", "listingKind", "date"])
      .index("by_kind_price", ["listingKind", "priceMillion"])
      .index("by_owner_kind_price", ["createdByUserId", "listingKind", "priceMillion"])
      .index("by_kind_area", ["listingKind", "area"])
      .index("by_owner_kind_area", ["createdByUserId", "listingKind", "area"])
      .index("by_kind_latitude", ["listingKind", "latitude"])
      .index("by_owner_kind_latitude", ["createdByUserId", "listingKind", "latitude"])
      .index("by_public_latitude", ["isPublic", "latitude"])
      .index("by_submitter_created", ["submittedByPhone", "createdAt"])
      .index("by_public_slug", ["publicSlug"])
      .index("by_public_published", ["isPublic", "publishedAt"])
      .index("by_landing_public_featured_published", [
        "showOnLanding",
        "isPublic",
        "featuredOnHome",
        "publishedAt",
      ])
      .index("by_publication_status", ["publicationStatus"])
      .searchIndex("search_listings", {
        searchField: "searchText",
        filterFields: [
          "listingKind",
          "createdByUserId",
          "city",
          "dealType",
          "propertyType",
          "rooms",
        ],
      }),

    /**
     * آگهی‌های ذخیره‌شدهٔ هر کاربر. وابسته به حساب احراز هویت است تا
     * علاقه‌مندی‌ها روی همه دستگاه‌های همان کاربر قابل دسترسی باشند.
     */
    listingFavorites: defineTable({
      userId: v.string(),
      listingId: v.id("listings"),
      createdAt: v.number(),
    })
      .index("by_user_created", ["userId", "createdAt"])
      .index("by_user_listing", ["userId", "listingId"])
      .index("by_listing", ["listingId"]),

    /**
     * پروفایل عمومی مشاور/مدیر. اطلاعات تماس و شبکه‌های اجتماعی فقط در صورت
     * فعال بودن publicProfile در صفحه عمومی نمایش داده می‌شوند.
     */
    advisorProfiles: defineTable({
      userId: v.string(),
      slug: v.string(),
      publicProfile: v.boolean(),
      headline: v.optional(v.string()),
      bio: v.optional(v.string()),
      city: v.optional(v.string()),
      region: v.optional(v.string()),
      publicPhone: v.optional(v.string()),
      whatsapp: v.optional(v.string()),
      instagram: v.optional(v.string()),
      telegram: v.optional(v.string()),
      website: v.optional(v.string()),
      specialties: v.optional(v.array(v.string())),
      profileImageStorageId: v.optional(v.id("_storage")),
      coverImageStorageId: v.optional(v.id("_storage")),
      verified: v.optional(v.boolean()),
      successfulDeals: v.optional(v.number()),
      activeRequests: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_slug", ["slug"])
      .index("by_public_updated", ["publicProfile", "updatedAt"]),

    /**
     * استوری‌های عمومی مشاوران. هر رکورد یک فریم استوری است و در زمان انتشار
     * به‌طور پیش‌فرض ۲۴ ساعت فعال می‌ماند. زمان نمایش هر فریم حداکثر ۱۵ ثانیه است.
     */
    advisorStories: defineTable({
      ownerUserId: v.string(),
      createdByUserId: v.string(),
      title: v.optional(v.string()),
      body: v.optional(v.string()),
      contentType: v.union(
        v.literal("image"),
        v.literal("video"),
        v.literal("text"),
      ),
      storageId: v.optional(v.id("_storage")),
      linkUrl: v.optional(v.string()),
      linkLabel: v.optional(v.string()),
      stickerText: v.optional(v.string()),
      stickerStyle: v.optional(v.string()),
      background: v.optional(v.string()),
      durationSec: v.number(),
      status: v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("archived"),
        v.literal("scheduled"),
      ),
      startsAt: v.optional(v.number()),
      expiresAt: v.optional(v.number()),
      publishedAt: v.optional(v.number()),
      viewCount: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_owner_updated", ["ownerUserId", "updatedAt"])
      .index("by_status_starts", ["status", "startsAt"])
      .index("by_status_expires", ["status", "expiresAt"]),

    /**
     * گفت‌وگوی خصوصی داخلی بین مشاوران و مدیر. pairKey همیشه از دو userId
     * مرتب‌شده ساخته می‌شود تا برای هر دو نفر فقط یک Thread وجود داشته باشد.
     */
    advisorConversations: defineTable({
      pairKey: v.string(),
      participantA: v.string(),
      participantB: v.string(),
      lastMessage: v.optional(v.string()),
      lastSenderUserId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_pair", ["pairKey"])
      .index("by_a_updated", ["participantA", "updatedAt"])
      .index("by_b_updated", ["participantB", "updatedAt"]),

    advisorMessages: defineTable({
      conversationId: v.id("advisorConversations"),
      senderUserId: v.string(),
      body: v.string(),
      createdAt: v.number(),
    }).index("by_conversation_created", ["conversationId", "createdAt"]),

    advisorConversationReads: defineTable({
      conversationId: v.id("advisorConversations"),
      userId: v.string(),
      lastReadAt: v.number(),
    }).index("by_conversation_user", ["conversationId", "userId"]),

    /** هویت محلی مهمان برای ادامه چت بدون ثبت‌نام در همان مرورگر. */
    chatGuests: defineTable({
      token: v.string(),
      name: v.string(),
      phone: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_token", ["token"]),

    /** یادآوری پیگیری آگهی؛ برای هر آگهی حداکثر دو تاریخ قابل تنظیم است. */
    listingReminders: defineTable({
      listingId: v.id("listings"),
      listingKey: v.string(),
      slot: v.union(v.literal(1), v.literal(2)),
      remindAt: v.number(),
      createdByUserId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_listing_slot", ["listingId", "slot"])
      .index("by_remind_at", ["remindAt"])
      .index("by_creator_remind_at", ["createdByUserId", "remindAt"]),

    /** درخواست‌های ثبت‌شده از لندینگ: می‌خرم/اجاره می‌کنم/می‌فروشم/اجاره می‌دهم */
    propertyLeads: defineTable({
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
      /** ثبت‌کننده داخلی متقاضی؛ برای ثبت عمومی خالی است. */
      createdByUserId: v.optional(v.string()),
      source: v.optional(v.union(v.literal("public"), v.literal("dashboard"))),
      status: v.union(
        v.literal("new"),
        v.literal("contacted"),
        v.literal("closed"),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_status_created", ["status", "createdAt"])
      .index("by_created", ["createdAt"])
      .index("by_creator_created", ["createdByUserId", "createdAt"]),

    /** اسرار اتصال پیام‌رسان؛ فقط در توابع سمت سرور و پنل مدیر استفاده می‌شود */
    integrationSecrets: defineTable({
      key: v.string(),
      telegramBotToken: v.optional(v.string()),
      telegramChatId: v.optional(v.string()),
      baleBotToken: v.optional(v.string()),
      baleChatId: v.optional(v.string()),
      /** کلید OpenRouter فقط سمت سرور نگهداری می‌شود. */
      openRouterApiKey: v.optional(v.string()),
      openRouterModel: v.optional(v.string()),
      notifyLeads: v.optional(v.boolean()),
      notifyPublicationRequests: v.optional(v.boolean()),
      notifyListingActivity: v.optional(v.boolean()),
      notifyChatMessages: v.optional(v.boolean()),
      updatedAt: v.number(),
    }).index("by_key", ["key"]),

    /**
     * صفحه‌ساز دیوساز: هر صفحه از بلوک‌های ساختاریافته تشکیل می‌شود تا مدیر
     * بدون ویرایش HTML بتواند سکشن‌ها را جابه‌جا و متن‌ها را ویرایش کند.
     */
    sitePages: defineTable({
      title: v.string(),
      slug: v.string(),
      pageType: v.union(v.literal("landing"), v.literal("page")),
      status: v.union(v.literal("draft"), v.literal("published")),
      isHomepage: v.boolean(),
      blocks: v.array(
        v.object({
          id: v.string(),
          type: v.string(),
          enabled: v.boolean(),
          order: v.number(),
          props: v.any(),
        }),
      ),
      seoTitle: v.optional(v.string()),
      seoDescription: v.optional(v.string()),
      seoKeywords: v.optional(v.array(v.string())),
      canonicalUrl: v.optional(v.string()),
      ogTitle: v.optional(v.string()),
      ogDescription: v.optional(v.string()),
      ogImage: v.optional(v.string()),
      noIndex: v.optional(v.boolean()),
      /** تنظیمات ظاهری کلی صفحه‌ساز حرفه‌ای؛ فونت، عرض محتوا و پس‌زمینه */
      settings: v.optional(v.any()),
      createdByUserId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
      publishedAt: v.optional(v.number()),
    })
      .index("by_slug", ["slug"])
      .index("by_status_updated", ["status", "updatedAt"])
      .index("by_homepage_status", ["isHomepage", "status"]),

    /**
     * کتابخانه رسانه صفحه‌ساز؛ فایل‌ها در Convex Storage نگهداری می‌شوند تا
     * تصاویر و فونت‌ها وابسته به سرویس‌های خارجی نباشند.
     */
    siteMedia: defineTable({
      storageId: v.id("_storage"),
      kind: v.union(
        v.literal("image"),
        v.literal("font"),
        v.literal("video"),
        v.literal("file"),
      ),
      fileName: v.string(),
      mimeType: v.string(),
      size: v.optional(v.number()),
      title: v.optional(v.string()),
      alt: v.optional(v.string()),
      createdByUserId: v.string(),
      createdAt: v.number(),
    })
      .index("by_created", ["createdAt"])
      .index("by_kind_created", ["kind", "createdAt"]),

    /** مقالات وبلاگ و تنظیمات SEO هر مقاله */
    posts: defineTable({
      title: v.string(),
      slug: v.string(),
      excerpt: v.optional(v.string()),
      content: v.string(),
      category: v.optional(v.string()),
      featuredImage: v.optional(v.string()),
      status: v.union(v.literal("draft"), v.literal("published")),
      authorId: v.optional(v.string()),
      authorName: v.optional(v.string()),
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      focusKeyword: v.optional(v.string()),
      keywords: v.optional(v.array(v.string())),
      canonicalUrl: v.optional(v.string()),
      ogTitle: v.optional(v.string()),
      ogDescription: v.optional(v.string()),
      ogImage: v.optional(v.string()),
      noIndex: v.optional(v.boolean()),
      publishedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_slug", ["slug"])
      .index("by_status_published", ["status", "publishedAt"])
      .index("by_updated", ["updatedAt"]),

    /** زونکن/پرونده‌های بایگانی برای دسته‌بندی آگهی‌ها */
    folders: defineTable({
      name: v.string(),
      color: v.optional(v.string()),
      order: v.optional(v.number()),
      createdBy: v.optional(v.string()),
      createdAt: v.optional(v.number()),
    }).index("by_order", ["order"]),

    /** تنظیمات عمومی: شمارهٔ تماس دفتر، متن پایانی پیام‌ها، شهرها و دسته‌های سفارشی */
    appSettings: defineTable({
      key: v.string(),
      officeName: v.optional(v.string()),
      managerPhone: v.optional(v.string()),
      shareFooter: v.optional(v.string()),
      /** تم پیش‌فرض کل سایت؛ توسط مدیر انتخاب می‌شود */
      siteTheme: v.optional(
        v.union(
          v.literal("navy"),
          v.literal("emerald"),
          v.literal("light"),
        ),
      ),
      /** نسخه صفحه اصلی قابل انتخاب بدون حذف لندینگ قبلی */
      homepageVariant: v.optional(
        v.union(v.literal("classic"), v.literal("modern"), v.literal("visual")),
      ),
      /** نمایش شمارنده تعداد آگهی‌ها در نقشه عمومی و لندینگ نقشه‌محور. */
      showMapCountBadge: v.optional(v.boolean()),
      /** شناسه ماژول‌های اختیاری فعال؛ کد هر ماژول مستقل از هسته نگه داشته می‌شود. */
      enabledModules: v.optional(v.array(v.string())),
      /** شهر/دسته/نوع ملک‌های افزوده‌شده توسط مدیر */
      customCities: v.optional(v.array(v.string())),
      customDeals: v.optional(v.array(v.string())),
      customPropertyTypes: v.optional(v.array(v.string())),
      /** نقشهٔ پیش‌فرض فرم‌ها؛ کلید نشان یک Web SDK key سمت مرورگر است. */
      mapProvider: v.optional(
        v.union(v.literal("neshan"), v.literal("osm")),
      ),
      neshanMapKey: v.optional(v.string()),
      /** فعال/غیرفعال بودن هر موتور نقشه در کل رابط کاربری */
      neshanMapEnabled: v.optional(v.boolean()),
      osmMapEnabled: v.optional(v.boolean()),
      /** سن آگهی برای ورود به صف پیگیری، بر حسب ماه؛ پیش‌فرض ۱۱ ماه */
      reminderAgeMonths: v.optional(v.number()),
      /** مدت نمایش یادآوریِ سررسیدشده؛ پیش‌فرض ۱۰ روز */
      reminderVisibleDays: v.optional(v.number()),
      /** فرم مرحله‌ای و فیلدهای قابل‌ویرایش برای هر گروه ملک */
      listingFieldConfigs: v.optional(
        v.array(
          v.object({
            id: v.string(),
            name: v.string(),
            propertyTypes: v.array(v.string()),
            fields: v.array(
              v.object({
                id: v.string(),
                label: v.string(),
                type: v.union(
                  v.literal("text"),
                  v.literal("number"),
                  v.literal("boolean"),
                  v.literal("select"),
                  v.literal("textarea"),
                  v.literal("date"),
                ),
                required: v.boolean(),
                public: v.boolean(),
                unit: v.optional(v.string()),
                placeholder: v.optional(v.string()),
                options: v.optional(v.array(v.string())),
                order: v.number(),
              }),
            ),
          }),
        ),
      ),
      /**
       * نشانی فایل منبع آگهی‌های روزانه (HTML/JSON/CSV). هر روز ساعت ۶ صبح
       * توسط cron خوانده و آگهی‌های تازه روی سرور ذخیره می‌شوند.
       */
      sourceUrl: v.optional(v.string()),
      /** وضعیت مهاجرت‌های یک‌باره داده‌های قدیمی */
      listingKindMigrationDone: v.optional(v.boolean()),
      listingSearchBackfillDone: v.optional(v.boolean()),
      landingVisibilityMigrationDone: v.optional(v.boolean()),
      listingCoordinatesBackfillDone: v.optional(v.boolean()),
      listingCoordinatesBackfillCursor: v.optional(v.string()),
      /** شمارنده‌های سریع آگهی‌ها؛ برای نمایش عدد واقعی بدون خواندن هزاران رکورد */
      listingCountsReady: v.optional(v.boolean()),
      listingImportedCount: v.optional(v.number()),
      listingMemberCount: v.optional(v.number()),
      listingCountsUpdatedAt: v.optional(v.number()),
      listingCountRebuildView: v.optional(
        v.union(v.literal("imported"), v.literal("member")),
      ),
      listingCountRebuildCursor: v.optional(v.string()),
      listingCountRebuildImported: v.optional(v.number()),
      listingCountRebuildMember: v.optional(v.number()),
      /** گزارش آخرین اجرای افزودن روزانه */
      lastImportAt: v.optional(v.number()),
      lastImportAdded: v.optional(v.number()),
      lastImportUpdated: v.optional(v.number()),
      lastImportError: v.optional(v.string()),
      updatedAt: v.optional(v.number()),
    }).index("by_key", ["key"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
