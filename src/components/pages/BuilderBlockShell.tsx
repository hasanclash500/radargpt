import { motion, type Variants } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

type ResponsiveDesign = {
  widthPercent?: number;
  maxWidth?: number;
  minHeight?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginBottom?: number;
  translateX?: number;
  translateY?: number;
  titleSize?: number;
  bodySize?: number;
  titleWeight?: number;
  bodyWeight?: number;
  titleLineHeight?: number;
  bodyLineHeight?: number;
  textAlign?: "start" | "center" | "end";
};

type BlockDesign = {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundPosition?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  radius?: number;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  opacity?: number;
  position?: "relative" | "sticky";
  stickyTop?: number;
  zIndex?: number;
  animation?: "none" | "fade" | "fadeUp" | "slideRight" | "slideLeft" | "zoom";
  animationDuration?: number;
  desktop?: ResponsiveDesign;
  tablet?: ResponsiveDesign;
  mobile?: ResponsiveDesign;
};

function finite(value: unknown, fallback?: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = finite(value, fallback) ?? fallback;
  return Math.min(max, Math.max(min, number));
}

function safeUrl(value: unknown) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (url.startsWith("/") || /^https:\/\//i.test(url) || /^blob:/i.test(url)) {
    return url.replace(/["\n\r]/g, "");
  }
  return "";
}

function safeColor(value: unknown) {
  const color = String(value ?? "").trim();
  if (!color) return undefined;
  if (
    /^#[0-9a-f]{3,8}$/i.test(color) ||
    /^rgba?\([\d\s.,%]+\)$/i.test(color) ||
    /^hsla?\([\d\s.,%deg]+\)$/i.test(color) ||
    /^var\(--[a-z0-9-_]+\)$/i.test(color)
  ) {
    return color;
  }
  return undefined;
}

const SHADOWS: Record<string, string> = {
  none: "none",
  sm: "0 4px 14px rgba(15,23,42,.08)",
  md: "0 12px 30px rgba(15,23,42,.12)",
  lg: "0 20px 50px rgba(15,23,42,.16)",
  xl: "0 30px 80px rgba(15,23,42,.22)",
};

const ANIMATIONS: Record<string, Variants> = {
  none: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeUp: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -34 },
    visible: { opacity: 1, x: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 34 },
    visible: { opacity: 1, x: 0 },
  },
  zoom: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1 },
  },
};

function responsiveCss(
  selector: string,
  value: ResponsiveDesign | undefined,
) {
  if (!value) return "";
  const rules: string[] = [];
  const px = (name: string, input: unknown, min = -400, max = 2000) => {
    const n = finite(input);
    if (n !== undefined) rules.push(`${name}:${Math.min(max, Math.max(min, n))}px`);
  };
  const positivePx = (
    name: string,
    input: unknown,
    min = 1,
    max = 2200,
  ) => {
    const n = finite(input);
    if (n !== undefined && n > 0) {
      rules.push(`${name}:${Math.min(max, Math.max(min, n))}px`);
    }
  };

  const width = finite(value.widthPercent);
  if (width !== undefined) {
    rules.push(`width:${Math.min(100, Math.max(10, width))}%`);
    rules.push("margin-inline:auto");
  }
  positivePx("max-width", value.maxWidth, 240, 2200);
  px("min-height", value.minHeight, 0, 1600);
  px("padding-top", value.paddingTop, 0, 400);
  px("padding-right", value.paddingRight, 0, 400);
  px("padding-bottom", value.paddingBottom, 0, 400);
  px("padding-left", value.paddingLeft, 0, 400);
  px("margin-top", value.marginTop, -300, 400);
  px("margin-bottom", value.marginBottom, -300, 400);

  const x = finite(value.translateX);
  const y = finite(value.translateY);
  if (x !== undefined || y !== undefined) {
    rules.push(
      `translate:${Math.min(500, Math.max(-500, x ?? 0))}px ${Math.min(500, Math.max(-500, y ?? 0))}px`,
    );
  }

  if (value.textAlign && ["start", "center", "end"].includes(value.textAlign)) {
    rules.push(`text-align:${value.textAlign}`);
  }

  const title = finite(value.titleSize);
  if (title !== undefined && title > 0) {
    rules.push(`--divsaz-builder-title-size:${Math.min(120, Math.max(12, title))}px`);
  }
  const body = finite(value.bodySize);
  if (body !== undefined && body > 0) {
    rules.push(`--divsaz-builder-body-size:${Math.min(48, Math.max(9, body))}px`);
  }
  const titleWeight = finite(value.titleWeight);
  if (titleWeight !== undefined && titleWeight > 0) {
    rules.push(
      `--divsaz-builder-title-weight:${Math.min(900, Math.max(100, titleWeight))}`,
    );
  }
  const bodyWeight = finite(value.bodyWeight);
  if (bodyWeight !== undefined && bodyWeight > 0) {
    rules.push(
      `--divsaz-builder-body-weight:${Math.min(900, Math.max(100, bodyWeight))}`,
    );
  }
  const titleLineHeight = finite(value.titleLineHeight);
  if (titleLineHeight !== undefined && titleLineHeight > 0) {
    rules.push(
      `--divsaz-builder-title-line-height:${Math.min(160, Math.max(12, titleLineHeight))}px`,
    );
  }
  const bodyLineHeight = finite(value.bodyLineHeight);
  if (bodyLineHeight !== undefined && bodyLineHeight > 0) {
    rules.push(
      `--divsaz-builder-body-line-height:${Math.min(120, Math.max(10, bodyLineHeight))}px`,
    );
  }

  if (!rules.length) return "";
  return `${selector}{${rules.join(";")}}`;
}

