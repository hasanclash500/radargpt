import { ConvexHttpClient } from "convex/browser";
import { api } from "../src/convex/_generated/api.js";

export const SITE_URL = "https://divsaz.ir";
const MAX_URLS = 50000;
const MAX_BYTES = 50 * 1024 * 1024;
const PAGE_SIZE = 400;

const CORE_PAGES = ["/", "/listings", "/blog", "/about"];
const SEED_ARTICLES = [
  "/blog/industrial-property-rent-shahriar",
  "/blog/office-rent-shahriar",
];
const KINDS = [
  ["listings", "/listings/"],
  ["posts", "/blog/"],
  ["pages", "/p/"],
  ["advisors", "/consultants/"],
];

export function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function canonicalUrl(path) {
  const url = new URL(path, SITE_URL);
  if (url.origin !== SITE_URL) throw new Error("External sitemap URL");
  url.hash = "";
  url.search = "";
  return url.toString();
}

export function validLastmod(timestamp) {
  if (timestamp == null) return undefined;
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) && date.getTime() > 0
    ? date.toISOString().slice(0, 10)
    : undefined;
}

export function renderXml(entries) {
  if (entries.size > MAX_URLS) {
    throw new Error("Sitemap exceeds 50,000 URLs. Split it into sitemap index shards.");
  }
  const rows = [...entries].map(([loc, lastmod]) => {
    const date = validLastmod(lastmod);
    return `  <url><loc>${xmlEscape(loc)}</loc>${date ? `<lastmod>${date}</lastmod>` : ""}</url>`;
  });
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    rows.join("\n") +
    '\n</urlset>\n';
  if (Buffer.byteLength(xml, "utf8") > MAX_BYTES) {
    throw new Error("Sitemap exceeds the 50 MB XML size limit.");
  }
  return xml;
}

/**
 * Page through the indexed, public Convex records instead of reading entire
 * listing documents in a single backend query.
 */
export async function collectSitemapEntries(client, queryReference = api.seo.sitemapPage) {
  const entries = new Map();
  for (const path of CORE_PAGES) entries.set(canonicalUrl(path), undefined);
  let useSeedArticles = false;

  for (const [kind, prefix] of KINDS) {
    let cursor = null;
    let pages = 0;
    while (true) {
      if (++pages > 300) throw new Error("Sitemap pagination exceeded safe limit.");
      const data = await client.query(queryReference, {
        kind,
        paginationOpts: { numItems: PAGE_SIZE, cursor },
      });
      if (!Array.isArray(data?.entries) || typeof data?.isDone !== "boolean") {
        throw new Error("Invalid sitemap result from backend.");
      }
      if (kind === "posts" && data.includeSeedFallback === true) {
        useSeedArticles = true;
      }
      for (const { slug, updatedAt } of data.entries) {
        if (typeof slug !== "string" || !slug.trim()) continue;
        // Segments are encoded individually; slashes in slugs cannot escape routes.
        entries.set(canonicalUrl(prefix + encodeURIComponent(slug)), updatedAt);
        if (entries.size > MAX_URLS) throw new Error("Too many sitemap URLs.");
      }
      if (data.isDone) break;
      if (!data.continueCursor || data.continueCursor === cursor) {
        throw new Error("Sitemap pagination cursor did not advance.");
      }
      cursor = data.continueCursor;
    }
  }

  // Only include seed articles while there are no persisted published posts.
  // Do not force noIndex posts into the sitemap if a manager disabled indexing.
  if (useSeedArticles) {
    for (const path of SEED_ARTICLES) {
      const loc = canonicalUrl(path);
      if (!entries.has(loc)) entries.set(loc, undefined);
    }
  }
  return entries;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }
  const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    console.error("[sitemap] CONVEX_URL or VITE_CONVEX_URL is not configured.");
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Sitemap backend is not configured.");
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    const entries = await collectSitemapEntries(client);
    const xml = renderXml(entries);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).send(req.method === "HEAD" ? "" : xml);
  } catch (error) {
    // Returning HTTP 200 with a partial sitemap would silently hide public
    // listings from crawlers. Fail loudly and allow a later retry instead.
    console.error("[sitemap] generation failed", error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Sitemap temporarily unavailable.");
  }
}
