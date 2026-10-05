export async function resizeImageFile(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<File> {
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const quality = options.quality ?? 0.84;

  if (!file.type.startsWith("image/")) {
    throw new Error("فایل انتخاب‌شده تصویر نیست.");
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("خواندن تصویر ممکن نشد."));
      img.src = url;
    });

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    if (scale === 1 && file.size <= 1_500_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("مرورگر ادیوسازن کوچک‌سازی تصویر را ندارد.");

    // Preserve the complete image: proportional resize only, never crop.
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("فشرده‌سازی تصویر ناموفق بود."))),
        "image/webp",
        quality,
      );
    });

    const base = file.name.replace(/\.[^.]+$/, "") || "listing";
    return new File([blob], `${base}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
