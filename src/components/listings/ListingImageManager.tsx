import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Listing } from "@/lib/parser";
import { resizeImageFile } from "@/lib/image-resize";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type GalleryImage = {
  storageId: any;
  url: string | null;
  alt: string;
  order: number;
  featured: boolean;
};

function autoAlt(listing: Listing, index: number) {
  const area = listing.area ? ` ${listing.area} متری` : "";
  return [
    listing.dealType,
    listing.propertyType,
    area,
    "در",
    listing.city,
    index > 0 ? `- تصویر ${index + 1}` : "",
    "| مکا",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ListingImageManager({ listing }: { listing: Listing }) {
  const images = useQuery(api.listings.getListingImages, { key: listing.id }) as
    | GalleryImage[]
    | undefined;
  const generateUploadUrl = useMutation(api.listings.generateListingUploadUrl);
  const saveImages = useMutation(api.listings.saveListingImages);
  const removeImage = useMutation(api.listings.removeListingImage);

  const pickerRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const normalized = (images || []).map((image, index) => ({
    storageId: image.storageId,
    alt: image.alt || autoAlt(listing, index),
    order: index,
    featured: image.featured,
  }));

  async function persist(next: typeof normalized) {
    await saveImages({
      key: listing.id,
      images: next.map((image, index) => ({
        storageId: image.storageId,
        alt: image.alt.trim() || autoAlt(listing, index),
        order: index,
        featured: image.featured,
      })),
    });
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const current = images || [];
    const remainingSlots = Math.max(0, 20 - current.length);
    const selected = Array.from(fileList).slice(0, remainingSlots);

    if (remainingSlots === 0) {
      toast.error("حداکثر ۲۰ عکس برای هر آگهی قابل ثبت است.");
      return;
    }

    const invalid = selected.find(
      (file) => !file.type.startsWith("image/") || file.size > 25 * 1024 * 1024,
    );
    if (invalid) {
      toast.error("هر فایل باید تصویر و حداکثر ۲۵ مگابایت باشد؛ قبل از آپلود خودکار کوچک می‌شود.");
      return;
    }

    setBusy(true);
    try {
      const uploaded: typeof normalized = [];
      for (let i = 0; i < selected.length; i++) {
        const file = await resizeImageFile(selected[i], {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.84,
        });
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!response.ok) throw new Error("آپلود یکی از تصاویر ناموفق بود.");
        const result = await response.json();
        uploaded.push({
          storageId: result.storageId,
          alt: autoAlt(listing, current.length + i),
          order: current.length + i,
          featured: current.length === 0 && i === 0,
        });
      }

      await persist([
        ...current.map((image, index) => ({
          storageId: image.storageId,
          alt: image.alt,
          order: index,
          featured: image.featured,
        })),
        ...uploaded,
      ]);
      toast.success(
        `${uploaded.length.toLocaleString("fa-IR")} تصویر به آگهی اضافه شد`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "آپلود تصویر ناموفق بود");
    } finally {
      setBusy(false);
      if (pickerRef.current) pickerRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= normalized.length) return;
    const next = [...normalized];
    [next[index], next[target]] = [next[target], next[index]];
    setBusy(true);
    try {
      await persist(next);
    } finally {
      setBusy(false);
    }
  }

  async function setFeatured(storageId: any) {
    setBusy(true);
    try {
      await persist(
        normalized.map((image) => ({
          ...image,
          featured: image.storageId === storageId,
        })),
      );
      toast.success("عکس شاخص تغییر کرد");
    } finally {
      setBusy(false);
    }
  }

  async function saveAlt(storageId: any, alt: string) {
    const next = normalized.map((image) =>
      image.storageId === storageId ? { ...image, alt } : image,
    );
    try {
      await persist(next);
      toast.success("Alt تصویر ذخیره شد");
    } catch {
      toast.error("ذخیره Alt ناموفق بود");
    }
  }

  async function remove(storageId: any) {
    if (!window.confirm("این تصویر از آگهی حذف شود؟")) return;
    setBusy(true);
    try {
      await removeImage({ key: listing.id, storageId });
      toast.success("تصویر حذف شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حذف تصویر ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold">تصاویر آگهی</h3>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            عکس شاخص در کارت‌ها و Open Graph استفاده می‌شود. Alt هر عکس را واقعی و توصیفی بنویسید.
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
          {(images?.length || 0).toLocaleString("fa-IR")} / ۲۰
        </span>
      </div>

      <input
        ref={pickerRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void uploadFiles(e.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void uploadFiles(e.target.files)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-2 rounded-xl"
          disabled={busy || (images?.length || 0) >= 20}
          onClick={() => pickerRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          انتخاب چند عکس
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2 rounded-xl"
          disabled={busy || (images?.length || 0) >= 20}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="size-4" />
          دوربین
        </Button>
      </div>

      {images === undefined ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          در حال دریافت تصاویر…
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs leading-6 text-muted-foreground">
          هنوز تصویری ثبت نشده است. برای آگهی عمومی بهتر است حداقل ۴ تا ۶ عکس واقعی از نمای اصلی،
          سالن، ورودی، کف/سقف و فضای اداری اضافه شود.
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((image, index) => (
            <div
              key={String(image.storageId)}
              className="grid gap-3 rounded-2xl border border-border/70 bg-background/50 p-3 sm:grid-cols-[140px_1fr]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="h-full w-full object-contain p-1"
                  />
                ) : null}
                {image.featured && (
                  <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-extrabold text-primary shadow">
                    <Star className="size-3 fill-current" />
                    شاخص
                  </span>
                )}
              </div>

              <div className="min-w-0 space-y-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">
                    Alt Text برای SEO و دسترس‌پذیری
                  </p>
                  <Input
                    defaultValue={image.alt}
                    key={`${String(image.storageId)}-${image.alt}`}
                    onBlur={(e) => {
                      if (e.target.value.trim() !== image.alt.trim()) {
                        void saveAlt(image.storageId, e.target.value);
                      }
                    }}
                    placeholder={autoAlt(listing, index)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={image.featured ? "default" : "outline"}
                    className="h-8 gap-1 text-[11px]"
                    disabled={busy}
                    onClick={() => void setFeatured(image.storageId)}
                  >
                    <Star className="size-3.5" />
                    عکس شاخص
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-8"
                    disabled={busy || index === 0}
                    onClick={() => void move(index, -1)}
                    title="انتقال به بالا"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-8"
                    disabled={busy || index === images.length - 1}
                    onClick={() => void move(index, 1)}
                    title="انتقال به پایین"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-8 border-destructive/30 text-destructive"
                    disabled={busy}
                    onClick={() => void remove(image.storageId)}
                    title="حذف تصویر"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
