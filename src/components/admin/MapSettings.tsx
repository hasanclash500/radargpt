import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Map,
  Power,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function MapSettings() {
  const status = useQuery(api.folders.getMapAdminSettings, {});
  const saveSettings = useMutation(api.folders.updateMapSettings);

  const [provider, setProvider] = useState<"neshan" | "osm">("neshan");
  const [neshanEnabled, setNeshanEnabled] = useState(true);
  const [osmEnabled, setOsmEnabled] = useState(true);
  const [keyDraft, setKeyDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [clearKey, setClearKey] = useState(false);

  useEffect(() => {
    if (!status?.allowed) return;
    setProvider(status.provider === "osm" ? "osm" : "neshan");
    setNeshanEnabled(status.neshanMapEnabled ?? true);
    setOsmEnabled(status.osmMapEnabled ?? true);
  }, [
    status?.allowed,
    status?.provider,
    status?.neshanMapEnabled,
    status?.osmMapEnabled,
  ]);

  if (!status?.allowed) return null;

  const toggleNeshan = (checked: boolean) => {
    if (!checked && !osmEnabled) {
      toast.error("حداقل یکی از نقشه‌ها باید فعال باشد");
      return;
    }
    setNeshanEnabled(checked);
    if (!checked && provider === "neshan") setProvider("osm");
  };

  const toggleOsm = (checked: boolean) => {
    if (!checked && !neshanEnabled) {
      toast.error("حداقل یکی از نقشه‌ها باید فعال باشد");
      return;
    }
    setOsmEnabled(checked);
    if (!checked && provider === "osm") setProvider("neshan");
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveSettings({
        provider,
        neshanMapKey: keyDraft.trim() || undefined,
        clearNeshanMapKey: clearKey,
        neshanMapEnabled: neshanEnabled,
        osmMapEnabled: osmEnabled,
      });
      setKeyDraft("");
      setClearKey(false);
      toast.success("تنظیمات نقشه ذخیره شد");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ذخیره تنظیمات نقشه ناموفق بود",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Map className="size-5 text-primary" />
          نقشه و موقعیت ملک
        </CardTitle>
        <CardDescription>
          هر سرویس را می‌توانید مستقل برای کل سایت فعال یا غیرفعال کنید. سرویس
          غیرفعال از انتخاب‌گر نقشه و گزینه‌های مسیریابی کاربران حذف می‌شود.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div
            className={
              "rounded-2xl border p-4 transition-colors " +
              (provider === "neshan" && neshanEnabled
                ? "border-primary bg-primary/8"
                : "border-border")
            }
          >
            <button
              type="button"
              disabled={!neshanEnabled}
              onClick={() => setProvider("neshan")}
              className="w-full text-right disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Map className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-black">نشان</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    انتخاب اول برای کاربران داخل ایران
                  </p>
                </div>
              </div>
            </button>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
              <Label htmlFor="neshan-map-enabled" className="text-xs font-bold">
                نمایش نشان در سایت
              </Label>
              <Switch
                id="neshan-map-enabled"
                checked={neshanEnabled}
                onCheckedChange={toggleNeshan}
                aria-label="فعال یا غیرفعال کردن نشان"
              />
            </div>
          </div>

          <div
            className={
              "rounded-2xl border p-4 transition-colors " +
              (provider === "osm" && osmEnabled
                ? "border-primary bg-primary/8"
                : "border-border")
            }
          >
            <button
              type="button"
              disabled={!osmEnabled}
              onClick={() => setProvider("osm")}
              className="w-full text-right disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Map className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-black">OpenStreetMap</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    بدون API Key و مناسب به‌عنوان fallback
                  </p>
                </div>
              </div>
            </button>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
              <Label htmlFor="osm-map-enabled" className="text-xs font-bold">
                نمایش OpenStreetMap در سایت
              </Label>
              <Switch
                id="osm-map-enabled"
                checked={osmEnabled}
                onCheckedChange={toggleOsm}
                aria-label="فعال یا غیرفعال کردن OpenStreetMap"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-border/70 bg-muted/20 p-3 text-[11px] leading-6 text-muted-foreground">
          <Power className="mt-1 size-4 shrink-0 text-primary" />
          <p>
            نقشه پیش‌فرض فعلی:{" "}
            <strong className="text-foreground">
              {provider === "neshan" ? "نشان" : "OpenStreetMap"}
            </strong>
            . حداقل یک سرویس باید فعال بماند.
          </p>
        </div>

        <div
          className={
            "rounded-2xl border border-border/70 bg-muted/20 p-4 " +
            (!neshanEnabled ? "opacity-70" : "")
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              <strong className="text-sm">کلید Web SDK نشان</strong>
            </div>
            {status.neshanConfigured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                <CheckCircle2 className="size-3.5" />
                ثبت شده
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                ثبت نشده
              </span>
            )}
          </div>

          {!neshanEnabled && (
            <p className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-300">
              نشان فعلاً در سایت غیرفعال است؛ کلید برای استفاده بعدی حفظ می‌شود.
            </p>
          )}

          {status.neshanConfigured && status.keyHint && (
            <p dir="ltr" className="mt-2 text-xs text-muted-foreground">
              Current: {status.keyHint}
            </p>
          )}

          <div className="mt-3 space-y-1.5">
            <Label htmlFor="neshan-map-key" className="text-xs">
              {status.neshanConfigured
                ? "برای تعویض کلید، کلید جدید را وارد کنید"
                : "کلید نشان را وارد کنید"}
            </Label>
            <Input
              id="neshan-map-key"
              dir="ltr"
              type="password"
              autoComplete="off"
              value={keyDraft}
              disabled={clearKey}
              onChange={(event) => {
                setKeyDraft(event.target.value);
                setClearKey(false);
              }}
              placeholder={
                status.neshanConfigured
                  ? "کلید قبلی حفظ می‌شود مگر کلید جدید وارد کنید"
                  : "Neshan Web SDK key"
              }
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {status.neshanConfigured && (
              <Button
                type="button"
                size="sm"
                variant={clearKey ? "destructive" : "outline"}
                className="gap-1.5"
                onClick={() => {
                  setClearKey((current) => !current);
                  setKeyDraft("");
                }}
              >
                <Trash2 className="size-3.5" />
                {clearKey ? "حذف کلید هنگام ذخیره" : "حذف کلید"}
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
            <ShieldCheck className="mt-1 size-4 shrink-0 text-amber-600" />
            کلید Web SDK برای نمایش نقشه در مرورگر استفاده می‌شود و در سمت
            کاربر قابل مشاهده است. در پنل نشان، کلید را به دامنه‌های واقعی سایت
            محدود کنید و از کلیدهای دارای دسترسی حساس سروری استفاده نکنید.
          </p>
        </div>

        <Button
          type="button"
          className="gap-2"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Map className="size-4" />}
          {saving ? "در حال ذخیره…" : "ذخیره تنظیمات نقشه"}
        </Button>
      </CardContent>
    </Card>
  );
}
