import { Button } from "@/components/ui/button";
import EditPanel, { type Folder } from "@/components/listings/EditPanel";
import PublicListingDialog from "@/components/listings/PublicListingDialog";
import FullListingEditDialog, {
  type ListingEditPatch,
} from "@/components/listings/FullListingEditDialog";
import { faDigits, formatArea, formatPrice, formatRooms } from "@/lib/format";
import { formatJalaliDate } from "@/lib/jalali";
import type { DealType, Listing } from "@/lib/parser";
import { cn } from "@/lib/utils";
import { listingNeshanUrl } from "@/lib/neshan";
import {
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  EyeOff,
  Clock3,
  MapPin,
  Phone,
  Ruler,
  Send,
  UserRound,
  UserCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEAL_STYLES: Record<DealType, string> = {
  فروش: "border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  "رهن و اجاره": "border-sky-500/35 bg-sky-500/12 text-sky-700 dark:text-sky-400",
  "پیش فروش": "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:text-amber-400",
  سایر: "border-border bg-muted text-muted-foreground",
};

interface ListingCardProps {
  listing: Listing;
  /** نقش کاربر: آیا شمارهٔ آگهی قابل نمایش است؟ */
  canSeePhone: boolean;
  /** شمارهٔ دفتر برای نمایش به کاربران غیرمجاز */
  managerPhone?: string;
  selected?: boolean;
  onToggleSelect?: () => void;
  onShare?: () => void;
  // ویرایش و بایگانی (فقط برای نقش‌های مجاز)
  folders?: Folder[];
  onSaveNotes?: (notes: string) => Promise<void>;
  onToggleFolder?: (folderId: string) => Promise<void>;
  onSaveLocation?: (patch: {
    address: string;
    divarUrl: string;
    mapsUrl: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  onEditListing?: (patch: ListingEditPatch) => Promise<void>;
  onDeleteListing?: () => Promise<void>;
  onSavePublic?: (settings: {
    isPublic: boolean;
    featuredOnHome: boolean;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    noIndex: boolean;
  }) => Promise<void>;
  isAdmin?: boolean;
  onApprovePublication?: () => Promise<void>;
  onRejectPublication?: (reason?: string) => Promise<void>;
  onClaimImported?: () => Promise<void>;
}

/** کارت نمایش یک آگهی با اکشن‌های کپی تلفن، تماس، دیوار، نقشه و ارسال. */
export default function ListingCard({
  listing: l, canSeePhone, managerPhone, selected, onToggleSelect,
  onShare, folders = [], onSaveNotes, onToggleFolder, onSaveLocation,
  onEditListing, onDeleteListing, onSavePublic,
  isAdmin = false, onApprovePublication, onRejectPublication, onClaimImported,
}: ListingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const rest = l.description.startsWith(l.title)
    ? l.description.slice(l.title.length).trim()
    : l.description;
  const longEnough = rest.length > 110;
  const contact = canSeePhone ? l.phone : (managerPhone ?? "");
  const isRestricted = !canSeePhone;
  const mapHref = listingNeshanUrl({
    latitude: l.latitude,
    longitude: l.longitude,
    address: l.address,
    city: l.city,
  });

  const copyPhone = async () => {
    if (!contact) return;
    try {
      await navigator.clipboard.writeText(contact);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success("شماره تماس کپی شد", { description: contact });
    } catch {
      toast.error("کپی شماره ممکن نشد");
    }
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        selected ? "border-primary ring-2 ring-primary/25" : "border-border/70 hover:border-primary/45",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-l from-primary via-gold to-transparent opacity-70" />

      {/* انتخاب + برچسب‌ها */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {onToggleSelect && (
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              <input type="checkbox" checked={!!selected} onChange={onToggleSelect}
                className="size-3.5 accent-[var(--primary)]" />
              انتخاب
            </label>
          )}
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
            DEAL_STYLES[l.dealType] ?? DEAL_STYLES["سایر"])}>{l.dealType}</span>
          <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
            {l.propertyType}</span>
          {l.listingKind === "imported" && (
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-black text-sky-700 dark:text-sky-300">
              بانک ایمپورت
            </span>
          )}
        </div>
        {l.radarCode && (
          <span dir="auto" className="shrink-0 rounded-md border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
            رادار {faDigits(l.radarCode)}
          </span>
        )}
      </div>

      {/* عنوان ثبت‌شده، سپس موقعیت؛ عنوان کارت دقیقاً همان عنوان ذخیره‌شده است. */}
      <h3 className="line-clamp-2 text-lg font-extrabold leading-7">
        {l.title || [l.dealType, l.propertyType, l.area ? String(l.area) + " متری" : "", "در", l.city].filter(Boolean).join(" ")}
      </h3>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-4 shrink-0 text-primary" />
        <span className="truncate">
          {l.neighborhood ? `${l.city}، ${l.neighborhood}` : l.city}
        </span>
      </div>
      <p className="text-gradient-brand text-2xl font-extrabold tracking-tight">
        {l.rentMillion != null && l.rentMillion > 0
          ? `اجاره: ${formatPrice(l.rentMillion)}`
          : l.depositMillion != null && l.depositMillion > 0
            ? `ودیعه: ${formatPrice(l.depositMillion)}`
            : l.priceMillion > 0
              ? formatPrice(l.priceMillion)
              : "قیمت توافقی"}
      </p>
      {(l.depositMillion != null || l.rentMillion != null) && (
        <p className="-mt-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          {l.depositMillion != null && l.depositMillion > 0 && <span>رهن: {formatPrice(l.depositMillion)}</span>}
          {l.rentMillion != null && l.rentMillion > 0 && <span>اجاره: {formatPrice(l.rentMillion)}</span>}
        </p>
      )}
      {l.pricePerMeter !== null && l.pricePerMeter > 0 && (
        <p className="-mt-1 text-xs text-muted-foreground">هر متر: {formatPrice(l.pricePerMeter)}</p>
      )}

      {/* مشخصات */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Ruler className="size-4 text-primary/80" />{formatArea(l.area)}</span>
        <span className="flex items-center gap-1.5"><BedDouble className="size-4 text-primary/80" />{formatRooms(l.rooms)}</span>
        {l.dateRaw && (
          <span className="flex items-center gap-1.5"><CalendarDays className="size-4 text-primary/80" />{l.dateRaw}</span>
        )}
        {l.poster && (
          <span className="flex items-center gap-1.5"><UserRound className="size-4 text-primary/80" />{l.poster}</span>
        )}
      </div>

      {l.customFields && l.customFields.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
          {l.customFields.slice(0, expanded ? undefined : 5).map((field) => (
            <span
              key={field.fieldId}
              className="rounded-lg bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground"
              title={field.label}
            >
              <b className="text-foreground">{field.label}:</b>{" "}
              {field.type === "date" ? formatJalaliDate(field.value) : field.value}{field.unit ? ` ${field.unit}` : ""}
            </span>
          ))}
          {!expanded && l.customFields.length > 5 && (
            <span className="rounded-lg bg-primary/8 px-2 py-1 text-[11px] font-bold text-primary">
              +{faDigits(String(l.customFields.length - 5))} مشخصه
            </span>
          )}
        </div>
      )}

      {/* توضیحات ثبت‌شده بدون تولید عنوان جایگزین */}
      <div className="space-y-1 border-t border-border/60 pt-3">
        {rest && (
          <>
            <p className={cn("whitespace-pre-line text-[13px] leading-6 text-muted-foreground",
              !expanded && "line-clamp-3")}>{rest}</p>
            {longEnough && (
              <button type="button" onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:text-primary/80">
                {expanded ? (<><ChevronUp className="size-3.5" /> بستن</>) : (<><ChevronDown className="size-3.5" /> نمایش کامل</>)}
              </button>
            )}
          </>
        )}
      </div>

      {l.address && (
        <p className="flex items-start gap-1.5 border-t border-border/60 pt-3 text-[13px] leading-6 text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
          <span dir="auto">{l.address}</span>
        </p>
      )}

      {l.listingKind === "imported" && onClaimImported && (
        <div className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.06] p-3">
          <p className="text-[11px] leading-6 text-muted-foreground">
            با برداشتن این فایل، از بانک مشترک خارج می‌شود و فقط در فایل‌های شما قرار می‌گیرد تا تکمیل و منتشر شود.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-2 w-full gap-1.5"
            onClick={async () => {
              try {
                await onClaimImported();
                toast.success("فایل به نام شما منتقل شد");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "انتقال فایل انجام نشد");
              }
            }}
          >
            <UserCheck className="size-4" />
            برداشتن و انتقال به فایل‌های من
          </Button>
        </div>
      )}

      {/* ویرایش کامل + یادداشت و بایگانی */}
      {onEditListing && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <FullListingEditDialog listing={l} onSave={onEditListing} />
          {onDeleteListing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={async () => {
                if (!window.confirm("این آگهی کاملاً حذف شود؟ تصاویر ذخیره‌شده آن نیز حذف می‌شوند و این عملیات قابل بازگشت نیست.")) return;
                try {
                  await onDeleteListing();
                  toast.success("آگهی حذف شد");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "حذف آگهی ناموفق بود");
                }
              }}
            >
              <Trash2 className="size-3.5" />
              حذف
            </Button>
          )}
        </div>
      )}
      {onSaveNotes && onToggleFolder && onSaveLocation && (
        <EditPanel notes={l.notes ?? ""} onSaveNotes={onSaveNotes}
          folderIds={l.folderIds ?? []} folders={folders} onToggleFolder={onToggleFolder}
          currentAddress={l.address ?? ""} currentDivarUrl={l.divarUrl ?? ""}
          currentMapsUrl={l.mapsUrl ?? ""}
          currentLatitude={l.latitude} currentLongitude={l.longitude}
          onSaveLocation={onSaveLocation}
          canEdit={canSeePhone} />
      )}

      {canSeePhone && l.publicationStatus === "pending" && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-400">
              <Clock3 className="size-4" />
              در انتظار تأیید مدیر
            </span>
            {isAdmin && onApprovePublication && onRejectPublication && (
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={async () => {
                    await onApprovePublication();
                    toast.success("آگهی تأیید و عمومی شد");
                  }}
                >
                  <CheckCircle2 className="size-3.5" />
                  تأیید
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-destructive/30 text-xs text-destructive"
                  onClick={async () => {
                    const reason = window.prompt("دلیل رد یا اصلاح موردنیاز را بنویسید:", "نیاز به اصلاح دارد.") ?? undefined;
                    await onRejectPublication(reason);
                    toast.success("درخواست انتشار رد شد");
                  }}
                >
                  <XCircle className="size-3.5" />
                  رد
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {canSeePhone && l.publicationStatus === "rejected" && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs">
          <p className="font-extrabold text-destructive">انتشار رد شده</p>
          {l.publicationRejectReason && (
            <p className="mt-1 leading-6 text-muted-foreground">{l.publicationRejectReason}</p>
          )}
        </div>
      )}

      {canSeePhone && onSavePublic && (
        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <PublicListingDialog listing={l} onSave={onSavePublic} />
            {l.isPublic && l.featuredOnHome && (
              <span className="rounded-full bg-gold/10 px-2 py-1 text-[10px] font-bold text-gold">
                منتخب صفحه اصلی
              </span>
            )}
          </div>
          {l.isPublic && l.publicSlug && (
            <a
              href={`/listings/${l.publicSlug}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-primary"
            >
              مشاهده عمومی
            </a>
          )}
        </div>
      )}

      {/* اکشن‌ها */}
      <div className="mt-auto flex items-center gap-2 pt-1">
        <Button type="button" variant="outline" size="sm"
          className="min-w-0 flex-1 gap-1.5 font-mono text-xs"
          onClick={copyPhone} title={isRestricted ? "شماره تماس دفتر" : "کپی شماره"}>
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          <span dir="ltr">{contact || "—"}</span>
        </Button>
        {isRestricted && <EyeOff className="size-4 shrink-0 text-muted-foreground" />}
        {onShare && (
          <Button type="button" variant="outline" size="icon" className="size-9"
            title="ارسال آگهی" onClick={onShare}>
            <Send className="size-4" />
          </Button>
        )}
        {contact && (
          <a href={`tel:${contact}`} title="تماس"
            className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-background transition-colors hover:border-primary/50 hover:text-primary">
            <Phone className="size-4" />
          </a>
        )}
        {l.divarUrl && (
          <a href={l.divarUrl} target="_blank" rel="noopener noreferrer" title="مشاهده در دیوار"
            className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-background transition-colors hover:border-primary/50 hover:text-primary">
            <ExternalLink className="size-4" />
          </a>
        )}
        {mapHref && (
          <a href={mapHref} target="_blank" rel="noopener noreferrer" title="موقعیت در نشان"
            className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-background transition-colors hover:border-primary/50 hover:text-primary">
            <MapPin className="size-4" />
          </a>
        )}
      </div>
    </article>
  );
}
