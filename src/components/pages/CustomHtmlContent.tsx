import { useMemo } from "react";

const FORBIDDEN_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "base",
]);

function safeHref(value: string) {
  const href = value.trim();
  if (!href) return "";
  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    href.startsWith("tel:") ||
    href.startsWith("mailto:") ||
    /^https?:\/\//i.test(href)
  ) {
    return href;
  }
  return "";
}

function safeSrc(value: string) {
  const src = value.trim();
  if (!src) return "";
  if (
    src.startsWith("/") ||
    /^https:\/\//i.test(src) ||
    /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(src)
  ) {
    return src;
  }
  return "";
}

function cleanInlineStyle(value: string) {
  return value
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/url\s*\(\s*(['"]?)\s*javascript:[^)]*\)/gi, "")
    .replace(/behavior\s*:[^;]+;?/gi, "")
    .replace(/-moz-binding\s*:[^;]+;?/gi, "");
}

export function sanitizeBuilderHtml(source: string) {
  if (typeof window === "undefined") return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(source || "", "text/html");

  for (const element of Array.from(doc.body.querySelectorAll("*"))) {
    const tag = element.tagName.toLowerCase();
    if (FORBIDDEN_TAGS.has(tag)) {
      element.remove();
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (name.startsWith("on") || name === "srcdoc") {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (name === "href") {
        const next = safeHref(value);
        if (next) element.setAttribute("href", next);
        else element.removeAttribute("href");
        continue;
      }

      if (name === "src") {
        const next = safeSrc(value);
        if (next) element.setAttribute("src", next);
        else element.removeAttribute("src");
        continue;
      }

      if (name === "style") {
        element.setAttribute("style", cleanInlineStyle(value));
      }
    }

    if (
      element instanceof HTMLAnchorElement &&
      element.getAttribute("target") === "_blank"
    ) {
      element.setAttribute("rel", "noopener noreferrer");
    }
  }

  return doc.body.innerHTML;
}

function stripUnsafeCss(source: string) {
  return (source || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@import\s+[^;]+;/gi, "")
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/url\s*\(\s*(['"]?)\s*javascript:[^)]*\)/gi, "")
    .replace(/behavior\s*:[^;]+;?/gi, "")
    .replace(/-moz-binding\s*:[^;]+;?/gi, "");
}

function scopeSelector(selector: string, scope: string) {
  const trimmed = selector.trim();
  if (!trimmed) return "";
  if (trimmed === ":root" || trimmed === "html" || trimmed === "body") {
    return scope;
  }
  if (trimmed.startsWith(scope)) return trimmed;
  return scope + " " + trimmed;
}

function processCssBlock(source: string, scope: string): string {
  let output = "";
  let cursor = 0;

  while (cursor < source.length) {
    const open = source.indexOf("{", cursor);
    if (open < 0) break;

    const header = source.slice(cursor, open).trim();
    let depth = 1;
    let close = open + 1;
    while (close < source.length && depth > 0) {
      if (source[close] === "{") depth += 1;
      if (source[close] === "}") depth -= 1;
      close += 1;
    }
    if (depth !== 0) break;

    const body = source.slice(open + 1, close - 1);

    if (/^@(media|supports|container|layer)\b/i.test(header)) {
      output += header + "{" + processCssBlock(body, scope) + "}";
    } else if (/^@(keyframes|-webkit-keyframes|font-face|property)\b/i.test(header)) {
      output += header + "{" + body + "}";
    } else if (header.startsWith("@")) {
      // Unknown at-rules are intentionally ignored in public rendering.
    } else {
      const selectors = header
        .split(",")
        .map((item) => scopeSelector(item, scope))
        .filter(Boolean);
      if (selectors.length) {
        output += selectors.join(",") + "{" + body + "}";
      }
    }

    cursor = close;
  }

  return output;
}

export function scopeBuilderCss(source: string, scope: string) {
  return processCssBlock(stripUnsafeCss(source), scope);
}

export default function CustomHtmlContent({
  blockId,
  html,
  css,
}: {
  blockId: string;
  html?: string;
  css?: string;
}) {
  const safeId = blockId.replace(/[^a-zA-Z0-9_-]/g, "");
  const scope = `[data-custom-html="${safeId}"]`;
  const safeHtml = useMemo(() => sanitizeBuilderHtml(html || ""), [html]);
  const safeCss = useMemo(() => scopeBuilderCss(css || "", scope), [css, scope]);

  return (
    <div data-custom-html={safeId} className="relative">
      {safeCss ? <style>{safeCss}</style> : null}
      <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
    </div>
  );
}
