import MapPicker, { type MapPoint } from "@/components/listings/MapPicker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/format";
import { resizeImageFile } from "@/lib/image-resize";
import { neshanAppLocationUrl } from "@/lib/neshan";
import {
  configForPropertyType,
  DEFAULT_LISTING_FIELD_CONFIGS,
  type ListingFieldConfig,
  type ListingFieldDefinition,
} from "@/lib/listing-field-config";
import { DEAL_TYPES, PROPERTY_TYPES, toEnglishDigits } from "@/lib/parser";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const EMPTY = {
  city: "",
  neighborhood: "",
  area: "",
  rooms: "",
  priceMillion: "",
  depositMillion: "",
  rentMillion: "",
  dealType: DEAL_TYPES[0] as string,
  propertyType: PROPERTY_TYPES[0] as string,
  title: "",
  description: "",
  address: "",
  divarUrl: "",
  phone: "",
};

const STEP_TITLES = [
  "نوع ملک و قیمت",
  "مشخصات تخصصی",
  "مالک و موقعیت",
  "محتوا و تصاویر",
];

type PendingImage = {
  file: File;
  preview: string;
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function numberValue(value: string) {
  const normalized = toEnglishDigits(value).replace(/[^\d.]/g, "");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function moneyMillion(value: string) {
  const parsed = numberValue(value);
  if (parsed == null) return undefined;
  // کاربر می‌تواند «۵۰۰۰» (میلیون) یا «۵٬۰۰۰٬۰۰۰٬۰۰۰» (تومان) وارد کند.
  return parsed >= 1_000_000 ? parsed / 1_000_000 : parsed;
}

function mapUrl(point: MapPoint | null) {
  return point
    ? neshanAppLocationUrl(point.lat, point.lng)
    : undefined;
}

export interface ManualListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: {
    city: string;
    neighborhood?: string;
    area?: number;
    rooms?: number;
    priceMillion?: number;
    depositMillion?: number;
    rentMillion?: number;
    dealType: string;
    propertyType: string;
    title?: string;
    description?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    divarUrl?: string;
    mapsUrl?: string;
    date: string;
    dateRaw: string;
    phone: string;
    customFields?: Array<{
      fieldId: string;
      label: string;
      value: string;
      type: string;
      unit?: string;
      public: boolean;
    }>;
  }) => Promise<string>;
}

