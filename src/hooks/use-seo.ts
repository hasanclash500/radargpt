import { useEffect } from "react";

type SeoConfig = {
  title: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
};

function ensureMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
  return el;
}

export function useSeo(config: SeoConfig) {
  const {
    title,
    description = "",
    keywords = [],
    canonical,
    image,
    noIndex = false,
    type = "website",
    jsonLd,
  } = config;

  useEffect(() => {
    const previousTitle = document.title;
    const canonicalUrl = canonical || window.location.href.split("#")[0];

    document.title = title;

    ensureMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: noIndex ? "noindex, nofollow" : "index, follow",
    });
    if (keywords.length) {
      ensureMeta('meta[name="keywords"]', {
        name: "keywords",
        content: keywords.join(", "),
      });
    }

    ensureMeta('meta[property="og:title"]', { property: "og:title", content: title });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: type });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: image ? "summary_large_image" : "summary",
    });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });

    if (image) {
      ensureMeta('meta[property="og:image"]', { property: "og:image", content: image });
      ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    }

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    const scriptId = "meka-structured-data";
    document.getElementById(scriptId)?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      document.getElementById(scriptId)?.remove();
    };
  }, [
    title,
    description,
    canonical,
    image,
    noIndex,
    type,
    keywords.join("|"),
    JSON.stringify(jsonLd ?? null),
  ]);
}
