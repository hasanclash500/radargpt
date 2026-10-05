import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Listing } from "@/lib/parser";
import { Loader2, PencilLine, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type ListingEditPatch = {
  city?: string;
  neighborhood?: string;
  area?: number;
  rooms?: number;
  dealType?: string;
  propertyType?: string;
  phone?: string;
  title?: string;
  description?: string;
  priceMillion?: number;
  depositMillion?: number;
  rentMillion?: number;
  pricePerMeter?: number;
};

function toText(value: number | null | undefined) {
  return value == null || value === 0 ? "" : String(value);
}

function numberOrUndefined(value: string) {
  const normalized = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،٬\s]/g, "");
  if (!normalized) return undefined;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

export default function FullListingEditDialog({
  listing,
  onSave,
  defaultOpen = false,
  onOpenChange,
}: {
  listing: Listing;
  onSave: (patch: ListingEditPatch) => Promise<void>;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    city: listing.city ?? "",
    neighborhood: listing.neighborhood ?? "",
    area: toText(listing.area),
    rooms: toText(listing.rooms),
    dealType: listing.dealType ?? "",
    propertyType: listing.propertyType ?? "",
    phone: listing.phone ?? "",
    title: listing.title ?? "",
    description: listing.description ?? "",
    priceMillion: toText(listing.priceMillion),
    depositMillion: toText(listing.depositMillion),
    rentMillion: toText(listing.rentMillion),
    pricePerMeter: toText(listing.pricePerMeter),
  });

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    setDraft({
      city: listing.city ?? "",
      neighborhood: listing.neighborhood ?? "",
      area: toText(listing.area),
      rooms: toText(listing.rooms),
      dealType: listing.dealType ?? "",
      propertyType: listing.propertyType ?? "",
      phone: listing.phone ?? "",
      title: listing.title ?? "",
      description: listing.description ?? "",
      priceMillion: toText(listing.priceMillion),
      depositMillion: toText(listing.depositMillion),
      rentMillion: toText(listing.rentMillion),
      pricePerMeter: toText(listing.pricePerMeter),
    });
  }, [open, listing]);

  const set = (key: keyof typeof draft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function save() {
    const phone = draft.phone.replace(/\D/g, "");
    if (phone && !/^09\d{9}$/.test(phone)) {
      toast.error("شماره تماس باید ۱۱ رقم و با 09 شروع شود.");
      return;
    }
    if (!draft.city.trim() || !draft.propertyType.trim()) {
      toast.error("شهر و نوع ملک را کامل کنید.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        city: draft.city.trim(),
        neighborhood: draft.neighborhood.trim(),
        area: numberOrUndefined(draft.area),
        rooms: numberOrUndefined(draft.rooms),
        dealType: draft.dealType.trim(),
        propertyType: draft.propertyType.trim(),
        phone: phone || undefined,
        title: draft.title.trim(),
        description: draft.description.trim(),
        priceMillion: numberOrUndefined(draft.priceMillion),
        depositMillion: numberOrUndefined(draft.depositMillion),
        rentMillion: numberOrUndefined(draft.rentMillion),
        pricePerMeter: numberOrUndefined(draft.pricePerMeter),
      });
      toast.success("اطلاعات آگهی بروزرسانی شد");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ویرایش آگهی ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <PencilLine className="size-3.5" />
          ویرایش
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] max-h-[94dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>ویرایش کامل آگهی</DialogTitle>
          <DialogDescription>
            مشخصات، قیمت، شماره تماس، عنوان و توضیحات این فایل را تغییر دهید.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="شهر">
            <Input value={draft.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="محله">
            <Input value={draft.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
          </Field>
          <Field label="نوع ملک">
            <Input value={draft.propertyType} onChange={(e) => set("propertyType", e.target.value)} />
          </Field>
          <Field label="نوع معامله">
            <Input value={draft.dealType} onChange={(e) => set("dealType", e.target.value)} />
          </Field>
          <Field label="متراژ">
            <Input dir="ltr" inputMode="decimal" value={draft.area} onChange={(e) => set("area", e.target.value)} />
          </Field>
          <Field label="تعداد اتاق">
            <Input dir="ltr" inputMode="numeric" value={draft.rooms} onChange={(e) => set("rooms", e.target.value)} />
          </Field>
          <Field label="قیمت کل (میلیون تومان)">
            <Input dir="ltr" inputMode="decimal" value={draft.priceMillion} onChange={(e) => set("priceMillion", e.target.value)} />
          </Field>
          <Field label="ودیعه / رهن (میلیون تومان)">
            <Input dir="ltr" inputMode="decimal" value={draft.depositMillion} onChange={(e) => set("depositMillion", e.target.value)} />
          </Field>
          <Field label="اجاره ماهانه (میلیون تومان)">
            <Input dir="ltr" inputMode="decimal" value={draft.rentMillion} onChange={(e) => set("rentMillion", e.target.value)} />
          </Field>
          <Field label="قیمت هر متر (میلیون تومان)">
            <Input dir="ltr" inputMode="decimal" value={draft.pricePerMeter} onChange={(e) => set("pricePerMeter", e.target.value)} />
          </Field>
          <Field label="شماره تماس">
            <Input dir="ltr" inputMode="tel" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="عنوان">
              <Input value={draft.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="توضیحات">
              <Textarea rows={7} value={draft.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            انصراف
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            ذخیره تغییرات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
