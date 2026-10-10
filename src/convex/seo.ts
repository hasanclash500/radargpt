import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Public, paginated sitemap data. Fetching all listing documents in one Convex
 * query can exceed its read / memory limits once the catalogue grows.
 *
 * Return only canonical, publicly published, indexable slugs and real edit dates.
 * The public site still validates access when a URL is opened.
 */
export const sitemapPage = query({
  args: {
    kind: v.union(
      v.literal("listings"),
      v.literal("posts"),
      v.literal("pages"),
      v.literal("advisors"),
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { kind, paginationOpts }) => {
    if (kind === "listings") {
      const batch = await ctx.db
        .query("listings")
        .withIndex("by_public_published", (q) => q.eq("isPublic", true))
        .order("desc")
        .paginate(paginationOpts);
      return {
        isDone: batch.isDone,
        continueCursor: batch.continueCursor,
        entries: batch.page
          .filter((row) =>
            Boolean(row.publicSlug) &&
            !row.noIndex &&
            row.publicationStatus !== "pending" &&
            row.publicationStatus !== "rejected" &&
            row.publicationStatus !== "private"
          )
          .map((row) => ({
            slug: row.publicSlug!,
            updatedAt: row.updatedAt ?? row.publishedAt ?? row.createdAt,
          })),
      };
    }

    if (kind === "posts") {
      const batch = await ctx.db
        .query("posts")
        .withIndex("by_status_published", (q) => q.eq("status", "published"))
        .order("desc")
        .paginate(paginationOpts);
      return {
        isDone: batch.isDone,
        continueCursor: batch.continueCursor,
        includeSeedFallback: batch.page.length === 0 && batch.isDone && paginationOpts.cursor === null,
        entries: batch.page
          .filter((row) => Boolean(row.slug) && !row.noIndex &&
            (!row.canonicalUrl ||
              row.canonicalUrl.replace(/\/$/, "") ===
                `https://divsaz.ir/blog/${encodeURIComponent(row.slug)}`))
          .map((row) => ({
            slug: row.slug,
            updatedAt: row.updatedAt ?? row.publishedAt ?? row.createdAt,
          })),
      };
    }

    if (kind === "pages") {
      const batch = await ctx.db
        .query("sitePages")
        .withIndex("by_status_updated", (q) => q.eq("status", "published"))
        .order("desc")
        .paginate(paginationOpts);
      return {
        isDone: batch.isDone,
        continueCursor: batch.continueCursor,
        entries: batch.page
          .filter((row) => Boolean(row.slug) && !row.noIndex && !row.isHomepage &&
            (!row.canonicalUrl ||
              row.canonicalUrl.replace(/\/$/, "") ===
                `https://divsaz.ir/p/${encodeURIComponent(row.slug)}`))
          .map((row) => ({
            slug: row.slug,
            updatedAt: row.updatedAt ?? row.publishedAt ?? row.createdAt,
          })),
      };
    }

    const batch = await ctx.db
      .query("advisorProfiles")
      .order("desc")
      .paginate(paginationOpts);
    return {
      isDone: batch.isDone,
      continueCursor: batch.continueCursor,
      entries: batch.page
        .filter((row) => Boolean(row.publicProfile) && Boolean(row.slug))
        .map((row) => ({
          slug: row.slug!,
          updatedAt: row.updatedAt,
        })),
    };
  },
});
