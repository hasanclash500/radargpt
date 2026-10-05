import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import {
  getInstalledModules,
  getModuleAdminPanels,
} from "@/modules";
import { PLANNED_MODULE_IDS } from "@/modules/registry";
import { useMutation, useQuery } from "convex/react";
import {
  Blocks,
  CheckCircle2,
  CircleDashed,
  CreditCard,
  MessageSquareText,
  Puzzle,
} from "lucide-react";
import { toast } from "sonner";

const CAPABILITY_LABELS: Record<string, string> = {
  "auth-provider": "ورود و احراز هویت",
  "listing-payment": "پرداخت آگهی",
  "notification-channel": "اعلان",
  "dashboard-widget": "ویجت داشبورد",
  "admin-panel": "پنل مدیریت",
  "public-route": "صفحه عمومی",
};

export default function ModuleManager() {
  const settings = useQuery(api.folders.getSettings, {});
  const updateSettings = useMutation(api.folders.updateSettings);
  const installed = getInstalledModules();
  const enabledIds = settings?.enabledModules ?? [];
  const enabled = new Set(enabledIds);
  const panels = getModuleAdminPanels(enabledIds);

  const toggle = async (id: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...enabledIds, id]))
      : enabledIds.filter((value) => value !== id);
    try {
      await updateSettings({ enabledModules: next });
      toast.success(checked ? "ماژول فعال شد" : "ماژول غیرفعال شد");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تغییر وضعیت ماژول ناموفق بود",
      );
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Blocks className="size-5 text-primary" />
            ماژول‌های اختیاری دیوساز
          </CardTitle>
          <CardDescription className="leading-6">
            ماژول‌ها مستقل از هسته سایت نصب می‌شوند. فعال یا غیرفعال کردن یک
            ماژول نباید ساختار آگهی‌ها، کاربران یا صفحات اصلی را تغییر دهد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {installed.length > 0 ? (
            installed.map((module) => (
              <div
                key={module.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Puzzle className="size-4 text-primary" />
                    <strong className="text-sm">{module.label}</strong>
                    <span
                      dir="ltr"
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      v{module.version}
                    </span>
                    {enabled.has(module.id) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-3" />
                        فعال
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {module.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="rounded-full border border-border/70 px-2 py-1 text-[10px] text-muted-foreground"
                      >
                        {CAPABILITY_LABELS[capability] ?? capability}
                      </span>
                    ))}
                  </div>
                </div>

                <label className="flex shrink-0 items-center gap-2 text-xs font-bold">
                  فعال
                  <Switch
                    checked={enabled.has(module.id)}
                    onCheckedChange={(checked) =>
                      void toggle(module.id, checked)
                    }
                  />
                </label>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-5 text-center">
              <Puzzle className="mx-auto size-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-bold">
                هنوز ماژول اختیاری نصب نشده است
              </p>
              <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-muted-foreground">
                هسته آماده است؛ ماژول جدید در پوشه مستقل خودش ساخته و از یک
                نقطه واحد به رجیستری دیوساز اضافه می‌شود.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareText className="size-5 text-primary" />
              ورود و ثبت‌نام پیامکی
            </CardTitle>
            <CardDescription>
              شناسه برنامه‌ریزی‌شده: <span dir="ltr">{PLANNED_MODULE_IDS.SMS_AUTH}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CircleDashed className="size-4" />
              آماده اتصال به ارائه‌دهنده پیامک در یک ماژول مستقل
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-5 text-primary" />
              پرداخت برای ثبت آگهی
            </CardTitle>
            <CardDescription>
              شناسه برنامه‌ریزی‌شده: <span dir="ltr">{PLANNED_MODULE_IDS.LISTING_PAYMENT}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CircleDashed className="size-4" />
              آماده اتصال به درگاه پرداخت بدون وابسته کردن فرم آگهی به یک بانک خاص
            </div>
          </CardContent>
        </Card>
      </div>

      {panels.length > 0 && (
        <section className="space-y-3">
          {panels.map((panel) => {
            const Panel = panel.component;
            return (
              <div key={panel.moduleId + ":" + panel.id}>
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Blocks className="size-3.5" />
                  {panel.moduleLabel} · {panel.label}
                </div>
                <Panel />
              </div>
            );
          })}
        </section>
      )}

      <Button type="button" variant="outline" disabled className="hidden">
        محل رزرو برای عملیات نصب ماژول
      </Button>
    </div>
  );
}
