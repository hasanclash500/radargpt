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

function validMapCoordinates(lat: number, lng: number): MapCoordinates | null {
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

function numericPair(latValue: string | null, lngValue: string | null) {
  if (!latValue || !lngValue) return null;
  return validMapCoordinates(Number(latValue), Number(lngValue));
}

/**
 * مختصات را از لینک‌های کامل نشان، OpenStreetMap و Google Maps استخراج می‌کند.
 * لینک‌های کوتاه redirect-based بدون درخواست شبکه قابل تبدیل قطعی نیستند.
 */
export function parseMapCoordinates(value: string): MapCoordinates | null {
  const raw = value.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const direct = numericPair(
      url.searchParams.get("lat") ?? url.searchParams.get("mlat"),
      url.searchParams.get("lng") ??
        url.searchParams.get("lon") ??
        url.searchParams.get("mlon"),
    );
    if (direct) return direct;

    for (const key of ["q", "query", "ll", "center"]) {
      const combined = url.searchParams.get(key);
      if (!combined) continue;
      const match = combined.match(
        /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,،]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/,
      );
      if (!match) continue;
      const point = validMapCoordinates(Number(match[1]), Number(match[2]));
      if (point) return point;
    }
  } catch {
    // ورودی ممکن است URL کامل نباشد؛ regexهای پایین را امتحان می‌کنیم.
  }

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw.replace(/\+/g, "%20"));
  } catch {
    // URL ناقص است؛ همان متن خام بررسی می‌شود.
  }

  const atMatch = decoded.match(
    /\/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:[,/?#]|$)/,
  );
  if (atMatch) {
    const point = validMapCoordinates(Number(atMatch[1]), Number(atMatch[2]));
    if (point) return point;
  }

  const pairMatch = decoded.match(
    /(?:^|[?&#=/\s])(-?\d{1,2}\.\d+)\s*[,،]\s*(-?\d{1,3}\.\d+)(?:$|[?&#=/\s,])/,
  );
  if (pairMatch) {
    return validMapCoordinates(Number(pairMatch[1]), Number(pairMatch[2]));
  }

  return null;
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
