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
  return `  <url><loc>${escapeXml(loc)}</loc><lastmod>${isoDate(lastmod)}</lastmod></url>`;
}

export default async function handler(req, res) {
  const now = Date.now();
  const rows = [
    row(SITE + "/", now),
    row(absolute("/listings"), now),
    row(absolute("/blog"), now),
    row(absolute("/about"), now),
    row(absolute("/assistant"), now),
    row(absolute("/request"), now),
    row(absolute("/submit-listing"), now),
  ];

  try {
    const convexUrl = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
    if (convexUrl) {
      const client = new ConvexHttpClient(convexUrl);
      const data = await client.query(api.seo.sitemapEntries, {});

      for (const item of data.listings || []) {
        rows.push(
          row(absolute("/listings/" + encodeURIComponent(item.slug)), item.updatedAt),
        );
      }
      for (const item of data.posts || []) {
        rows.push(
          row(absolute("/blog/" + encodeURIComponent(item.slug)), item.updatedAt),
        );
      }
      for (const item of data.pages || []) {
        rows.push(
          row(absolute("/p/" + encodeURIComponent(item.slug)), item.updatedAt),
        );
      }
      for (const item of data.advisors || []) {
        rows.push(
          row(
            absolute("/consultants/" + encodeURIComponent(item.slug)),
            item.updatedAt,
          ),
        );
      }
    }
  } catch (error) {
    console.error("[sitemap] dynamic entries failed", error);
  }

  // Seed articles exist even before the first persisted blog post is created.
  rows.push(
    row(absolute("/blog/industrial-property-rent-shahriar"), now),
    row(absolute("/blog/office-rent-shahriar"), now),
  );

  const unique = [...new Set(rows)];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    unique.join("\n") +
    "\n</urlset>\n";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=3600",
  );
  res.status(200).send(xml);
}
