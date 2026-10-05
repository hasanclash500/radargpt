import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import {
  DIVSAZ_THEMES,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  isDivosazTheme,
  readLocalTheme,
  writeLocalTheme,
  type DivosazTheme,
} from "@/lib/theme-preference";
import { useQuery } from "convex/react";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * هر کاربر تم خودش را روی همان مرورگر انتخاب می‌کند.
 * ترتیب دکمه: سرمه‌ای ← سبز تیره ← روشن.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const settings = useQuery(api.folders.getSettings, {});
  const [currentId, setCurrentId] = useState<DivosazTheme>(
    () => readLocalTheme() ?? "navy",
  );

  useEffect(() => {
    const local = readLocalTheme();
    if (local) {
      setCurrentId(local);
      return;
    }
    if (isDivosazTheme(settings?.siteTheme)) {
      setCurrentId(settings.siteTheme);
    }
  }, [settings?.siteTheme]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const custom = event as CustomEvent<DivosazTheme>;
      if (isDivosazTheme(custom.detail)) setCurrentId(custom.detail);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      if (isDivosazTheme(event.newValue)) setCurrentId(event.newValue);
    };
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const currentIndex = Math.max(
    0,
    DIVSAZ_THEMES.findIndex((theme) => theme.id === currentId),
  );
  const current = DIVSAZ_THEMES[currentIndex] ?? DIVSAZ_THEMES[0];
  const next = DIVSAZ_THEMES[(currentIndex + 1) % DIVSAZ_THEMES.length];
  const Icon = current.mode === "light" ? Sun : Moon;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`تغییر تم؛ تم فعلی ${current.label}`}
      title={`تم فعلی: ${current.label} · بعدی: ${next.label}`}
      className={`size-9 ${className ?? ""}`}
      onClick={() => {
        writeLocalTheme(next.id);
        setCurrentId(next.id);
      }}
    >
      <Icon className="size-4" />
    </Button>
  );
}
