/**
 * Post-deploy technical SEO smoke test. Run: npm run seo:audit
 * No credentials required. Read-only requests against public URLs.
 */
const origin = (process.env.SEO_SITE_URL || "https://divsaz.ir").replace(/\/$/, "");
const errors = [];
const warnings = [];
const run = async (path) => {
  const url = origin + path;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: { "User-Agent": "Divosaz-SEO-Audit/1.0" },
    redirect: "follow",
  });
  return { response, text: await response.text(), url };
};

const check = (ok, message) => {
  if (!ok) errors.push(message);
  console.log((ok ? "PASS " : "FAIL ") + message);
};
const warn = (message) => {
  warnings.push(message);
  console.log("WARN " + message);
};

try {
  const robots = await run("/robots.txt");
  check(robots.response.status === 200, "robots.txt returns HTTP 200");
  check(/User-agent:\s*\*/i.test(robots.text), "robots.txt declares crawler rules");
  check(robots.text.includes("Sitemap: " + origin + "/sitemap.xml"),
    "robots.txt advertises canonical sitemap");
  check(!/User-agent:\s*Googlebot[\s\S]*?Disallow:\s*\//i.test(robots.text),
    "no blanket Googlebot ban");
} catch (error) {
  check(false, "robots.txt could not be checked: " + error.message);
}

let firstDetail;
try {
  const sitemap = await run("/sitemap.xml");
  check(sitemap.response.status === 200, "sitemap.xml returns HTTP 200");
  check(sitemap.response.headers.get("content-type")?.includes("xml"),
    "sitemap is served as XML");
  check(/<urlset\b/.test(sitemap.text) && /<\/urlset>/.test(sitemap.text),
    "sitemap is a complete XML urlset");
  const urls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1].replaceAll("&amp;", "&")
  );
  check(urls.length >= 4, "sitemap includes core pages");
  check(urls.every((url) => url.startsWith(origin + "/")), "all sitemap URLs use the preferred host");
  check(new Set(urls).size === urls.length, "sitemap contains no duplicates");
  check(!urls.some((url) => /\/(dashboard|admin|auth|saved)(\/|$|\?)/.test(url)),
    "private routes are not in the sitemap");
  firstDetail = urls.find((url) => url.includes("/listings/")) || urls.find((url) => url.includes("/blog/"));
  console.log("Discovered sitemap URLs: " + urls.length);
  if (!firstDetail) warn("No listing detail or article was found in sitemap (verify that public items exist).");
} catch (error) {
  check(false, "sitemap.xml could not be checked: " + error.message);
}

try {
  const home = await run("/");
  check(home.response.status === 200, "homepage returns HTTP 200");
  check(/<html[^>]+lang="fa"/.test(home.text), "document language is Persian");
  check(/<meta[^>]+name="description"/i.test(home.text), "homepage has meta description");
  check(/<meta[^>]+property="og:image"/i.test(home.text), "homepage has Open Graph image");
  check(/application\/ld\+json/.test(home.text), "homepage contains structured data");
} catch (error) {
  check(false, "homepage could not be checked: " + error.message);
}

if (firstDetail) {
  try {
    const page = await run(new URL(firstDetail).pathname);
    if (page.response.status === 200 && page.text.includes('<div id="root"></div>')) {
      warn("Property/article HTML is a client-rendered SPA shell. For stronger Google/social sharing previews, add SSR or prerendered per-URL titles, descriptions and canonical tags.");
    }
  } catch (error) {
    warn("Could not audit a detail page: " + error.message);
  }
}
console.log("\nSEO smoke test: " + errors.length + " errors, " + warnings.length + " advisory warnings.");
if (errors.length) process.exitCode = 1;
