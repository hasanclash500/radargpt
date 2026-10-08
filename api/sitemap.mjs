import { ConvexHttpClient } from "convex/browser";
import { api } from "../src/convex/_generated/api.js";

const SITE = "https://divsaz.ir";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function isoDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime())
    ? date.toISOString()
    : new Date().toISOString();
}

function absolute(path) {
  return new URL(path, SITE).toString();
}

function row(loc, lastmod) {
  const modified = lastmod
    ? `<lastmod>${isoDate(lastmod)}</lastmod>`
    : "";
  return `  <url><loc>${escapeXml(loc)}</loc>${modified}</url>`;
}

export default async function handler(req, res) {
  const entries = new Map([
    [SITE + "/", undefined],
    [absolute("/listings"), undefined],
    [absolute("/blog"), undefined],
    [absolute("/about"), undefined],
    [absolute("/assistant"), undefined],
    [absolute("/request"), undefined],
    [absolute("/submit-listing"), undefined],
  ]);

  try {
    const convexUrl = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
    if (convexUrl) {
      const client = new ConvexHttpClient(convexUrl);
      const data = await client.query(api.seo.sitemapEntries, {});

      for (const item of data.listings || []) {
        entries.set(
          absolute("/listings/" + encodeURIComponent(item.slug)),
          item.updatedAt,
        );
      }
      for (const item of data.posts || []) {
        entries.set(
          absolute("/blog/" + encodeURIComponent(item.slug)),
          item.updatedAt,
        );
      }
      for (const item of data.pages || []) {
        entries.set(
          absolute("/p/" + encodeURIComponent(item.slug)),
          item.updatedAt,
        );
      }
      for (const item of data.advisors || []) {
        entries.set(
          absolute("/consultants/" + encodeURIComponent(item.slug)),
          item.updatedAt,
        );
      }
    }
  } catch (error) {
    console.error("[sitemap] dynamic entries failed", error);
  }

  // Seed articles exist even before the first persisted blog post is created.
  if (!entries.has(absolute("/blog/industrial-property-rent-shahriar"))) {
    entries.set(absolute("/blog/industrial-property-rent-shahriar"), undefined);
  }
  if (!entries.has(absolute("/blog/office-rent-shahriar"))) {
    entries.set(absolute("/blog/office-rent-shahriar"), undefined);
  }

  const rows = [...entries.entries()].map(([loc, lastmod]) =>
    row(loc, lastmod),
  );
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    rows.join("\n") +
    "\n</urlset>\n";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=3600",
  );
  res.status(200).send(xml);
}
