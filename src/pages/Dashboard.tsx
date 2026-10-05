import { ThemeToggle } from "@/components/ThemeToggle";
import DashboardSectionNav from "@/components/dashboard/DashboardSectionNav";
import FilterBar from "@/components/listings/FilterBar";
import ListingCard from "@/components/listings/ListingCard";
import ShareDialog from "@/components/listings/ShareDialog";
import UploadZone from "@/components/listings/UploadZone";
import ManualListingDialog from "@/components/listings/ManualListingDialog";
import PublicContactDialog from "@/components/listings/PublicContactDialog";
import PendingPublicationPanel from "@/components/listings/PendingPublicationPanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConvex, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { exportCsv, exportExcel, exportJson } from "@/lib/exporters";
import { IMPORT_ACCEPT, importListingsFile } from "@/lib/importers";
import { listingKey } from "@/lib/ingest";
import {
  DEFAULT_FILTERS,
  applyFilters,
  hasActiveFilters,
  normalizeDateInput,
  parseMoneyMillionFilter,
  parseNumberFilter,
  type Filters,
} from "@/lib/filters";
import { faNum, formatPrice } from "@/lib/format";
import { DEAL_TYPES, PROPERTY_TYPES, parseHtmlFile, type DealType, type Listing, type PropertyType } from "@/lib/parser";
import { SAMPLE_HTML } from "@/lib/sample";
import { DEFAULT_SHARE_SETTINGS, type ShareSettings, type ShareableListing } from "@/lib/share";
import {
  BellRing, BookOpen, Building2, Coins, FileCode2, FileJson, FileSpreadsheet, FileText, Loader2,
  LogOut, MapPinned, Radar, RotateCcw, Ruler, SearchX, Send, Settings, Upload, X,
} from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

const PAGE_SIZE = 60;

const HINTS = [
  { icon: FileCode2, title: "استخراج خودکار",
    body: "هر آگهی با یک عبارت باقاعده از فایل HTML خام یا خروجی JSON بیرون کشیده می‌شود." },
  { icon: SearchX, title: "جستجو و فیلتر دقیق",
    body: "فیلتر بر اساس شهر، نوع معامله، نوع ملک، تعداد اتاق، بازه قیمت و متراژ همراه مرتب‌سازی." },
  { icon: FileSpreadsheet, title: "خروجی سه‌گانه",
    body: "CSV با حروف فارسی، اکسل واقعی و JSON از همان مجموعه‌ای که روی صفحه می‌بینید." },
];

