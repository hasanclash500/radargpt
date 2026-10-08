const SITE = "https://divsaz.ir";
const KEY = "aa7222d1430d3b244c19159ab6f14400";
const KEY_LOCATION = SITE + "/" + KEY + ".txt";

const sitemap = await fetch(SITE + "/sitemap.xml", {
  headers: { "User-Agent": "Divosaz-IndexNow/1.0" },
});
if (!sitemap.ok) {
  throw new Error("Could not fetch sitemap: HTTP " + sitemap.status);
}

const xml = await sitemap.text();
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => match[1].replaceAll("&amp;", "&"))
  .filter((url) => url.startsWith(SITE))
  .slice(0, 10000);

if (!urls.length) {
  throw new Error("No canonical URLs found in sitemap.");
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: "divsaz.ir",
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  }),
});

if (!response.ok && response.status !== 202) {
  const body = await response.text();
  throw new Error(
    "IndexNow submission failed: HTTP " + response.status + " " + body,
  );
}

console.log(
  "IndexNow accepted " +
    urls.length +
    " URLs with HTTP " +
    response.status +
    ".",
);
