import { api } from "@/convex/_generated/api";
import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  isDivosazTheme,
  readLocalTheme,
  themeMode,
  type DivosazTheme,
} from "@/lib/theme-preference";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect } from "react";

/**
 * تم انتخابی هر کاربر روی همان مرورگر ذخیره می‌شود.
 * تنظیم مدیر فقط برای کاربری استفاده می‌شود که هنوز تم شخصی انتخاب نکرده باشد.
 */
export default function SiteThemeSync() {
  const settings = useQuery(api.folders.getSettings, {});
  const { setTheme } = useTheme();

  const apply = useCallback(
    (theme: DivosazTheme) => {
      document.documentElement.dataset.siteTheme = theme;
      setTheme(themeMode(theme));
    },
    [setTheme],
  );

  useEffect(() => {
    const local = readLocalTheme();
    if (local) apply(local);
  }, [apply]);

  useEffect(() => {
    if (!settings) return;
    const local = readLocalTheme();
    if (local) {
      apply(local);
      return;
    }
    const fallback = isDivosazTheme(settings.siteTheme)
      ? settings.siteTheme
      : "navy";
    apply(fallback);
  }, [apply, settings?.siteTheme]);

  useEffect(() => {
    const handleLocalChange = (event: Event) => {
      const custom = event as CustomEvent<DivosazTheme>;
      if (isDivosazTheme(custom.detail)) apply(custom.detail);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      if (isDivosazTheme(event.newValue)) {
        apply(event.newValue);
        return;
      }
      const fallback = isDivosazTheme(settings?.siteTheme)
        ? settings.siteTheme
        : "navy";
      apply(fallback);
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleLocalChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleLocalChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [apply, settings?.siteTheme]);

  return null;
}
