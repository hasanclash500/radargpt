import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SITE_URL,
  xmlEscape,
  canonicalUrl,
  validLastmod,
  renderXml,
  collectSitemapEntries,
} from "../api/sitemap.mjs";

test("sitemap escapes XML and never invents lastmod", () => {
  assert.equal(xmlEscape('A&B<"\''), "A&amp;B&lt;&quot;&apos;");
  assert.equal(validLastmod(undefined), undefined);
  assert.equal(validLastmod("not-a-date"), undefined);
  assert.equal(validLastmod(1760000000000), "2025-10-09");
  const xml = renderXml(new Map([[SITE_URL + "/test?a=1&b=2", undefined]]));
  assert.match(xml, /test\?a=1&amp;b=2/);
  assert.doesNotMatch(xml, /<lastmod>/);
});

test("canonical URL rejects external domains", () => {
  assert.equal(canonicalUrl("/listings"), "https://divsaz.ir/listings");
  assert.throws(() => canonicalUrl("https://evil.example/path"), /External/);
});

test("sitemap iterates pages, includes seed blog and canonical slug URLs", async () => {
  let listingPages = 0;
  const mock = {
    async query(_ref, { kind, paginationOpts }) {
      if (kind !== "listings") return {
        isDone: true, continueCursor: "", entries: [],
        includeSeedFallback: kind === "posts",
      };
      listingPages++;
      if (paginationOpts.cursor === null) return {
        isDone: false,
        continueCursor: "page2",
        entries: [{ slug: "shahriar/sale & rent", updatedAt: 1760000000000 }],
      };
      assert.equal(paginationOpts.cursor, "page2");
      return { isDone: true, continueCursor: "", entries: [{ slug: "factory", updatedAt: undefined }] };
    },
  };
  const entries = await collectSitemapEntries(mock, {});
  assert.equal(listingPages, 2);
  assert.ok(entries.has(SITE_URL + "/"));
  assert.ok(entries.has(SITE_URL + "/blog/industrial-property-rent-shahriar"));
  assert.ok(entries.has(SITE_URL + "/listings/shahriar%2Fsale%20%26%20rent"));
  assert.ok(entries.has(SITE_URL + "/listings/factory"));
  const xml = renderXml(entries);
  assert.match(xml, /<lastmod>2025-10-09<\/lastmod>/);
  assert.ok(xml.includes("</urlset>"));
});

test("sitemap refuses malformed backend responses, no silent partial index", async () => {
  const mock = { query: async () => ({ entries: null, isDone: true }) };
  await assert.rejects(collectSitemapEntries(mock, {}), /Invalid sitemap result/);
});