export default function ManualListingDialog({
  open,
  onOpenChange,
  onSave,
}: ManualListingDialogProps) {
  const settings = useQuery(api.folders.getSettings, {});
  const generateUploadUrl = useMutation(api.listings.generateListingUploadUrl);
  const saveImages = useMutation(api.listings.saveListingImages);

  const [form, setForm] = useState(EMPTY);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [mapPoint, setMapPoint] = useState<MapPoint | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const configs =
    ((settings?.listingFieldConfigs ?? DEFAULT_LISTING_FIELD_CONFIGS) as ListingFieldConfig[]);
  const selectedConfig = configForPropertyType(configs, form.propertyType);
  const dynamicFields = useMemo(
    () => [...(selectedConfig?.fields ?? [])].sort((a, b) => a.order - b.order),
    [selectedConfig],
  );

  const propertyTypes = useMemo(
    () =>
      Array.from(
        new Set([
          ...PROPERTY_TYPES,
          ...(settings?.customPropertyTypes ?? []),
          ...configs.flatMap((config) => config.propertyTypes),
        ]),
      ),
    [settings?.customPropertyTypes, configs],
  );

  const dealTypes = useMemo(
    () => Array.from(new Set([...DEAL_TYPES, ...(settings?.customDeals ?? [])])),
    [settings?.customDeals],
  );

  useEffect(() => {
    if (open) {
      setStep(0);
      setCustomValues({});
    }
  }, [open]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const reset = () => {
    pendingImages.forEach((image) => URL.revokeObjectURL(image.preview));
    setPendingImages([]);
    setMapPoint(null);
    setForm(EMPTY);
    setCustomValues({});
    setStep(0);
  };

  async function addImages(fileList: FileList | null) {
    if (!fileList?.length) return;
    const room = Math.max(0, 20 - pendingImages.length);
    if (!room) {
      toast.error("حداکثر ۲۰ عکس برای هر آگهی قابل ثبت است.");
      return;
    }

    const picked = Array.from(fileList).slice(0, room);
    if (picked.some((file) => !file.type.startsWith("image/"))) {
      toast.error("فقط فایل تصویری انتخاب کنید.");
      return;
    }

    setProcessingImages(true);
    try {
      const prepared: PendingImage[] = [];
      for (const file of picked) {
        if (file.size > 25 * 1024 * 1024) {
          throw new Error("حجم فایل اولیه نباید بیشتر از ۲۵ مگابایت باشد.");
        }
        const resized = await resizeImageFile(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.84,
        });
        prepared.push({
          file: resized,
          preview: URL.createObjectURL(resized),
        });
      }
      setPendingImages((current) => [...current, ...prepared]);
      toast.success(`${prepared.length.toLocaleString("fa-IR")} عکس آماده شد`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "آماده‌سازی تصویر ناموفق بود");
    } finally {
      setProcessingImages(false);
      if (galleryRef.current) galleryRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  function removePendingImage(index: number) {
    setPendingImages((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((_, i) => i !== index);
    });
  }

  function validateStep(currentStep: number) {
    if (currentStep === 0) {
      if (!form.city.trim()) {
        toast.error("نام شهر را وارد کنید.");
        return false;
      }
      if (!form.propertyType) {
        toast.error("نوع ملک را انتخاب کنید.");
        return false;
      }
      if (
        moneyMillion(form.priceMillion) == null &&
        moneyMillion(form.depositMillion) == null &&
        moneyMillion(form.rentMillion) == null
      ) {
        toast.error("حداقل یکی از قیمت، ودیعه یا اجاره را وارد کنید.");
        return false;
      }
    }

    if (currentStep === 1) {
      const missing = dynamicFields.find(
        (field) =>
          field.required &&
          field.type !== "boolean" &&
          !(customValues[field.id] ?? "").trim(),
      );
      if (missing) {
        toast.error(`فیلد «${missing.label}» الزامی است.`);
        return false;
      }
    }

    if (currentStep === 2) {
      const phone = toEnglishDigits(form.phone).replace(/\D/g, "");
      if (!/^09\d{9}$/.test(phone)) {
        toast.error("شماره مالک باید ۱۱ رقم و با 09 شروع شود.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (form.title.trim().length < 8) {
        toast.error("عنوان آگهی را کامل‌تر بنویسید.");
        return false;
      }
      if (form.description.trim().length < 80) {
        toast.error("توضیحات آگهی برای انتشار حرفه‌ای خیلی کوتاه است.");
        return false;
      }
    }

    return true;
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((value) => Math.min(3, value + 1));
  }

  async function uploadPendingImages(key: string) {
    if (!pendingImages.length) return;
    const uploaded: Array<{
      storageId: any;
      alt: string;
      order: number;
      featured: boolean;
    }> = [];

    for (let i = 0; i < pendingImages.length; i++) {
      const image = pendingImages[i];
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": image.file.type },
        body: image.file,
      });
      if (!response.ok) throw new Error("آپلود یکی از تصاویر ناموفق بود.");
      const result = await response.json();
      const area = form.area ? ` ${form.area} متری` : "";
      uploaded.push({
        storageId: result.storageId,
        alt: [form.dealType, form.propertyType, area, "در", form.city, "| دیوساز"]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
        order: i,
        featured: i === 0,
      });
    }

    await saveImages({ key, images: uploaded });
  }

  async function submit() {
    if (!validateStep(3)) return;
    const phone = toEnglishDigits(form.phone).replace(/\D/g, "");
    const date = today();

    const customFields = dynamicFields
      .map((field) => ({
        fieldId: field.id,
        label: field.label,
        value:
          field.type === "boolean"
            ? customValues[field.id] || "خیر"
            : (customValues[field.id] ?? "").trim(),
        type: field.type,
        unit: field.unit,
        public: field.public,
      }))
      .filter((field) => field.value !== "");

    setSaving(true);
    try {
      const key = await onSave({
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim() || undefined,
        area: numberValue(form.area),
        rooms: numberValue(form.rooms),
        priceMillion: moneyMillion(form.priceMillion),
        depositMillion: moneyMillion(form.depositMillion),
        rentMillion: moneyMillion(form.rentMillion),
        dealType: form.dealType,
        propertyType: form.propertyType,
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
        latitude: mapPoint?.lat,
        longitude: mapPoint?.lng,
        divarUrl: form.divarUrl.trim() || undefined,
        mapsUrl: mapUrl(mapPoint),
        date,
        dateRaw: date.replace(/-/g, "/"),
        phone,
        customFields,
      });

      try {
        await uploadPendingImages(key);
      } catch (error) {
        toast.error("آگهی ثبت شد ولی آپلود بعضی تصاویر کامل نشد.", {
          description: error instanceof Error ? error.message : undefined,
        });
      }

      reset();
      onOpenChange(false);
      toast.success("آگهی با اطلاعات و تصاویر ثبت شد");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ثبت آگهی ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  }

  const pricePreview = moneyMillion(form.priceMillion);
  const depositPreview = moneyMillion(form.depositMillion);
  const rentPreview = moneyMillion(form.rentMillion);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !saving) reset();
        onOpenChange(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span>ثبت آگهی</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-1rem)] max-h-[96dvh] overflow-y-auto p-4 sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle>ثبت مرحله‌ای آگهی</DialogTitle>
          <DialogDescription>
            اطلاعات داخلی، شماره مالک و موقعیت دقیق در نسخه عمومی نمایش داده نمی‌شوند.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {STEP_TITLES.map((title, index) => (
            <div key={title} className="min-w-0">
              <div
                className={`h-1.5 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`}
              />
              <p
                className={`mt-2 line-clamp-2 text-center text-[9px] font-bold leading-4 sm:text-[10px] ${
                  index === step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {title}
              </p>
            </div>
          ))}
        </div>

        <div className="min-h-[390px] py-2">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="شهر" required>
                <Input
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="شهریار"
                />
              </Field>

              <Field label="نوع ملک" required>
                <Select
                  value={form.propertyType}
                  onValueChange={(value) => {
                    set("propertyType", value);
                    setCustomValues({});
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="نوع معامله">
                <Select value={form.dealType} onValueChange={(value) => set("dealType", value)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dealTypes.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="متراژ (متر)">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                />
              </Field>

              <Field label="تعداد اتاق">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.rooms}
                  onChange={(e) => set("rooms", e.target.value)}
                />
              </Field>

              <MoneyField
                label="قیمت کل"
                value={form.priceMillion}
                onChange={(value) => set("priceMillion", value)}
                preview={pricePreview}
              />
              <MoneyField
                label="ودیعه"
                value={form.depositMillion}
                onChange={(value) => set("depositMillion", value)}
                preview={depositPreview}
              />
              <MoneyField
                label="اجاره ماهانه"
                value={form.rentMillion}
                onChange={(value) => set("rentMillion", value)}
                preview={rentPreview}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-extrabold">
                  مشخصات {selectedConfig?.name || form.propertyType}
                </p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  این فیلدها از تنظیمات مدیر می‌آیند و برای هر دسته قابل ویرایش هستند.
                </p>
              </div>

              {dynamicFields.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  برای این نوع ملک هنوز فیلد اختصاصی تعریف نشده است.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {dynamicFields.map((field) => (
                    <DynamicField
                      key={field.id}
                      field={field}
                      value={customValues[field.id] ?? ""}
                      onChange={(value) =>
                        setCustomValues((current) => ({ ...current, [field.id]: value }))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-6 text-muted-foreground sm:col-span-2">
                شماره مالک، آدرس و نقطه نقشه فقط برای دفتر هستند؛ در صفحه عمومی فقط نام شهر نمایش داده می‌شود.
              </div>

              <Field label="شماره مالک (خصوصی)" required>
                <Input
                  dir="ltr"
                  inputMode="tel"
                  placeholder="0912..."
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>

              <Field label="محله (داخلی)">
                <Input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
              </Field>

              <div className="sm:col-span-2">
                <Field label="آدرس دقیق (داخلی)">
                  <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="موقعیت دقیق ملک روی نقشه">
                  <MapPicker value={mapPoint} onChange={setMapPoint} />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="لینک دیوار (اختیاری)">
                  <Input
                    dir="ltr"
                    value={form.divarUrl}
                    onChange={(e) => set("divarUrl", e.target.value)}
                    placeholder="https://divar.ir/v/..."
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Field label="عنوان آگهی" required>
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder={`${form.dealType} ${form.propertyType}${form.area ? ` ${form.area} متری` : ""} در ${form.city || "شهریار"}`}
                />
              </Field>

              <Field label="توضیحات کامل" required>
                <Textarea
                  rows={7}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="ویژگی‌های واقعی ملک، زیرساخت، دسترسی، ادیوسازنات، محدودیت‌ها و شرایط معامله را کامل و طبیعی بنویسید."
                />
              </Field>

              <section className="space-y-3 rounded-2xl border border-border/70 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">تصاویر آگهی</p>
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                      تصویر کامل حفظ می‌شود؛ فقط متناسب کوچک و فشرده می‌شود، بدون برش.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {pendingImages.length.toLocaleString("fa-IR")} / ۲۰
                  </span>
                </div>

                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void addImages(e.target.files)}
                />
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => void addImages(e.target.files)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={processingImages || pendingImages.length >= 20}
                    onClick={() => galleryRef.current?.click()}
                  >
                    {processingImages ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                    گالری
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={processingImages || pendingImages.length >= 20}
                    onClick={() => cameraRef.current?.click()}
                  >
                    <Camera className="size-4" />
                    دوربین
                  </Button>
                </div>

                {pendingImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {pendingImages.map((image, index) => (
                      <div key={image.preview} className="relative overflow-hidden rounded-xl border border-border bg-muted">
                        <img
                          src={image.preview}
                          alt={`پیش‌نمایش تصویر ${index + 1}`}
                          className="aspect-square h-full w-full object-contain p-1"
                        />
                        {index === 0 && (
                          <span className="absolute start-1.5 top-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[9px] font-bold text-primary">
                            شاخص
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePendingImage(index)}
                          className="absolute end-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 text-destructive shadow"
                          aria-label="حذف تصویر"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs font-extrabold">مرور قبل از ثبت</p>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>شهر: <b className="text-foreground">{form.city}</b></span>
                  <span>ملک: <b className="text-foreground">{form.propertyType}</b></span>
                  <span>معامله: <b className="text-foreground">{form.dealType}</b></span>
                  <span>متراژ: <b className="text-foreground">{form.area || "—"}</b></span>
                  <span>تصاویر: <b className="text-foreground">{pendingImages.length.toLocaleString("fa-IR")}</b></span>
                  <span>نقشه: <b className="text-foreground">{mapPoint ? "انتخاب شده" : "انتخاب نشده"}</b></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 -mx-4 -mb-4 flex-row justify-between gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || saving}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            className="gap-1.5"
          >
            <ArrowRight className="size-4" />
            قبلی
          </Button>

          {step < 3 ? (
            <Button type="button" onClick={next} className="gap-1.5">
              مرحله بعد
              <ArrowLeft className="size-4" />
            </Button>
          ) : (
            <Button type="button" onClick={() => void submit()} disabled={saving || processingImages} className="gap-1.5">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              ثبت نهایی
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  preview,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  preview?: number;
}) {
  return (
    <Field label={`${label} (میلیون تومان یا مبلغ کامل تومان)`}>
      <Input
        type="text"
        inputMode="numeric"
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="مثلاً 5000 یا 5000000000"
      />
      {preview != null && preview > 0 && (
        <p className="text-[10px] font-bold text-primary">{formatPrice(preview)}</p>
      )}
    </Field>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: ListingFieldDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3">
        <div>
          <p className="text-xs font-bold">
            {field.label}
            {field.required ? <span className="text-destructive"> *</span> : null}
          </p>
          {field.unit ? <p className="mt-1 text-[10px] text-muted-foreground">{field.unit}</p> : null}
        </div>
        <Switch checked={value === "بله"} onCheckedChange={(checked) => onChange(checked ? "بله" : "خیر")} />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={field.label} required={field.required}>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="sm:col-span-2">
        <Field label={field.label} required={field.required}>
          <Textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
        </Field>
      </div>
    );
  }

  return (
    <Field label={field.unit ? `${field.label} (${field.unit})` : field.label} required={field.required}>
      <Input
        type={field.type === "number" ? "number" : "text"}
        inputMode={field.type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    </Field>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
