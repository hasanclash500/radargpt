import { useEffect } from "react";

type SeoConfig = {
  title: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  image?: string;
  imageAlt?: string;
  ogTitle?: string;
  ogDescription?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
  siteName?: string;
  locale?: string;
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
    imageAlt,
    ogTitle,
    ogDescription,
    noIndex = false,
    type = "website",
    jsonLd,
    siteName = "دیوساز",
    locale = "fa_IR",
  } = config;

  useEffect(() => {
    const previousTitle = document.title;
    const canonicalUrl =
      canonical || window.location.href.split(/[?#]/)[0];
    const absoluteImage = image
      ? new URL(image, window.location.origin).toString()
      : "";

    document.documentElement.lang = "fa";
    document.documentElement.dir = "rtl";
    document.title = title;

    ensureMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: noIndex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    });
    ensureMeta('meta[name="googlebot"]', {
      name: "googlebot",
      content: noIndex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    });
    if (keywords.length) {
      ensureMeta('meta[name="keywords"]', {
        name: "keywords",
        content: keywords.join(", "),
      });
    }

    ensureMeta('meta[property="og:title"]', { property: "og:title", content: ogTitle || title });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: ogDescription || description,
    });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: type });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    ensureMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: siteName,
    });
    ensureMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: locale,
    });
    ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: image ? "summary_large_image" : "summary",
    });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: ogTitle || title });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: ogDescription || description,
    });

    const ogImage = document.head.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    const twitterImage = document.head.querySelector<HTMLMetaElement>('meta[name="twitter:image"]');
    const ogImageAlt = document.head.querySelector<HTMLMetaElement>('meta[property="og:image:alt"]');
    if (absoluteImage) {
      ensureMeta('meta[property="og:image"]', {
        property: "og:image",
        content: absoluteImage,
      });
      ensureMeta('meta[name="twitter:image"]', {
        name: "twitter:image",
        content: absoluteImage,
      });
      ensureMeta('meta[property="og:image:alt"]', {
        property: "og:image:alt",
        content: imageAlt || ogTitle || title,
      });
    } else {
      ogImage?.remove();
      twitterImage?.remove();
      ogImageAlt?.remove();
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
    imageAlt,
    ogTitle,
    ogDescription,
    noIndex,
    type,
    keywords.join("|"),
    JSON.stringify(jsonLd ?? null),
    siteName,
    locale,
  ]);
}
