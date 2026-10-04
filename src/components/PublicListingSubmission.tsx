import MapPicker, { type MapPoint } from "@/components/listings/MapPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { resizeImageFile } from "@/lib/image-resize";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPinned,
  Send,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function n(value: string) {
  const cleaned = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،٬\s]/g, "");
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const MAX_PUBLIC_IMAGES = 10;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

export default function PublicListingSubmission() {
  const settings = useQuery(api.folders.getSettings, {});
  const submit = useMutation(api.listings.submitPublicListing);
  const generateUploadUrl = useMutation(api.listings.generatePublicListingUploadUrl);
  const attachImages = useMutation(api.listings.attachPublicListingImages);

  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState("");
  const [mapPoint, setMapPoint] = useState<MapPoint | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [form, setForm] = useState({
    phone: "",
    city: "شهریار",
    propertyType: "",
    dealType: "فروش",
    area: "",
    price: "",
    deposit: "",
    rent: "",
    title: "",
    description: "",
    website: "",
  });

  const types = useMemo(
    () =>
      Array.from(
        new Set([
          "سوله",
          "کارخانه",
          "کارگاه",
          "انبار",
          "زمین صنعتی",
          "دفتر اداری",
          "واحد اداری",
          ...(settings?.customPropertyTypes ?? []),
        ]),
      ),
    [settings?.customPropertyTypes],
  );

  const deals = useMemo(
    () => Array.from(new Set(["فروش", "رهن و اجاره", ...(settings?.customDeals ?? [])])),
    [settings?.customDeals],
  );

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  function addImages(fileList: FileList | null) {
    const selected = Array.from(fileList ?? []);
    if (!selected.length) return;

    const invalid = selected.find(
      (file) => !file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES,
    );
    if (invalid) {
      toast.error("هر فایل باید تصویر و حداکثر ۲۵ مگابایت باشد.");
      return;
    }

    setImages((current) => {
      const available = Math.max(0, MAX_PUBLIC_IMAGES - current.length);
      const next = [...current, ...selected.slice(0, available)];
      if (selected.length > available) {
        toast.error(`حداکثر ${MAX_PUBLIC_IMAGES} تصویر برای هر آگهی قابل ثبت است.`);
      }
      return next;
    });
  }

  async function uploadSelectedImages(key: string, uploadToken: string) {
    const storageIds: any[] = [];
    let failed = 0;

    for (const original of images) {
      try {
        const file = await resizeImageFile(original, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.84,
        });
        const uploadUrl = await generateUploadUrl({ key, uploadToken });
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!response.ok) throw new Error("آپلود تصویر ناموفق بود.");
        const result = (await response.json()) as { storageId?: any };
        if (!result.storageId) throw new Error("شناسه تصویر دریافت نشد.");
        storageIds.push(result.storageId);
      } catch {
        failed++;
      }
    }

    try {
      await attachImages({ key, uploadToken, storageIds });
    } catch {
      failed += Math.max(1, storageIds.length);
    }

    return { uploaded: storageIds.length, failed };
  }

  async function save() {
    setSaving(true);
    try {
      const result = await submit({
        phone: form.phone,
        city: form.city,
        propertyType: form.propertyType,
        dealType: form.dealType,
        area: n(form.area),
        priceMillion: n(form.price),
        depositMillion: n(form.deposit),
        rentMillion: n(form.rent),
        title: form.title,
        description: form.description,
        latitude: mapPoint?.lat,
        longitude: mapPoint?.lng,
        website: form.website || undefined,
      });

      if (!result.key || !result.uploadToken) {
        setTracking("");
        return;
      }

      const imageResult = await uploadSelectedImages(result.key, result.uploadToken);

      setTracking(result.trackingCode);
      setMapPoint(null);
      setImages([]);
      setForm((current) => ({
        ...current,
        area: "",
        price: "",
        deposit: "",
        rent: "",
        title: "",
        description: "",
      }));

      if (imageResult.failed > 0) {
        toast.warning("آگهی ثبت شد، اما بخشی از تصاویر آپلود نشد.", {
          description: "مدیر می‌تواند تصاویر را هنگام بررسی آگهی تکمیل کند.",
        });
      } else {
        toast.success(
          imageResult.uploaded > 0
            ? "آگهی و تصاویر برای بررسی ارسال شد"
            : "آگهی برای بررسی ارسال شد",
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ارسال آگهی ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="submit-listing" className="border-y border-border/60 bg-card/30 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/70 bg-background/80 p-4 shadow-sm sm:p-7">
          {tracking ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-5 text-center">
              <CheckCircle2 className="mx-auto size-9 text-emerald-600" />
              <p className="mt-3 font-extrabold">آگهی شما با موفقیت ثبت شد</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                پس از تأیید مدیر یا ادمین آگهی، در سایت منتشر می‌شود.
              </p>
              <p dir="ltr" className="mt-3 text-xs font-bold text-primary">
                Tracking: {tracking}
              </p>
              <Button type="button" variant="outline" className="mt-4" onClick={() => setTracking("")}>
                ثبت آگهی دیگر
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="شماره موبایل *">
                <Input dir="ltr" inputMode="tel" placeholder="0912..." value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="شهر *">
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="نوع ملک *">
                <select
                  value={form.propertyType}
                  onChange={(e) => set("propertyType", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">انتخاب کنید</option>
                  {types.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </Field>
              <Field label="نوع معامله *">
                <select
                  value={form.dealType}
                  onChange={(e) => set("dealType", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {deals.map((deal) => <option key={deal} value={deal}>{deal}</option>)}
                </select>
              </Field>
              <Field label="متراژ">
                <Input dir="ltr" inputMode="decimal" value={form.area} onChange={(e) => set("area", e.target.value)} />
              </Field>
              <Field label="قیمت کل (میلیون تومان)">
                <Input dir="ltr" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </Field>
              <Field label="ودیعه / رهن (میلیون تومان)">
                <Input dir="ltr" inputMode="decimal" value={form.deposit} onChange={(e) => set("deposit", e.target.value)} />
              </Field>
              <Field label="اجاره ماهانه (میلیون تومان)">
                <Input dir="ltr" inputMode="decimal" value={form.rent} onChange={(e) => set("rent", e.target.value)} />
              </Field>

              <div className="sm:col-span-2 rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="mb-3 flex items-start gap-2">
                  <MapPinned className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-extrabold">موقعیت ملک روی نقشه</p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      موقعیت دقیق فقط برای بررسی داخلی مکا ذخیره می‌شود و در آگهی عمومی نمایش داده نمی‌شود.
                    </p>
                  </div>
                </div>
                <MapPicker value={mapPoint} onChange={setMapPoint} />
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-extrabold">تصاویر ملک</p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      حداکثر {MAX_PUBLIC_IMAGES} عکس؛ تصویر کامل حفظ می‌شود و فقط متناسب کوچک و فشرده می‌شود.
                    </p>
                  </div>
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-bold hover:bg-accent">
                    <ImagePlus className="size-4 text-primary" />
                    انتخاب عکس
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={saving || images.length >= MAX_PUBLIC_IMAGES}
                      onChange={(event) => {
                        addImages(event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {images.map((file, index) => (
                      <ImagePreview
                        key={`${file.name}-${file.lastModified}-${index}`}
                        file={file}
                        onRemove={() =>
                          setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <Field label="عنوان آگهی *">
                  <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="مثلاً فروش سوله ۱۲۰۰ متری در شهریار" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="توضیحات *">
                  <Textarea rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="مشخصات ملک، امکانات، دسترسی و شرایط معامله را بنویسید." />
                </Field>
              </div>
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="hidden"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
              />
              <div className="sm:col-span-2">
                <Button type="button" className="h-12 w-full gap-2 text-base font-extrabold" disabled={saving} onClick={() => void save()}>
                  {saving ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                  {saving ? "در حال ثبت و آپلود تصاویر…" : "ارسال آگهی برای تأیید"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-background">
      <img src={url} alt={file.name} className="h-full w-full object-contain" />
      <button
        type="button"
        aria-label="حذف تصویر"
        onClick={onRemove}
        className="absolute left-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 text-destructive shadow"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
