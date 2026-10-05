import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useConvex, useMutation } from "convex/react";
import {
  DatabaseBackup,
  FileDown,
  FileUp,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type BackupFile = {
  format: "divsaz-backup";
  version: number;
  exportedAt: number;
  core: any;
  listings: any[];
};

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function BackupRestore() {
  const convex = useConvex();
  const restoreCore = useMutation(api.backup.restoreCore);
  const restoreListings = useMutation(api.backup.restoreListings);
  const restoreDependentData = useMutation(api.backup.restoreDependentData);
  const inputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState("");

  const createBackup = async () => {
    if (exporting) return;
    setExporting(true);
    setProgress("در حال دریافت تنظیمات و اطلاعات پایه…");
    try {
      const core = await convex.query(api.backup.exportCore, {});
      const listings: any[] = [];
      let cursor: string | null = null;
      let done = false;

      while (!done) {
        const page: any = await convex.query(api.backup.exportListingsPage, {
          paginationOpts: { numItems: 300, cursor },
        });
        listings.push(...page.page);
        done = page.isDone;
        cursor = page.continueCursor || null;
        setProgress(
          "در حال دریافت آگهی‌ها: " +
            listings.length.toLocaleString("fa-IR") +
            " رکورد",
        );
        if (listings.length > 100000) {
          throw new Error("تعداد رکوردها از سقف پشتیبان محلی بیشتر است.");
        }
      }

      const backup: BackupFile = {
        format: "divsaz-backup",
        version: 1,
        exportedAt: Date.now(),
        core,
        listings,
      };
      downloadJson(backup, "divsaz-backup-" + stamp() + ".json");
      toast.success(
        "پشتیبان " +
          listings.length.toLocaleString("fa-IR") +
          " آگهی آماده شد",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تهیه پشتیبان ناموفق بود",
      );
    } finally {
      setExporting(false);
      setProgress("");
    }
  };

  const restoreFile = async (file: File) => {
    if (restoring) return;
    setRestoring(true);
    try {
      setProgress("در حال خواندن فایل پشتیبان…");
      const parsed = JSON.parse(await file.text()) as BackupFile;
      if (
        parsed?.format !== "divsaz-backup" ||
        parsed.version !== 1 ||
        !parsed.core ||
        !Array.isArray(parsed.listings)
      ) {
        throw new Error("این فایل، پشتیبان معتبر دیوساز نیست.");
      }

      const ok = window.confirm(
        "بازیابی " +
          parsed.listings.length.toLocaleString("fa-IR") +
          " آگهی و اطلاعات سایت انجام شود؟ رکوردهای هم‌کلید بروزرسانی می‌شوند.",
      );
      if (!ok) return;

      setProgress("در حال بازیابی تنظیمات، کاربران و متقاضیان…");
      const coreResult = await restoreCore({ core: parsed.core });

      let added = 0;
      let updated = 0;
      let skipped = 0;
      const batchSize = 100;
      for (let i = 0; i < parsed.listings.length; i += batchSize) {
        const batch = parsed.listings.slice(i, i + batchSize);
        const result = await restoreListings({
          items: batch,
          userIdMap: coreResult.userIdMap,
          folderIdMap: coreResult.folderIdMap,
        });
        added += result.added;
        updated += result.updated;
        skipped += result.skipped;
        setProgress(
          "بازیابی آگهی‌ها: " +
            Math.min(i + batchSize, parsed.listings.length).toLocaleString("fa-IR") +
            " از " +
            parsed.listings.length.toLocaleString("fa-IR"),
        );
      }

      const dependent = await restoreDependentData({
        reminders: Array.isArray(parsed.core?.reminders)
          ? parsed.core.reminders
          : [],
        userIdMap: coreResult.userIdMap,
      });

      toast.success("بازیابی اطلاعات تمام شد", {
        description:
          added.toLocaleString("fa-IR") +
          " جدید · " +
          updated.toLocaleString("fa-IR") +
          " بروزرسانی" +
          (skipped ? " · " + skipped.toLocaleString("fa-IR") + " ردشده" : "") +
          (coreResult.unmatchedUsers.length
            ? " · " +
              coreResult.unmatchedUsers.length.toLocaleString("fa-IR") +
              " حساب برای بازیابی خودکار پس از ورود/ثبت‌نام صف شد"
            : "") +
          (dependent.restoredReminders
            ? " · " +
              dependent.restoredReminders.toLocaleString("fa-IR") +
              " یادآوری"
            : ""),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "بازیابی اطلاعات ناموفق بود",
      );
    } finally {
      setRestoring(false);
      setProgress("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DatabaseBackup className="size-5 text-primary" />
          پشتیبان‌گیری و بازیابی محلی
        </CardTitle>
        <CardDescription className="leading-6">
          یک فایل JSON روی دستگاه شما ذخیره می‌شود که آگهی‌ها، متقاضیان،
          نقش‌ها و پروفایل کاربران، تنظیمات، زونکن‌ها، صفحات، مقالات، چت‌ها،
          استوری‌ها و یادآوری‌ها را نگه می‌دارد.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 text-xs leading-6 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            رمز عبور کاربران، توکن ربات‌ها و کلید OpenRouter داخل پشتیبان
            ذخیره نمی‌شوند. اگر حسابی هنوز وجود نداشته باشد، نقش و پروفایل آن
            با ایمیل نگه داشته می‌شود و پس از ورود/ثبت‌نام همان ایمیل خودکار برمی‌گردد. عکس‌های موجود در Convex Storage با شناسه فعلی
            نگهداری می‌شوند؛ برای انتقال کامل رسانه به یک سرور جدید باید
            پشتیبان رسانه‌ای جداگانه ساخته شود.
          </p>
        </div>

        {progress && (
          <div className="rounded-xl bg-muted px-3 py-2 text-xs font-bold">
            {progress}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            className="h-12 gap-2 rounded-xl"
            disabled={exporting || restoring}
            onClick={() => void createBackup()}
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            دانلود پشتیبان کامل داده‌ها
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void restoreFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="h-12 gap-2 rounded-xl"
            disabled={exporting || restoring}
            onClick={() => inputRef.current?.click()}
          >
            {restoring ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileUp className="size-4" />
            )}
            بازیابی از فایل پشتیبان
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
