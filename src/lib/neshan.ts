/**
 * لینک‌های عمومی نشان. این فایل عمداً هیچ کلید خصوصی نگه نمی‌دارد.
 * کلید Web SDK نشان در تنظیمات مدیر قابل تغییر است و VITE_NESHAN_MAP_KEY
 * فقط fallback محیطی است. Web SDK key در مرورگر قابل مشاهده است؛ آن را
 * در پنل نشان به دامنه‌های واقعی سایت محدود کنید.
 */
export function neshanLocationUrl(lat: number, lng: number, zoom = 16) {
  return `https://neshan.org/maps/@${lat},${lng},${zoom}.0z,0.0p`;
}

export function neshanAppLocationUrl(lat: number, lng: number) {
  return `https://nshn.ir/?lat=${lat}&lng=${lng}`;
}

export function neshanSearchUrl(query: string) {
  const value = query.trim();
  return value
    ? `https://neshan.org/maps/search/${encodeURIComponent(value)}`
    : "https://neshan.org/maps";
}

export function listingNeshanUrl(input: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
}) {
  if (input.latitude != null && input.longitude != null) {
    return neshanAppLocationUrl(input.latitude, input.longitude);
  }
  return neshanSearchUrl(input.address || input.city || "شهریار");
}
