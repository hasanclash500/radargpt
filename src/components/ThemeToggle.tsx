import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Moon, Palette, Sun } from "lucide-react";
import { toast } from "sonner";

const THEMES = [
  { id: "navy" as const, label: "سرمه‌ای دیوساز", icon: Moon },
  { id: "emerald" as const, label: "سبز تیره", icon: Moon },
  { id: "light" as const, label: "روشن", icon: Sun },
];

/**
 * تم سایت سراسری است و فقط مدیر آن را تغییر می‌دهد.
 * کاربران عادی همان تم انتخاب‌شده توسط مدیر را می‌بینند.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const settings = useQuery(api.folders.getSettings, {});
  const role = useQuery(api.roles.myRole, {});
  const updateSettings = useMutation(api.folders.updateSettings);

  const currentId = (settings?.siteTheme ?? "navy") as
    | "navy"
    | "emerald"
    | "light";
  const currentIndex = Math.max(
    0,
    THEMES.findIndex((theme) => theme.id === currentId),
  );
  const current = THEMES[currentIndex] ?? THEMES[0];
  const Icon = current.icon;
  const canChange = role?.role === "manager";

  const cycle = async () => {
    if (!canChange) return;
    const next = THEMES[(currentIndex + 1) % THEMES.length];
    try {
      await updateSettings({ siteTheme: next.id });
      toast.success("تم سایت تغییر کرد", {
        description: next.label,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تغییر تم انجام نشد",
      );
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={
        canChange
          ? "تغییر تم سراسری سایت"
          : `تم سایت: ${current.label}`
      }
      title={
        canChange
          ? `تم فعلی: ${current.label} — برای تم بعدی کلیک کنید`
          : `تم سایت توسط مدیر تنظیم شده: ${current.label}`
      }
      className={`size-9 ${className ?? ""}`}
      onClick={() => void cycle()}
    >
      {canChange ? (
        <span className="relative">
          <Icon className="size-4" />
          <Palette className="absolute -bottom-1 -end-1 size-2.5 rounded-full bg-background" />
        </span>
      ) : (
        <Icon className="size-4" />
      )}
    </Button>
  );
}
