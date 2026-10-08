import { query } from "./_generated/server";

export const sitemapEntries = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_public_published", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(8000);

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status_published", (q) => q.eq("status", "published"))
      .order("desc")
      .take(500);

    const pages = await ctx.db
      .query("sitePages")
      .withIndex("by_status_updated", (q) => q.eq("status", "published"))
      .order("desc")
      .take(500);

    const advisors = (await ctx.db.query("advisorProfiles").collect())
      .filter((row) => row.publicProfile)
      .slice(0, 500);

    return {
      listings: listings
        .filter((row) => Boolean(row.publicSlug) && !row.noIndex)
        .map((row) => ({
          slug: row.publicSlug!,
          updatedAt:
            row.updatedAt ?? row.publishedAt ?? row.createdAt ?? Date.now(),
        })),
      posts: posts
        .filter((row) => Boolean(row.slug) && !row.noIndex)
        .map((row) => ({
          slug: row.slug,
          updatedAt: row.updatedAt ?? row.publishedAt ?? row.createdAt,
        })),
      pages: pages
        .filter((row) => Boolean(row.slug) && !row.noIndex && !row.isHomepage)
        .map((row) => ({
          slug: row.slug,
          updatedAt: row.updatedAt ?? row.publishedAt ?? row.createdAt,
        })),
      advisors: advisors
        .filter((row) => Boolean(row.slug))
        .map((row) => ({
          slug: row.slug,
          updatedAt: row.updatedAt,
        })),
    };
  },
});
