import { toEnglishDigits } from "./parser";

export type SearchableListingFields = {
  radarCode?: string;
  city?: string;
  neighborhood?: string;
  title?: string;
  description?: string;
  phone?: string;
  dealType?: string;
  propertyType?: string;
  address?: string;
};

export function listingSearchText(row: SearchableListingFields) {
  const parts = [
    row.radarCode,
    row.city,
    row.neighborhood,
    row.title,
    row.description,
    row.phone,
    row.dealType,
    row.propertyType,
    row.address,
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());

  const raw = parts.join(" ");
  const latinDigits = toEnglishDigits(raw);

  return Array.from(new Set([raw, latinDigits]))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}