export default function Dashboard() {
  const { signOut } = useAuth();
  const convex = useConvex();
  const navigate = useNavigate();
  const headerInputRef = useRef<HTMLInputElement>(null);
  const [listingView, setListingView] = useState<"member" | "imported">("member");
  const [serverSearch, setServerSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // نقش کاربر و منابع سرور
  const roleData = useQuery(api.roles.myRole);
  const settingsRow = useQuery(api.folders.getSettings);
  const folders = useQuery(api.folders.listFolders);
  const saveNotes = useMutation(api.listings.saveNotes);
  const toggleFolder = useMutation(api.listings.toggleFolder);
  const updateListing = useMutation(api.listings.updateListing);
  const markShared = useMutation(api.listings.markShared);
  const syncListings = useMutation(api.listings.upsertListings);
  const createListing = useMutation(api.listings.createListing);
  const claimImportedListing = useMutation(api.listings.claimImportedListing);
  const migrateLegacyListingKinds = useMutation(api.listings.migrateLegacyListingKinds);
  const backfillListingSearch = useMutation(api.listings.backfillListingSearch);
  const backfillLandingFlags = useMutation(api.listings.backfillLandingFlags);
  const updatePublicSettings = useMutation(api.listings.updatePublicSettings);
  const approvePublication = useMutation(api.listings.approvePublication);
  const rejectPublication = useMutation(api.listings.rejectPublication);
  const deleteListing = useMutation(api.listings.deleteListing);
  const ensureProfile = useMutation(api.roles.ensureProfile);

  const serverListingArgs = useMemo(() => {
    const roomsExact =
      filters.rooms !== "همه" && filters.rooms !== "4+"
        ? Number(filters.rooms)
        : undefined;
    const roomsMin = filters.rooms === "4+" ? 4 : undefined;
    const priceMin = parseMoneyMillionFilter(filters.priceMin) ?? undefined;
    const priceMax = parseMoneyMillionFilter(filters.priceMax) ?? undefined;
    const areaMin = parseNumberFilter(filters.areaMin) ?? undefined;
    const areaMax = parseNumberFilter(filters.areaMax) ?? undefined;
    const dateFrom = normalizeDateInput(filters.dateFrom) || undefined;
    const dateTo = normalizeDateInput(filters.dateTo) || undefined;

    return {
      view: listingView,
      search: serverSearch || undefined,
      city: filters.city === "همه" ? undefined : filters.city,
      dealType: filters.deal === "همه" ? undefined : filters.deal,
      propertyType:
        filters.property === "همه" ? undefined : filters.property,
      roomsExact,
      roomsMin,
      priceMin,
      priceMax,
      areaMin,
      areaMax,
      dateFrom,
      dateTo,
      sort: filters.sort,
    };
  }, [filters, listingView, serverSearch]);

  // آگهی‌ها مستقیماً با صفحه‌بندی، فیلتر و مرتب‌سازی سمت سرور خوانده می‌شوند.
  const { results: serverPages, status, loadMore } = usePaginatedQuery(
    api.listings.listListings,
    serverListingArgs,
    { initialNumItems: PAGE_SIZE },
  );
  const serverItems = useMemo(
    () => serverPages.flat() as Listing[],
    [serverPages],
  );
  const loadingServer = status === "LoadingFirstPage" || status === "LoadingMore";

  // یک بار پروفایل را همگام می‌کنیم؛ این کار نقش admin قدیمی مالک را به manager مهاجرت می‌دهد.
  const profileEnsuredRef = useRef(false);
  useEffect(() => {
    if (roleData === undefined || profileEnsuredRef.current) return;
    profileEnsuredRef.current = true;
    ensureProfile().catch(() => undefined);
  }, [roleData, ensureProfile]);

  const role = roleData?.role ?? "guest";
  const canSeePhone = roleData?.isPrivileged ?? false;
  const isManager = roleData?.canManageSite ?? role === "manager";
  const canManageListings =
    roleData?.canManageListings ?? (role === "manager" || role === "admin");

  const migrationStartedRef = useRef(false);
  useEffect(() => {
    if (!canManageListings || migrationStartedRef.current) return;
    migrationStartedRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        for (let i = 0; i < 20 && !cancelled; i += 1) {
          const result = await migrateLegacyListingKinds({ limit: 500 });
          if (result.done) break;
        }
        for (let i = 0; i < 20 && !cancelled; i += 1) {
          const result = await backfillListingSearch({ limit: 500 });
          if (result.done) break;
        }
        for (let i = 0; i < 20 && !cancelled; i += 1) {
          const result = await backfillLandingFlags({ limit: 500 });
          if (result.done) break;
        }
      } catch (error) {
        console.error("listing kind migration failed", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    canManageListings,
    migrateLegacyListingKinds,
    backfillListingSearch,
    backfillLandingFlags,
  ]);

  const [listings, setListings] = useState<Listing[]>([]);
  const [localTouched, setLocalTouched] = useState(false);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [busyLabel, setBusyLabel] = useState("در حال پردازش فایل…");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number } | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      // افزایش تعداد کارت‌های واقعاً قابل نمایش؛ برای فایل محلی و سرور.
      setVisibleCount((current) => current + PAGE_SIZE);
      if (!localTouched && status === "CanLoadMore") {
        loadMore(PAGE_SIZE);
      }
    }, { rootMargin: "700px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, localTouched, status]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setSelected(new Set());
    setLocalTouched(false);
  }, [listingView]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setServerSearch(filters.query.trim());
      setVisibleCount(PAGE_SIZE);
      setSelected(new Set());
    }, 280);
    return () => window.clearTimeout(timer);
  }, [filters.query]);

  const deferredFilters = useDeferredValue(filters);
  const searchingServer =
    !localTouched &&
    filters.query.trim().length >= 2 &&
    (serverSearch !== filters.query.trim() || status === "LoadingFirstPage");

  // منبع نمایش: فایل محلی یا نتیجه صفحه‌بندی‌شده سرور.
  const displayListings = localTouched ? listings : serverItems;

  const settings = useMemo(
    () => ({
      officeName: settingsRow?.officeName || DEFAULT_SHARE_SETTINGS.officeName,
      managerPhone: settingsRow?.managerPhone || "",
      shareFooter: settingsRow?.shareFooter || "",
    }),
    [settingsRow],
  );
  // ویرایش محلی نام دفتر/شماره/متن پایانی در دیالوگ ارسال (بدون نیاز به دسترسی ادمین)
  const [shareOverride, setShareOverride] = useState<Partial<ShareSettings>>({});
  const shareSettings = useMemo<ShareSettings>(
    () => ({
      officeName: shareOverride.officeName ?? settings.officeName,
      managerPhone: shareOverride.managerPhone ?? settings.managerPhone,
      shareFooter: shareOverride.shareFooter ?? settings.shareFooter,
    }),
    [shareOverride, settings],
  );

  const afterLoad = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setVisibleCount(PAGE_SIZE);
    setSelected(new Set());
  }, []);

  /** ذخیرهٔ آگهی‌ها روی سرور برای اضافه‌کردن روزانه. */
  const syncToServer = useCallback(async (
    items: Listing[],
    options: { silent?: boolean } = {},
  ) => {
    if (!canSeePhone || items.length === 0) return;
    setSyncing(true);
    try {
      const BATCH = 100;
      const importBatchId = `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      let added = 0; let updated = 0;
      for (let i = 0; i < items.length; i += BATCH) {
        const batch = items.slice(i, i + BATCH).map((l) => ({
          key: listingKey(l),
          radarCode: l.radarCode || undefined,
          city: l.city, neighborhood: l.neighborhood || undefined,
          area: l.area ?? undefined, rooms: l.rooms ?? undefined,
          priceMillion: l.priceMillion || undefined,
          depositMillion: l.depositMillion ?? undefined,
          rentMillion: l.rentMillion ?? undefined,
          pricePerMeter: l.pricePerMeter ?? undefined,
          dealType: l.dealType, propertyType: l.propertyType,
          title: l.title || undefined, description: l.description || undefined,
          address: l.address || undefined, mapsUrl: l.mapsUrl || undefined,
          divarUrl: l.divarUrl || undefined, date: l.date || undefined,
          dateRaw: l.dateRaw || undefined, poster: l.poster || undefined,
          phone: l.phone,
        }));
        const res = await syncListings({ items: batch, importBatchId });
        added += res.added; updated += res.updated;
        setSyncProgress({ done: Math.min(i + BATCH, items.length), total: items.length });
      }
      if (!options.silent) {
        toast.success("آگهی‌ها روی سرور ذخیره شد", {
          description: `${faNum(added)} جدید • ${faNum(updated)} بروزرسانی`,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("ذخیره کامل آگهی‌ها روی سرور ناموفق بود", {
        description: "بخشی از آگهی‌ها ممکن است ذخیره نشده باشند؛ دوباره تلاش کنید.",
      });
      throw e;
    } finally {
      setSyncing(false); setSyncProgress(null);
    }
  }, [canSeePhone, syncListings]);

  /** پس از هر ورود فایل، آگهی‌ها بی‌درنگ روی سرور ذخیره می‌شوند. */
  const persist = useCallback(async (items: Listing[]) => {
    if (!canSeePhone || items.length === 0) return;
    await syncToServer(items, { silent: true });
  }, [canSeePhone, syncToServer]);

  const handleManualSave = useCallback(async (
    values: Parameters<typeof createListing>[0],
  ) => {
    const key = await createListing(values);
    // نمایش به دادهٔ سرور برمی‌گردد تا آگهی تازه بلافاصله دیده شود
    setLocalTouched(false);
    return key;
  }, [createListing]);

  const parseText = useCallback(async (text: string, name: string) => {
    setParsing(true); setError(null); setProgress({ done: 0, total: 0 });
    try {
      const result = await parseHtmlFile(text, (done, total) => setProgress({ done, total }));
      if (result.total === 0) {
        setListings([]); setSkipped(0); setFileName(null); setLocalTouched(true);
        setError("هیچ لینک دیواری در فایل پیدا نشد. مطمئن شوید فایل HTML خام همین کانال را بارگذاری کرده‌اید.");
        return;
      }
      setListings(result.listings); setSkipped(result.skipped); setFileName(name);
      setLocalTouched(true);
      afterLoad();
      if (result.listings.length === 0) {
        setError("هیچ آگهی معتبری با شماره تلفن پیدا نشد.");
      } else {
        setBusyLabel("در حال ذخیره همه آگهی‌ها روی سرور…");
        await persist(result.listings);
        setLocalTouched(false);
        setListingView("imported");
        toast.success(`${faNum(result.listings.length)} آگهی وارد بانک ایمپورت شد`, {
          description: result.skipped > 0 ? `${faNum(result.skipped)} آگهی بدون شماره تلفن نادیده گرفته شد` : undefined,
        });
      }
    } catch (e) {
      console.error(e);
      setError("پردازش فایل با خطا مواجه شد.");
    } finally {
      setParsing(false); setProgress(null);
    }
  }, [afterLoad, persist]);

  const handleFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    try {
      if (/\.(csv|json|xlsx|xls)$/.test(name)) {
        setParsing(true); setError(null);
        setBusyLabel(`در حال خواندن ${name.endsWith(".csv") ? "CSV" : name.endsWith(".json") ? "JSON" : "اکسل"}…`);
        setProgress({ done: 0, total: 0 });
        const result = await importListingsFile(file, (done, total) => setProgress({ done, total }));
        if (result.total === 0) { setError("هیچ ردیفی در فایل پیدا نشد."); return; }
        if (result.listings.length === 0) { setError("هیچ ردیف معتبری با شماره تلفن پیدا نشد."); return; }
        setListings(result.listings); setSkipped(result.skipped); setFileName(file.name);
        setLocalTouched(true);
        afterLoad();
        setBusyLabel("در حال ذخیره همه آگهی‌ها روی سرور…");
        await persist(result.listings);
        setLocalTouched(false);
        setListingView("imported");
        toast.success(`${faNum(result.listings.length)} آگهی وارد بانک ایمپورت شد`);
      } else {
        const text = await file.text();
        await parseText(text, file.name);
      }
    } catch (e) {
      console.error(e);
      setError("خواندن فایل ممکن نشد.");
    } finally {
      setParsing(false); setProgress(null);
    }
  }, [afterLoad, parseText, persist]);

  const handleSample = useCallback(() => { void parseText(SAMPLE_HTML, "نمونه-داده.html"); }, [parseText]);

  const updateFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch })); setVisibleCount(PAGE_SIZE);
  }, []);
  const resetFilters = useCallback(() => { setFilters(DEFAULT_FILTERS); setVisibleCount(PAGE_SIZE); }, []);

  const filtered = useMemo(
    () =>
      localTouched || Boolean(serverSearch)
        ? applyFilters(displayListings, deferredFilters)
        : displayListings,
    [displayListings, deferredFilters, localTouched, serverSearch],
  );
  const visible = filtered.slice(0, visibleCount);

  const cities = useMemo(() => {
    const set = new Set(displayListings.map((l) => l.city));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fa"));
  }, [displayListings]);
  const dealTypes = useMemo(() => {
    const present = new Set(displayListings.map((l) => l.dealType));
    return [...DEAL_TYPES.filter((d) => present.has(d)), ...Array.from(present).filter((d) => !DEAL_TYPES.includes(d as DealType))];
  }, [displayListings]);
  const propertyTypes = useMemo(() => {
    const present = new Set(displayListings.map((l) => l.propertyType));
    return [...PROPERTY_TYPES.filter((p) => present.has(p)), ...Array.from(present).filter((p) => !PROPERTY_TYPES.includes(p as PropertyType))];
  }, [displayListings]);

  const stats = useMemo(() => {
    const withPrice = displayListings.filter((l) => l.priceMillion > 0);
    const withArea = displayListings.filter((l) => l.area !== null);
    return {
      count: displayListings.length,
      cities: new Set(displayListings.map((l) => l.city)).size,
      avgPrice: withPrice.length ? Math.round(withPrice.reduce((s, l) => s + l.priceMillion, 0) / withPrice.length) : 0,
      avgArea: withArea.length ? Math.round(withArea.reduce((s, l) => s + (l.area ?? 0), 0) / withArea.length) : 0,
    };
  }, [displayListings]);

  const doExport = useCallback(async (kind: "csv" | "json" | "excel") => {
    if (!filtered.length) return;
    try {
      if (kind === "csv") exportCsv(filtered);
      else if (kind === "json") exportJson(filtered);
      else await exportExcel(filtered);
      toast.success(`خروجی ${faNum(filtered.length)} آگهی تهیه شد`);
    } catch { toast.error("تهیه خروجی با خطا مواجه شد"); }
  }, [filtered]);

  const exportAllExcel = useCallback(
    async (scope: "current" | "all" = "current") => {
      if (exportingAll) return;
      setExportingAll(true);
      try {
        const all: Listing[] = [];
        const views: Array<"member" | "imported"> =
          scope === "all" && canManageListings
            ? ["member", "imported"]
            : [listingView];

        for (const view of views) {
          let cursor: string | null = null;
          let done = false;
          while (!done) {
            const page: any = await convex.query(api.listings.listListings, {
              view,
              paginationOpts: { numItems: 300, cursor },
            });
            all.push(...(page.page as Listing[]));
            done = page.isDone;
            cursor = page.continueCursor || null;
            if (all.length > 50000) {
              throw new Error("حجم خروجی بیش از حد مجاز است.");
            }
          }
        }

        if (all.length === 0) {
          toast.error("آگهی‌ای برای خروجی وجود ندارد");
          return;
        }
        await exportExcel(all);
        toast.success(`فایل اکسل ${faNum(all.length)} آگهی آماده شد`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "تهیه خروجی کامل ناموفق بود",
        );
      } finally {
        setExportingAll(false);
      }
    },
    [canManageListings, convex, exportingAll, listingView],
  );

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const filtersActive = hasActiveFilters(filters);
  const pct = progress && progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;

  const shareList: ShareableListing[] = useMemo(
    () =>
      (selected.size > 0
        ? filtered.filter((l) => selected.has(listingKey(l)))
        : // بدون انتخاب: تا ۵۰ آگهی بالای فهرست؛ تعداد در دیالوگ انتخاب می‌شود
          filtered.slice(0, 50))
        .map((l) => ({
          key: listingKey(l),
          title: l.title, city: l.city, neighborhood: l.neighborhood,
          area: l.area, rooms: l.rooms, priceMillion: l.priceMillion,
          depositMillion: l.depositMillion, rentMillion: l.rentMillion,
          dealType: l.dealType, propertyType: l.propertyType,
          description: l.description, address: l.address,
          divarUrl: l.divarUrl, mapsUrl: l.mapsUrl,
          contactPhone: canSeePhone ? l.phone : settings.managerPhone,
        })),
    [filtered, selected, canSeePhone, settings.managerPhone],
  );

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const folderList = (folders ?? []) as { _id: string; name: string; color?: string }[];

  return (
    <main className="min-h-screen">
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
              <Radar className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold leading-tight">آگهی‌ها</h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                دیوساز · {role === "manager" ? "مدیر" : role === "admin" ? "ادمین" : role === "consultant" ? "مشاور" : role === "user" ? "کاربر" : "مهمان"}
              </p>
            </div>
            {fileName && (
              <span dir="ltr" title={fileName}
                className="hidden max-w-52 truncate rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground md:inline-block">
                {fileName}
              </span>
            )}
          </div>
          <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&>*]:shrink-0 sm:w-auto sm:gap-2 sm:overflow-visible sm:pb-0">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/dashboard" title="خانه داشبورد">
                <Radar className="size-4" />
                <span className="hidden sm:inline">داشبورد</span>
              </Link>
            </Button>
            {isManager && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/dashboard/blog" title="نوشتن و مدیریت مقاله‌ها">
                  <FileText className="size-4" />
                  <span className="hidden sm:inline">وبلاگ</span>
                </Link>
              </Button>
            )}
            {canManageListings && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/admin" title={isManager ? "مدیریت کامل سایت" : "مدیریت آگهی‌ها"}>
                  <Settings className="size-4" />
                  <span className="hidden sm:inline">{isManager ? "مدیریت" : "ادمین آگهی"}</span>
                </Link>
              </Button>
            )}
            {canSeePhone && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/dashboard/reminders" title="یادآوری پیگیری آگهی‌ها">
                  <BellRing className="size-4" />
                  <span className="hidden sm:inline">یادآوری</span>
                </Link>
              </Button>
            )}
            {canSeePhone && <PublicContactDialog />}
            <ThemeToggle />
            {canManageListings && (
              <>
                <input ref={headerInputRef} type="file"
                  accept={".html,.htm,.txt," + IMPORT_ACCEPT + ",text/html,text/plain"}
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />
                <Button type="button" variant="outline" size="sm" className="gap-1.5"
                  onClick={() => headerInputRef.current?.click()} disabled={parsing}>
                  <Upload className="size-4" /><span className="hidden sm:inline">ورود فایل</span>
                </Button>
              </>
            )}
            {canSeePhone && (
              <ManualListingDialog open={manualOpen} onOpenChange={setManualOpen}
                onSave={handleManualSave} />
            )}
            {canSeePhone && localTouched && listings.length > 0 && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5"
                onClick={() => void syncToServer(listings)} disabled={syncing}>
                {syncing ? <Loader2 className="size-4 animate-spin" /> : <Building2 className="size-4" />}
                <span className="hidden sm:inline">{syncing ? "ذخیره…" : "ذخیره روی سرور"}</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1.5"
                  disabled={parsing || filtered.length === 0}>
                  <FileSpreadsheet className="size-4" /><span className="hidden sm:inline">خروجی</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  خروجی از آگهی‌های بارگذاری‌شده یا کل بخش
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => void exportAllExcel("current")} disabled={exportingAll}>
                  <FileSpreadsheet className="size-4" />
                  {exportingAll ? "در حال جمع‌آوری…" : "اکسل کل این بخش"}
                </DropdownMenuItem>
                {canManageListings && (
                  <DropdownMenuItem onClick={() => void exportAllExcel("all")} disabled={exportingAll}>
                    <FileSpreadsheet className="size-4" />
                    اکسل همه آگهی‌ها
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => void doExport("csv")}><FileText className="size-4" />فایل CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void doExport("excel")}><FileSpreadsheet className="size-4" />فایل اکسل (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void doExport("json")}><FileJson className="size-4" />فایل JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="ghost" size="icon" className="size-9"
              title="خروج از حساب" onClick={handleSignOut}><LogOut className="size-4" /></Button>
          </div>
        </div>
      </header>

      <DashboardSectionNav />

      <div className="mx-auto w-full max-w-7xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-6 sm:py-6 lg:px-8">
        {parsing && (
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5">
              <Loader2 className="size-5 animate-spin text-primary" />
              <p className="font-bold">{busyLabel}
                {progress && progress.total > 0 && (
                  <span className="mr-1 text-sm font-normal text-muted-foreground">{faNum(pct)}٪</span>
                )}
              </p>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-l from-primary to-gold transition-all duration-200"
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {syncing && syncProgress && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm font-medium">
            ذخیره روی سرور: {faNum(syncProgress.done)} از {faNum(syncProgress.total)}
          </div>
        )}

        {!parsing && error && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400">{error}</div>
        )}

        {canManageListings && <PendingPublicationPanel />}

        {searchingServer && (
          <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-xs font-bold text-primary">
            <Loader2 className="size-4 animate-spin" />
            در حال جستجو در کل بانک آگهی‌ها…
          </div>
        )}

        <section className="rounded-2xl border border-border/70 bg-card p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setListingView("member")}
              className={
                "rounded-xl px-3 py-3 text-sm font-black transition-colors " +
                (listingView === "member"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              {role === "consultant" ? "فایل‌های من" : "آگهی‌های اعضا"}
            </button>
            <button
              type="button"
              onClick={() => setListingView("imported")}
              className={
                "rounded-xl px-3 py-3 text-sm font-black transition-colors " +
                (listingView === "imported"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              بانک ایمپورت
            </button>
          </div>
          <p className="px-2 pb-1 pt-2 text-[11px] leading-6 text-muted-foreground">
            {listingView === "imported"
              ? "فایل‌های خام واردشده در این بخش می‌مانند. هر فایل با «برداشتن فایل» از بانک مشترک خارج و به نام همان عضو ثبت می‌شود."
              : role === "consultant"
                ? "فقط فایل‌هایی که خودتان ثبت کرده یا از بانک ایمپورت برداشته‌اید نمایش داده می‌شوند."
                : "فایل‌های ثبت‌شده اعضا و فایل‌هایی که از بانک ایمپورت تحویل گرفته شده‌اند."}
          </p>
        </section>

        {!parsing && !searchingServer && displayListings.length === 0 && !loadingServer && (
          <section className="space-y-4">
            {listingView === "imported" && canManageListings ? (
              <UploadZone onFile={(f) => void handleFile(f)} onSample={handleSample}
                loading={parsing} progress={progress} busyLabel={busyLabel} />
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-14 text-center">
                <Building2 className="mx-auto size-10 text-muted-foreground/35" />
                <h2 className="mt-3 font-black">
                  {listingView === "imported" ? "بانک ایمپورت خالی است" : "هنوز فایلی در این بخش نیست"}
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-muted-foreground">
                  {listingView === "imported"
                    ? "مدیر یا ادمین می‌تواند فایل CSV، اکسل، JSON یا HTML را وارد کند."
                    : "آگهی جدید ثبت کنید یا یک فایل را از بانک ایمپورت بردارید."}
                </p>
                {listingView === "member" && canSeePhone && (
                  <Button type="button" className="mt-4" onClick={() => setManualOpen(true)}>
                    ثبت آگهی جدید
                  </Button>
                )}
              </div>
            )}
          </section>
        )}

        {!parsing && displayListings.length > 0 && (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { icon: Building2, label: "بارگذاری‌شده", value: faNum(stats.count) },
                { icon: MapPinned, label: "شهرها", value: faNum(stats.cities) },
                { icon: Coins, label: "میانگین قیمت", value: stats.avgPrice ? formatPrice(stats.avgPrice) : "—" },
                { icon: Ruler, label: "میانگین متراژ", value: stats.avgArea ? `${faNum(stats.avgArea)} متر` : "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 p-3.5 shadow-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold leading-tight">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </section>

            <FilterBar filters={filters} onChange={updateFilters} onReset={resetFilters}
              cities={cities} dealTypes={dealTypes} propertyTypes={propertyTypes} />

            {/* نوار انتخاب و ارسال */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card/70 px-4 py-2.5">
              <p className="text-sm text-muted-foreground">
                <span className="font-extrabold text-foreground">{faNum(filtered.length)}</span> آگهی در داده‌های بارگذاری‌شده
                {filtersActive && " (با اعمال فیلترها)"}
              </p>
              {syncing && syncProgress && (
                <p className="text-xs font-bold text-primary">
                  در حال ذخیره روی سرور: {faNum(syncProgress.done)} از {faNum(syncProgress.total)}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {selected.size > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-1 text-xs font-bold text-primary">
                    {faNum(selected.size)} انتخاب‌شده
                    <button type="button" onClick={() => setSelected(new Set())}
                      className="rounded-full p-0.5 hover:bg-primary/20">
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                <Button type="button" size="sm" className="gap-1.5"
                  disabled={filtered.length === 0}
                  onClick={() => setShareOpen(true)}>
                  <Send className="size-4" />
                  ارسال آگهی
                </Button>
                {skipped > 0 && (
                  <p className="text-xs text-muted-foreground">{faNum(skipped)} آگهی بدون شماره تلفن</p>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
                <SearchX className="size-8 text-muted-foreground" />
                <p className="font-bold">آگهی‌ای با این فیلترها پیدا نشد</p>
                <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                  <RotateCcw className="size-4" />پاک‌کردن فیلترها
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((l) => {
                    const key = listingKey(l);
                    const imported = l.listingKind === "imported" || listingView === "imported";
                    return (
                      <ListingCard key={key} listing={l} canSeePhone={canSeePhone}
                        managerPhone={settings.managerPhone}
                        selected={selected.has(key)}
                        onToggleSelect={() => toggleSelect(key)}
                        onShare={() => { setSelected(new Set([key])); setShareOpen(true); }}
                        folders={folderList}
                        onSaveNotes={canSeePhone && !imported ? async (notes) => { await saveNotes({ key, notes }); } : undefined}
                        onToggleFolder={canSeePhone && !imported ? async (fid) => { await toggleFolder({ key, folderId: fid }); } : undefined}
                        onSaveLocation={canSeePhone && !imported ? async (patch) => { await updateListing({ key, patch }); } : undefined}
                        onEditListing={canSeePhone && !imported ? async (patch) => {
                          await updateListing({ key, patch });
                          setLocalTouched(false);
                        } : undefined}
                        onDeleteListing={canSeePhone && (!imported || canManageListings) ? async () => {
                          await deleteListing({ key });
                          setSelected((current) => {
                            const next = new Set(current);
                            next.delete(key);
                            return next;
                          });
                          setListings((current) => current.filter((item) => listingKey(item) !== key));
                          setLocalTouched(false);
                        } : undefined}
                        onSavePublic={canSeePhone && !imported ? async (settings) => {
                          const result = await updatePublicSettings({ key, ...settings });
                          if (result.publicationStatus === "pending") {
                            toast.success("درخواست انتشار برای مدیر یا ادمین ارسال شد");
                          }
                        } : undefined}
                        isAdmin={canManageListings}
                        onApprovePublication={canManageListings ? async () => {
                          await approvePublication({ key });
                        } : undefined}
                        onRejectPublication={canManageListings && !imported ? async (reason) => {
                          await rejectPublication({ key, reason });
                        } : undefined}
                        onClaimImported={imported ? async () => {
                          await claimImportedListing({ key });
                          setSelected((current) => {
                            const next = new Set(current);
                            next.delete(key);
                            return next;
                          });
                        } : undefined} />
                    );
                  })}
                </div>
                <div ref={sentinelRef} className="h-px w-full" aria-hidden />
                {status === "LoadingMore" && (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    در حال خواندن آگهی‌های بیشتر…
                  </p>
                )}
                {status === "CanLoadMore" && (
                  <div className="flex justify-center pt-1">
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => loadMore(PAGE_SIZE)}>
                      دریافت آگهی‌های بیشتر از سرور
                    </Button>
                  </div>
                )}
                {filtered.length > visibleCount && (
                  <div className="flex justify-center pt-1">
                    <Button type="button" variant="outline" size="sm" className="gap-1.5"
                      onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
                      نمایش ۶۰ آگهی دیگر ({faNum(Math.min(PAGE_SIZE, filtered.length - visibleCount))} باقی‌مانده در این مرحله)
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen}
        listings={shareList} settings={shareSettings}
        initialCount={selected.size || 1}
        onSettingsChange={(patch) => setShareOverride((prev) => ({ ...prev, ...patch }))}
        onShared={() => { if (selected.size > 0) void markShared({ keys: Array.from(selected) }); }} />
    </main>
  );
}
