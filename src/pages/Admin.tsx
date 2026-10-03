import { ThemeToggle } from "@/components/ThemeToggle";
import IntegrationSettings from "@/components/admin/IntegrationSettings";
import LeadInbox from "@/components/admin/LeadInbox";
import ListingFieldConfigManager from "@/components/admin/ListingFieldConfigManager";
import UserManagement from "@/components/admin/UserManagement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { faNum } from "@/lib/format";
import {
  DEFAULT_LISTING_FIELD_CONFIGS,
  type ListingFieldConfig,
} from "@/lib/listing-field-config";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  CheckCircle2,
  CloudDownload,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  manager: "مدیر",
  admin: "ادمین",
  consultant: "مشاور",
  user: "کاربر",
  guest: "مهمان",
};

function Stamp({ value }: { value: number | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">هنوز اجرا نشده</span>;
  return (
    <span suppressHydrationWarning>
      {new Date(value).toLocaleString("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </span>
  );
}

export default function Admin() {
  const access = useQuery(api.ingest.myAccess, {});
  const settings = useQuery(api.folders.getSettings, {});
  const status = useQuery(api.ingest.importStatus, {});
  const folders = useQuery(api.folders.listFolders, {});

  const updateSettings = useMutation(api.folders.updateSettings);
  const ensureProfile = useMutation(api.roles.ensureProfile);
  const createFolder = useMutation(api.folders.createFolder);
  const deleteFolder = useMutation(api.folders.deleteFolder);
  const importNow = useAction(api.ingest.importNow);

  const ensuredRef = useRef(false);
  useEffect(() => {
    if (access === undefined || ensuredRef.current) return;
    ensuredRef.current = true;
    ensureProfile().catch(() => undefined);
  }, [access, ensureProfile]);

  const role = access?.role ?? "guest";
  const isManager = access?.isManager ?? role === "manager";
  const canManageListings =
    access?.canManageListings ?? role === "manager" || role === "admin";

  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [newCity, setNewCity] = useState("");
  const [newDeal, setNewDeal] = useState("");
  const [newType, setNewType] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [sourceDraft, setSourceDraft] = useState<{
    sourceUrl: string;
    officeName: string;
    managerPhone: string;
    shareFooter: string;
  } | null>(null);

  const draft = sourceDraft ?? {
    sourceUrl: "",
    officeName: "",
    managerPhone: "",
    shareFooter: "",
  };

  if (settings && !hydrated) {
    setHydrated(true);
    setSourceDraft({
      sourceUrl: settings.sourceUrl ?? "",
      officeName: settings.officeName ?? "",
      managerPhone: settings.managerPhone ?? "",
      shareFooter: settings.shareFooter ?? "",
    });
  }

  async function saveSource() {
    setSaving(true);
    try {
      await updateSettings({ sourceUrl: draft.sourceUrl.trim() });
      toast.success("منبع آگهی ذخیره شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  async function saveOffice() {
    setSaving(true);
    try {
      await updateSettings({
        officeName: draft.officeName.trim(),
        managerPhone: draft.managerPhone.trim(),
        shareFooter: draft.shareFooter,
      });
      toast.success("اطلاعات دفتر ذخیره شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  async function runImport() {
    setImporting(true);
    try {
      const result = await importNow({ url: draft.sourceUrl.trim() || undefined });
      if (result && "skipped" in result && result.skipped) {
        toast.error(result.reason);
        return;
      }
      if (result && "added" in result) {
        toast.success(
          `${faNum(result.added ?? 0)} آگهی جدید و ${faNum(result.updated ?? 0)} بروزرسانی شد.`,
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "افزودن آگهی ناموفق بود.");
    } finally {
      setImporting(false);
    }
  }

  async function addToList(
    field: "customCities" | "customDeals" | "customPropertyTypes",
    value: string,
    clear: () => void,
  ) {
    const nextValue = value.trim();
    if (!nextValue) return;
    const current = settings?.[field] ?? [];
    if (current.includes(nextValue)) {
      toast.error("قبلاً اضافه شده است.");
      return;
    }
    await updateSettings({ [field]: [...current, nextValue] });
    clear();
  }

  async function removeFromList(
    field: "customCities" | "customDeals" | "customPropertyTypes",
    value: string,
  ) {
    const current = settings?.[field] ?? [];
    await updateSettings({ [field]: current.filter((item) => item !== value) });
  }

  if (!canManageListings) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="size-5" />
                دسترسی محدود
              </CardTitle>
              <CardDescription>
                این صفحه مخصوص مدیر و ادمین آگهی است. مشاور فقط از پنل آگهی‌ها به
                فایل‌های خودش دسترسی دارد.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard">
                  بازگشت به پنل آگهی‌ها
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-3 py-5 text-foreground sm:px-4 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              {isManager ? "مدیریت کامل مکا" : "مدیریت آگهی‌ها"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isManager
                ? "تنظیمات سایت، کاربران، آگهی‌ها، پیام‌رسان‌ها و محتوای دفتر"
                : "منابع، دسته‌بندی‌ها، درخواست‌ها و تنظیمات مربوط به آگهی‌ها"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{ROLE_LABELS[role] ?? "مهمان"}</Badge>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">
                <ArrowRight className="size-4" />
                پنل آگهی‌ها
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CloudDownload className="size-5" />
              منبع و ورود گروهی آگهی‌ها
            </CardTitle>
            <CardDescription>
              فایل HTML، JSON یا CSV منبع را تنظیم کنید و در صورت نیاز همین حالا
              همگام‌سازی را اجرا کنید.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">نشانی فایل منبع</Label>
              <Input
                id="sourceUrl"
                dir="ltr"
                placeholder="https://example.com/listings.csv"
                value={draft.sourceUrl}
                onChange={(e) =>
                  setSourceDraft({ ...draft, sourceUrl: e.target.value })
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void saveSource()} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                ذخیره منبع
              </Button>
              <Button
                onClick={() => void runImport()}
                disabled={importing || !draft.sourceUrl.trim()}
                variant="secondary"
              >
                {importing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CloudDownload className="size-4" />
                )}
                همین حالا همگام کن
              </Button>
            </div>

            <dl className="grid gap-2 rounded-lg border border-border/60 p-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">آخرین اجرا</dt>
                <dd><Stamp value={status?.lastImportAt} /></dd>
              </div>
              <div>
                <dt className="text-muted-foreground">نتیجه</dt>
                <dd>
                  {status?.lastImportError ? (
                    <span className="flex items-center gap-1 text-destructive">
                      <TriangleAlert className="size-4" />
                      {status.lastImportError}
                    </span>
                  ) : status?.lastImportAt ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-4" />
                      {status.lastImportAdded ?? 0} جدید، {status.lastImportUpdated ?? 0} بروزرسانی
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {isManager && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تنظیمات اصلی دفتر</CardTitle>
              <CardDescription>
                فقط مدیر اصلی می‌تواند نام دفتر، شماره مرکزی و متن پایانی پیام‌ها
                را تغییر دهد.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="officeName">نام دفتر</Label>
                  <Input
                    id="officeName"
                    value={draft.officeName}
                    onChange={(e) =>
                      setSourceDraft({ ...draft, officeName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerPhone">شماره تماس دفتر</Label>
                  <Input
                    id="managerPhone"
                    dir="ltr"
                    value={draft.managerPhone}
                    onChange={(e) =>
                      setSourceDraft({ ...draft, managerPhone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shareFooter">متن پایانی پیام‌ها</Label>
                <Textarea
                  id="shareFooter"
                  rows={3}
                  value={draft.shareFooter}
                  onChange={(e) =>
                    setSourceDraft({ ...draft, shareFooter: e.target.value })
                  }
                />
              </div>
              <Button onClick={() => void saveOffice()} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                ذخیره تنظیمات دفتر
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <CategoryList
            title="شهرها"
            values={settings?.customCities ?? []}
            draft={newCity}
            setDraft={setNewCity}
            onAdd={() => addToList("customCities", newCity, () => setNewCity(""))}
            onRemove={(value) => removeFromList("customCities", value)}
          />
          <CategoryList
            title="نوع معامله"
            values={settings?.customDeals ?? []}
            draft={newDeal}
            setDraft={setNewDeal}
            onAdd={() => addToList("customDeals", newDeal, () => setNewDeal(""))}
            onRemove={(value) => removeFromList("customDeals", value)}
          />
          <CategoryList
            title="نوع ملک"
            values={settings?.customPropertyTypes ?? []}
            draft={newType}
            setDraft={setNewType}
            onAdd={() => addToList("customPropertyTypes", newType, () => setNewType(""))}
            onRemove={(value) => removeFromList("customPropertyTypes", value)}
          />
        </div>

        <ListingFieldConfigManager
          configs={
            (settings?.listingFieldConfigs ??
              DEFAULT_LISTING_FIELD_CONFIGS) as ListingFieldConfig[]
          }
          onSave={async (configs) => {
            await updateSettings({ listingFieldConfigs: configs });
          }}
        />

        <LeadInbox />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">زونکن‌ها و پرونده‌ها</CardTitle>
            <CardDescription>
              دسته‌بندی داخلی فایل‌ها برای مدیریت سریع آگهی‌ها.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(folders ?? []).map((folder) => (
                <span
                  key={folder._id}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm"
                >
                  {folder.name}
                  <button
                    type="button"
                    aria-label={`حذف ${folder.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => void deleteFolder({ folderId: folder._id })}
                  >
                    ×
                  </button>
                </span>
              ))}
              {(folders ?? []).length === 0 && (
                <span className="text-sm text-muted-foreground">هنوز زونکنی ساخته نشده است.</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newFolder}
                placeholder="نام زونکن جدید"
                onChange={(e) => setNewFolder(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={async () => {
                  const name = newFolder.trim();
                  if (!name) return;
                  await createFolder({ name });
                  setNewFolder("");
                }}
              >
                افزودن
              </Button>
            </div>
          </CardContent>
        </Card>

        {isManager && <IntegrationSettings />}
        {isManager && <UserManagement />}
      </div>
    </main>
  );
}

function CategoryList({
  title,
  values,
  draft,
  setDraft,
  onAdd,
  onRemove,
}: {
  title: string;
  values: string[];
  draft: string;
  setDraft: (value: string) => void;
  onAdd: () => void;
  onRemove: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm"
            >
              {value}
              <button
                type="button"
                aria-label={`حذف ${value}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(value)}
              >
                ×
              </button>
            </span>
          ))}
          {values.length === 0 && (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={draft}
            placeholder={`${title} جدید`}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button size="sm" variant="secondary" onClick={onAdd}>
            افزودن
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