export default function BuilderBlockShell({
  blockId,
  design: rawDesign,
  children,
}: {
  blockId: string;
  design?: BlockDesign;
  children: ReactNode;
}) {
  const design = rawDesign || {};
  const safeId = blockId.replace(/[^a-zA-Z0-9_-]/g, "");
  const selector = `[data-builder-block="${safeId}"]`;
  const backgroundImage = safeUrl(design.backgroundImage);
  const backgroundColor = safeColor(design.backgroundColor);
  const textColor = safeColor(design.textColor);
  const borderColor = safeColor(design.borderColor);

  const style: CSSProperties = {
    position: design.position === "sticky" ? "sticky" : "relative",
    top:
      design.position === "sticky"
        ? clamp(design.stickyTop, 0, 300, 0)
        : undefined,
    zIndex: clamp(design.zIndex, 0, 100, 0),
    backgroundColor,
    backgroundImage: backgroundImage
      ? `url("${backgroundImage}")`
      : undefined,
    backgroundSize:
      design.backgroundSize && ["cover", "contain", "auto"].includes(design.backgroundSize)
        ? design.backgroundSize
        : undefined,
    backgroundPosition: design.backgroundPosition || undefined,
    color: textColor,
    borderStyle: finite(design.borderWidth, 0) ? "solid" : undefined,
    borderWidth: clamp(design.borderWidth, 0, 20, 0),
    borderColor,
    borderRadius: clamp(design.radius, 0, 120, 0),
    boxShadow: SHADOWS[design.shadow || "none"] || SHADOWS.none,
    opacity: clamp(design.opacity, 0.1, 1, 1),
    overflow: design.position === "sticky" ? "visible" : "clip",
  };

  const css = [
    `${selector} h1,${selector} h2,${selector} h3{font-size:var(--divsaz-builder-title-size,revert)!important;font-weight:var(--divsaz-builder-title-weight,revert);line-height:var(--divsaz-builder-title-line-height,revert)}`,
    `${selector} p,${selector} li,${selector} a,${selector} button{font-size:var(--divsaz-builder-body-size,revert);font-weight:var(--divsaz-builder-body-weight,revert);line-height:var(--divsaz-builder-body-line-height,revert)}`,
    responsiveCss(selector, design.mobile),
    `@media(min-width:640px){${responsiveCss(selector, design.tablet)}}`,
    `@media(min-width:1024px){${responsiveCss(selector, design.desktop)}}`,
  ].join("");

  const animation = design.animation || "none";
  const duration = clamp(design.animationDuration, 150, 3000, 550) / 1000;

  return (
    <motion.div
      data-builder-block={safeId}
      style={style}
      variants={ANIMATIONS[animation] || ANIMATIONS.none}
      initial={animation === "none" ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
    >
      <style>{css}</style>
      {children}
    </motion.div>
  );
}
