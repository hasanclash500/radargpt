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
import {
  configForPropertyType,
  DEFAULT_LISTING_FIELD_CONFIGS,
  type ListingFieldConfig,
  type ListingFieldDefinition,
} from "@/lib/listing-field-config";
import { DEAL_TYPES, PROPERTY_TYPES, toEnglishDigits } from "@/lib/parser";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  mapsUrl: "",
  phone: "",
};

const STEP_TITLES = [
  "نوع ملک و شرایط",
  "مشخصات تخصصی",
  "اطلاعات داخلی",
  "محتوا و مرور",
];

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  }) => Promise<void>;
}

export default function ManualListingDialog({
  open,
  onOpenChange,
  onSave,
}: ManualListingDialogProps) {
  const settings = useQuery(api.folders.getSettings, {});
  const [form, setForm] = useState(EMPTY);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

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

  const num = (value: string) => {
    const n = Number(toEnglishDigits(value).replace(/[^\d.]/g, ""));
    return value.trim() !== "" && Number.isFinite(n) ? n : undefined;
  };

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
      await onSave({
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim() || undefined,
        area: num(form.area),
        rooms: num(form.rooms),
        priceMillion: num(form.priceMillion),
        depositMillion: num(form.depositMillion),
        rentMillion: num(form.rentMillion),
        dealType: form.dealType,
        propertyType: form.propertyType,
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
        divarUrl: form.divarUrl.trim() || undefined,
        mapsUrl: form.mapsUrl.trim() || undefined,
        date,
        dateRaw: date.replace(/-/g, "/"),
        phone,
        customFields,
      });
      setForm(EMPTY);
      setCustomValues({});
      setStep(0);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ثبت آگهی ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">ثبت آگهی</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>ثبت مرحله‌ای آگهی</DialogTitle>
          <DialogDescription>
            اطلاعات در چهار مرحله ذخیره می‌شود. شماره مالک، آدرس دقیق و لینک‌های منبع
            فقط داخلی هستند و در نسخه عمومی نمایش داده نمی‌شوند.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2">
          {STEP_TITLES.map((title, index) => (
            <div key={title} className="min-w-0">
              <div
                className={`h-1.5 rounded-full ${
                  index <= step ? "bg-primary" : "bg-muted"
                }`}
              />
              <p
                className={`mt-2 truncate text-center text-[10px] font-bold ${
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
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="نوع معامله">
                <Select
                  value={form.dealType}
                  onValueChange={(value) => set("dealType", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dealTypes.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
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

              <Field label="قیمت کل (میلیون تومان)">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.priceMillion}
                  onChange={(e) => set("priceMillion", e.target.value)}
                />
              </Field>

              <Field label="ودیعه (میلیون تومان)">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.depositMillion}
                  onChange={(e) => set("depositMillion", e.target.value)}
                />
              </Field>

              <Field label="اجاره ماهانه (میلیون تومان)">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.rentMillion}
                  onChange={(e) => set("rentMillion", e.target.value)}
                />
              </Field>
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
                        setCustomValues((current) => ({
                          ...current,
                          [field.id]: value,
                        }))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-6 text-muted-foreground">
                اطلاعات این مرحله داخلی است. در صفحه عمومی فقط نام شهر نمایش داده می‌شود.
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
                <Input
                  value={form.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="آدرس دقیق (داخلی)">
                  <Input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="لینک دیوار">
                <Input
                  dir="ltr"
                  value={form.divarUrl}
                  onChange={(e) => set("divarUrl", e.target.value)}
                  placeholder="https://divar.ir/v/..."
                />
              </Field>

              <Field label="لینک نقشه">
                <Input
                  dir="ltr"
                  value={form.mapsUrl}
                  onChange={(e) => set("mapsUrl", e.target.value)}
                />
              </Field>
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
                  rows={8}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="ویژگی‌های واقعی ملک، زیرساخت، دسترسی، امکانات، محدودیت‌ها و شرایط معامله را کامل و طبیعی بنویسید."
                />
              </Field>

              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs font-extrabold">مرور قبل از ثبت</p>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>شهر: <b className="text-foreground">{form.city}</b></span>
                  <span>ملک: <b className="text-foreground">{form.propertyType}</b></span>
                  <span>معامله: <b className="text-foreground">{form.dealType}</b></span>
                  <span>متراژ: <b className="text-foreground">{form.area || "—"}</b></span>
                  <span>
                    فیلد تخصصی تکمیل‌شده:{" "}
                    <b className="text-foreground">
                      {dynamicFields.filter((field) =>
                        field.type === "boolean"
                          ? true
                          : Boolean(customValues[field.id]?.trim()),
                      ).length.toLocaleString("fa-IR")}
                    </b>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
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
            <Button type="button" onClick={() => void submit()} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              ثبت نهایی آگهی
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
          {field.unit ? (
            <p className="mt-1 text-[10px] text-muted-foreground">{field.unit}</p>
          ) : null}
        </div>
        <Switch
          checked={value === "بله"}
          onCheckedChange={(checked) => onChange(checked ? "بله" : "خیر")}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={field.label} required={field.required}>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
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
          <Textarea
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </Field>
      </div>
    );
  }

  return (
    <Field
      label={field.unit ? `${field.label} (${field.unit})` : field.label}
      required={field.required}
    >
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
