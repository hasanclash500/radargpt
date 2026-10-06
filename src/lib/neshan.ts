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

export type MapCoordinates = { lat: number; lng: number };

function validCoordinates(lat: number, lng: number): MapCoordinates | null {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }
  return { lat, lng };
}

/**
 * مختصات را از لینک‌های رایج نقشه استخراج می‌کند تا فایل‌های CSV/Excel/JSON
 * هنگام ورود، لوکیشن ثبت‌شده را از دست ندهند.
 */
export function parseMapCoordinates(value?: string | null): MapCoordinates | null {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);

    const latParam = url.searchParams.get("lat") ?? url.searchParams.get("mlat");
    const lngParam =
      url.searchParams.get("lng") ??
      url.searchParams.get("lon") ??
      url.searchParams.get("mlon");
    if (latParam && lngParam) {
      const parsed = validCoordinates(Number(latParam), Number(lngParam));
      if (parsed) return parsed;
    }

    for (const key of ["q", "query", "destination", "daddr"]) {
      const pair = url.searchParams.get(key)?.match(
        /(-?\d{1,2}(?:\.\d+)?)\s*[,،]\s*(-?\d{1,3}(?:\.\d+)?)/,
      );
      if (pair) {
        const parsed = validCoordinates(Number(pair[1]), Number(pair[2]));
        if (parsed) return parsed;
      }
    }
  } catch {
    // بعضی ورودی‌ها لینک کامل نیستند؛ الگوهای متنی پایین همچنان بررسی می‌شوند.
  }

  const atPair = raw.match(
    /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
  );
  if (atPair) {
    const parsed = validCoordinates(Number(atPair[1]), Number(atPair[2]));
    if (parsed) return parsed;
  }

  const genericPair = raw.match(
    /(?:lat(?:itude)?|عرض)\s*[=:]\s*(-?\d{1,2}(?:\.\d+)?)[^\d-]+(?:lng|lon(?:gitude)?|طول)\s*[=:]\s*(-?\d{1,3}(?:\.\d+)?)/i,
  );
  return genericPair
    ? validCoordinates(Number(genericPair[1]), Number(genericPair[2]))
    : null;
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
