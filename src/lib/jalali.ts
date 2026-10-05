const JALALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
  1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
];

const div = (a: number, b: number) => Math.trunc(a / b);
const mod = (a: number, b: number) => a - Math.trunc(a / b) * b;

function jalCal(jy: number, withoutLeap = false) {
  const bl = JALALI_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JALALI_BREAKS[0];
  let jm = 0;
  let jump = 0;

  if (jy < jp || jy >= JALALI_BREAKS[bl - 1]) {
    throw new Error("سال شمسی خارج از محدوده پشتیبانی است.");
  }

  for (let i = 1; i < bl; i += 1) {
    jm = JALALI_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG =
    div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (withoutLeap) return { gy, march, leap: 0 };

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    div(
      (gy + div(gm - 8, 6) + 100100) * 1461,
      4,
    ) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d =
    d -
    div(
      div(gy + 100100 + div(gm - 8, 6), 100) * 3,
      4,
    ) +
    752;
  return d;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j =
    j +
    div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 -
    3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy, true);
  return (
    g2d(r.gy, 3, r.march) +
    (jm - 1) * 31 -
    div(jm, 7) * (jm - 7) +
    jd -
    1
  );
}

function d2j(jdn: number) {
  const g = d2g(jdn);
  let jy = g.gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(g.gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return {
        jy,
        jm: 1 + div(k, 31),
        jd: mod(k, 31) + 1,
      };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }

  return {
    jy,
    jm: 7 + div(k, 30),
    jd: mod(k, 30) + 1,
  };
}

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export const PERSIAN_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

export function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)),
    );
}

export function faNumber(value: number | string) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

export function normalizeJalaliDate(value: string): string {
  const raw = toEnglishDigits(value)
    .trim()
    .replace(/[/\-.]/g, "-");
  const parts = raw.split("-").filter(Boolean);
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) {
    return "";
  }

  const [yRaw, mRaw, dRaw] = parts;
  const year = Number(yRaw);
  const month = Number(mRaw);
  const day = Number(dRaw);
  if (
    yRaw.length < 3 ||
    yRaw.length > 4 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > jalaliMonthLength(year, month)
  ) {
    return "";
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function jalaliMonthLength(year: number, month: number) {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return jalCal(year).leap === 0 ? 30 : 29;
}

export function jalaliToGregorian(year: number, month: number, day: number) {
  return d2g(j2d(year, month, day));
}

export function gregorianToJalali(year: number, month: number, day: number) {
  return d2j(g2d(year, month, day));
}

export function jalaliStringToGregorian(value: string) {
  const normalized = normalizeJalaliDate(value);
  if (!normalized) return null;
  const [jy, jm, jd] = normalized.split("-").map(Number);
  return jalaliToGregorian(jy, jm, jd);
}

export function jalaliDateToTimestamp(
  value: string,
  time = "00:00",
): number | undefined {
  const g = jalaliStringToGregorian(value);
  if (!g) return undefined;
  const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const iso = `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}T${safeTime}:00+03:30`;
  const timestamp = new Date(iso).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function timestampToJalali(timestamp: number | Date) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function timestampToJalaliString(timestamp: number | Date) {
  const j = timestampToJalali(timestamp);
  return `${String(j.year).padStart(4, "0")}-${String(j.month).padStart(2, "0")}-${String(j.day).padStart(2, "0")}`;
}

export function todayJalaliString() {
  return timestampToJalaliString(new Date());
}

export function formatJalaliDate(value: string, includeWeekday = false) {
  const normalized = normalizeJalaliDate(value);
  if (!normalized) return value;
  const [year, month, day] = normalized.split("-").map(Number);
  const base = `${faNumber(day)} ${JALALI_MONTHS[month - 1]} ${faNumber(year)}`;
  if (!includeWeekday) return base;

  const g = jalaliToGregorian(year, month, day);
  const weekday = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    timeZone: "Asia/Tehran",
  }).format(new Date(Date.UTC(g.gy, g.gm - 1, g.gd, 12)));
  return `${weekday}، ${base}`;
}

export function weekdayIndexSaturdayFirst(
  year: number,
  month: number,
  day: number,
) {
  const g = jalaliToGregorian(year, month, day);
  const weekday = new Date(Date.UTC(g.gy, g.gm - 1, g.gd, 12)).getUTCDay();
  return (weekday + 1) % 7;
}

export function timestampToTehranTime(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(timestamp));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}
