export type DivosazTheme = "navy" | "emerald" | "light";

export const THEME_STORAGE_KEY = "divsaz-local-theme";
export const THEME_CHANGE_EVENT = "divsaz-theme-change";

export const DIVSAZ_THEMES: Array<{
  id: DivosazTheme;
  label: string;
  mode: "dark" | "light";
}> = [
  { id: "navy", label: "سرمه‌ای دیوساز", mode: "dark" },
  { id: "emerald", label: "سبز تیره", mode: "dark" },
  { id: "light", label: "روشن", mode: "light" },
];

export function isDivosazTheme(value: unknown): value is DivosazTheme {
  return value === "navy" || value === "emerald" || value === "light";
}

export function readLocalTheme(): DivosazTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isDivosazTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeLocalTheme(theme: DivosazTheme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage may be unavailable in privacy-restricted environments.
  }
  window.dispatchEvent(
    new CustomEvent<DivosazTheme>(THEME_CHANGE_EVENT, { detail: theme }),
  );
}

export function themeMode(theme: DivosazTheme): "dark" | "light" {
  return theme === "light" ? "light" : "dark";
}
