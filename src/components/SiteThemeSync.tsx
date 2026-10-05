import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function SiteThemeSync() {
  const settings = useQuery(api.folders.getSettings, {});
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!settings) return;
    const siteTheme = settings.siteTheme || "navy";
    document.documentElement.dataset.siteTheme = siteTheme;
    setTheme(siteTheme === "light" ? "light" : "dark");
  }, [settings?.siteTheme, setTheme]);

  return null;
}
