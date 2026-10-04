import type { Listing } from "./parser";

export type SortKey =
  | "date-desc"
  | "date-asc"
  | "price-desc"
  | "price-asc"
  | "area-desc"
  | "area-asc";

export interface Filters {
  query: string;
  city: string;
  deal: string;
  property: string;
  rooms: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
  /** بازهٔ تاریخ ثبت (YYYY-MM-DD) */
  dateFrom: string;
  dateTo: string;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = {
  query: "",
  city: "همه",
  deal: "همه",
  property: "همه",
  rooms: "همه",
  priceMin: "",
  priceMax: "",
  areaMin: "",
  areaMax: "",
  dateFrom: "",
  dateTo: "",
  sort: "date-desc",
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc", label: "جدیدترین تاریخ" },
  { value: "date-asc", label: "قدیمی‌ترین تاریخ" },
  { value: "price-desc", label: "گران‌ترین قیمت" },
  { value: "price-asc", label: "ارزان‌ترین قیمت" },
  { value: "area-desc", label: "بزرگ‌ترین متراژ" },
  { value: "area-asc", label: "کوچک‌ترین متراژ" },
];

export const ROOMS_OPTIONS: { value: string; label: string }[] = [
  { value: "همه", label: "همه تعداد اتاق‌ها" },
  { value: "0", label: "بدون خواب" },
  { value: "1", label: "۱ خواب" },
  { value: "2", label: "۲ خواب" },
  { value: "3", label: "۳ خواب" },
  { value: "4+", label: "۴ خواب و بیشتر" },
];

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function num(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(normalizeDigits(value).replace(/[,،٬\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function moneyMillion(value: string): number | null {
  const raw = normalizeDigits(value)
    .trim()
    .toLowerCase()
    .replace(/تومان|تومن/g, "")
    .trim();
  if (!raw) return null;
  const hasBillion = /میلیارد/.test(raw);
  const hasMillion = /میلیون/.test(raw);
  const n = Number(
    raw
      .replace(/میلیارد|میلیون/g, "")
      .replace(/[,،٬\s]/g, "")
      .replace(/٫/g, "."),
  );
  if (!Number.isFinite(n) || n < 0) return null;
  if (hasBillion) return n * 1000;
  if (hasMillion) return n;
  if (n >= 1_000_000) return n / 1_000_000;
  return n;
}

/**
 * نرمال‌سازی ورودی بازهٔ تاریخ ثبت به شکل صفرپرشده و مرتب‌سازی‌پذیر `YYYY-MM-DD`
 * (تقویم شمسی). ورودی‌های معتبر: `1404/7/1`، `1404-7-1`، `۱۴۰۴/۰۷/۰۱`.
 */
export function normalizeDateInput(value: string): string {
  const s = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .trim()
    .replace(/[/\-.]/g, "-");
  const parts = s.split("-").filter(Boolean);
  if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) return "";
  const [y, mo, d] = parts;
  if (y.length < 3 || y.length > 4 || mo.length > 2 || d.length > 2) return "";
  return `${y.padStart(4, "0")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function matchesRooms(listing: Listing, rooms: string): boolean {
  if (rooms === "همه") return true;
  if (listing.rooms === null) return false;
  if (rooms === "4+") return listing.rooms >= 4;
  return listing.rooms === Number(rooms);
}

/** اعمال جستجو، فیلترها و مرتب‌سازی روی لیست آگهی‌ها. */
export function applyFilters(listings: Listing[], f: Filters): Listing[] {
  const q = f.query.trim().toLowerCase();
  const pMin = moneyMillion(f.priceMin);
  const pMax = moneyMillion(f.priceMax);
  const aMin = num(f.areaMin);
  const aMax = num(f.areaMax);

  const filtered = listings.filter((l) => {
    if (f.city !== "همه" && l.city !== f.city) return false;
    if (f.deal !== "همه" && l.dealType !== f.deal) return false;
    if (f.property !== "همه" && l.propertyType !== f.property) return false;
    if (!matchesRooms(l, f.rooms)) return false;
    if (pMin !== null || pMax !== null) {
      if (!l.priceMillion || l.priceMillion <= 0) return false;
      if (pMin !== null && l.priceMillion < pMin) return false;
      if (pMax !== null && l.priceMillion > pMax) return false;
    }
    if (aMin !== null && (l.area === null || l.area < aMin)) return false;
    if (aMax !== null && (l.area === null || l.area > aMax)) return false;
    // تاریخ ثبت؛ تاریخ نامشخص با هر بازه‌ای سازگار نیست
    if (f.dateFrom && (!l.date || l.date < f.dateFrom)) return false;
    if (f.dateTo && (!l.date || l.date > f.dateTo)) return false;
    if (q) {
      const haystack = `${l.city} ${l.title} ${l.description} ${l.radarCode} ${l.phone} ${l.dealType} ${l.propertyType}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const dir = f.sort.endsWith("asc") ? 1 : -1;
  const key = f.sort.split("-")[0];

  filtered.sort((a, b) => {
    if (key === "price") {
      const av = a.priceMillion > 0 ? a.priceMillion : null;
      const bv = b.priceMillion > 0 ? b.priceMillion : null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * dir;
    }
    if (key === "area")
      return ((a.area ?? -1) - (b.area ?? -1)) * dir;
    // تاریخ: خالی‌ها همیشه انتها
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date) * dir;
  });

  return filtered;
}

/** آیا فیلتری غیر از پیش‌فرض فعال است؟ */
export function hasActiveFilters(f: Filters): boolean {
  return (
    f.query.trim() !== "" ||
    f.city !== "همه" ||
    f.deal !== "همه" ||
    f.property !== "همه" ||
    f.rooms !== "همه" ||
    f.priceMin !== "" ||
    f.priceMax !== "" ||
    f.areaMin !== "" ||
    f.areaMax !== "" ||
    f.dateFrom !== "" ||
    f.dateTo !== ""
  );
}
