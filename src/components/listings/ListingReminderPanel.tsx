import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { api } from "@/convex/_generated/api";
import { formatArea } from "@/lib/format";
import {
  formatJalaliDate,
  jalaliDateToTimestamp,
  timestampToJalaliString,
  todayJalaliString,
} from "@/lib/jalali";
import { useMutation, useQuery } from "convex/react";
import {
  BellRing,
  CalendarClock,
  ExternalLink,
  Loader2,
  RotateCcw,
  Save,
  Settings2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

function faDate(value: number) {
  return formatJalaliDate(timestampToJalaliString(value));
}

function CandidateCard({
  item,
  onSaved,
}: {
  item: any;
  onSaved: () => void;
}) {
  const setReminders = useMutation(api.reminders.setListingReminders);
  const clearReminders = useMutation(api.reminders.clearListingReminders);
  const [first, setFirst] = useState(() =>
    item.planned?.[0]?.remindAt
      ? timestampToJalaliString(item.planned[0].remindAt)
      : "",
  );
  const [second, setSecond] = useState(() =>
    item.planned?.[1]?.remindAt
      ? timestampToJalaliString(item.planned[1].remindAt)
      : "",
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const firstAt = jalaliDateToTimestamp(first);
    const secondAt = jalaliDateToTimestamp(second);
    if (!firstAt && !secondAt) {
      toast.error("حداقل یک تاریخ یادآوری انتخاب کنید.");
      return;
    }
    setSaving(true);
    try {
      await setReminders({
        listingId: item.listingId,
        firstAt,
        secondAt,
      });
      toast.success("یادآوری‌های آگهی ذخیره شد");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره یادآوری ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setSaving(true);
    try {
      await clearReminders({ listingId: item.listingId });
      setFirst("");
      setSecond("");
      toast.success("یادآوری‌های آگهی پاک شد");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "پاک کردن یادآوری ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-extrabold leading-7">{item.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.city || "—"} · {item.propertyType || "ملک"}
            {item.area != null ? ` · ${formatArea(item.area)}` : ""}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            تاریخ آگهی: {item.dateRaw || item.date || "نامشخص"}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:w-[420px]">
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            یادآوری اول
            <PersianDatePicker
              value={first}
              onChange={setFirst}
              placeholder="انتخاب تاریخ"
            />
          </label>
          <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
            یادآوری دوم
            <PersianDatePicker
              value={second}
              onChange={setSecond}
              placeholder="انتخاب تاریخ"
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="button" size="sm" className="flex-1 gap-1.5" disabled={saving} onClick={() => void save()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              ذخیره یادآوری
            </Button>
            {(first || second) && (
              <Button type="button" size="sm" variant="outline" className="gap-1.5" disabled={saving} onClick={() => void clear()}>
                <RotateCcw className="size-4" />
                پاک کردن
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ListingReminderPanel() {
  const role = useQuery(api.roles.myRole, {});
  const [now, setNow] = useState(() => Date.now());
  const today = useMemo(() => todayJalaliString(), [now]);
  const data = useQuery(api.reminders.listPanel, {
    todayJalali: today,
    now,
  });
  const setSettings = useMutation(api.reminders.setGlobalSettings);
  const [ageDraft, setAgeDraft] = useState("");
  const [daysDraft, setDaysDraft] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  if (!data || !role?.isPrivileged) return null;

  const age = ageDraft || String(data.settings.reminderAgeMonths);
  const days = daysDraft || String(data.settings.reminderVisibleDays);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await setSettings({
        reminderAgeMonths: Number(age),
        reminderVisibleDays: Number(days),
      });
      setAgeDraft("");
      setDaysDraft("");
      setNow(Date.now());
      toast.success("تنظیمات یادآوری ذخیره شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره تنظیمات ناموفق بود");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="size-5 text-primary" />
            <h2 className="font-extrabold">یادآوری پیگیری آگهی‌ها</h2>
          </div>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            آگهی‌هایی که به سن پیگیری رسیده‌اند اینجا برای تعیین دو یادآوری نمایش داده می‌شوند. هر یادآوری از روز سررسید تا {data.settings.reminderVisibleDays.toLocaleString("fa-IR")} روز در بخش پیگیری باقی می‌ماند.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setNow(Date.now())}>
          <RotateCcw className="size-4" />
          بروزرسانی
        </Button>
      </div>

      {role.canManageSite && (
        <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-1.5 text-xs font-bold">
            <span className="flex items-center gap-1.5"><Settings2 className="size-4 text-primary" />سن ورود به پیگیری (ماه)</span>
            <Input
              type="number"
              min={1}
              max={36}
              inputMode="numeric"
              value={age}
              onChange={(event) => setAgeDraft(event.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-xs font-bold">
            مدت نمایش بعد از سررسید (روز)
            <Input
              type="number"
              min={1}
              max={30}
              inputMode="numeric"
              value={days}
              onChange={(event) => setDaysDraft(event.target.value)}
            />
          </label>
          <Button type="button" onClick={() => void saveSettings()} disabled={savingSettings}>
            {savingSettings && <Loader2 className="size-4 animate-spin" />}
            ذخیره تنظیمات
          </Button>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="size-4 text-primary" />
          <h3 className="text-sm font-extrabold">پیگیری‌های سررسیدشده</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            {data.due.length.toLocaleString("fa-IR")}
          </span>
        </div>

        {data.due.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
            امروز پیگیری سررسیدشده‌ای ندارید.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.due.map((item: any) => (
              <article key={String(item.listingId)} className="rounded-2xl border border-primary/25 bg-background p-4 shadow-sm">
                <p className="line-clamp-2 text-sm font-extrabold leading-7">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.city || "—"} · {item.propertyType || "ملک"}
                  {item.area != null ? ` · ${formatArea(item.area)}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.reminders.map((reminder: any) => (
                    <span key={reminder.slot} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                      یادآوری {reminder.slot.toLocaleString("fa-IR")}: {faDate(reminder.remindAt)}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.publicSlug && (
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <Link to={`/listings/${item.publicSlug}`} target="_blank">
                        <ExternalLink className="size-3.5" />
                        صفحه عمومی
                      </Link>
                    </Button>
                  )}
                  {item.divarUrl && (
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <a href={item.divarUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3.5" />
                        لینک منبع
                      </a>
                    </Button>
                  )}
                  {item.phone && (
                    <Button asChild size="sm" className="gap-1.5">
                      <a href={`tel:${item.phone}`} dir="ltr">
                        {item.phone}
                      </a>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-extrabold">
            آگهی‌های حدود {data.settings.reminderAgeMonths.toLocaleString("fa-IR")} ماه قبل
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
            {data.candidates.length.toLocaleString("fa-IR")}
          </span>
        </div>

        {data.candidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
            آگهی واجد شرایط جدیدی در این بازه پیدا نشد.
          </div>
        ) : (
          <div className="space-y-3">
            {data.candidates.map((item: any) => (
              <CandidateCard
                key={String(item.listingId)}
                item={item}
                onSaved={() => setNow(Date.now())}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
