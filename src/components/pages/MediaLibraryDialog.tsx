import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  FileText,
  ImagePlus,
  Loader2,
  Search,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export type SiteMediaItem = {
  _id: any;
  storageId: any;
  kind: "image" | "font" | "video" | "file";
  fileName: string;
  mimeType: string;
  size?: number;
  title?: string;
  alt?: string;
  url?: string | null;
  createdAt: number;
};

function kindForFile(file: File): SiteMediaItem["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (
    file.type.startsWith("font/") ||
    /\.(woff2?|ttf|otf)$/i.test(file.name)
  ) {
    return "font";
  }
  if (file.type.startsWith("video/")) return "video";
  return "file";
}

function acceptForKind(kind?: SiteMediaItem["kind"] | "all") {
  if (kind === "image") return "image/*";
  if (kind === "font") return ".woff,.woff2,.ttf,.otf,font/*";
  if (kind === "video") return "video/*";
  return "image/*,.woff,.woff2,.ttf,.otf,video/*,.pdf";
}

export default function MediaLibraryDialog({
  open,
  onOpenChange,
  kind = "all",
  onSelect,
  title = "کتابخانه رسانه دیوساز",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind?: SiteMediaItem["kind"] | "all";
  onSelect: (item: SiteMediaItem) => void;
  title?: string;
}) {
  const queryKind = kind === "all" ? undefined : kind;
  const media = useQuery(api.pages.listMedia, { kind: queryKind }) as
    | SiteMediaItem[]
    | undefined;
  const generateUploadUrl = useMutation(api.pages.generateMediaUploadUrl);
  const saveMedia = useMutation(api.pages.saveMedia);
  const deleteMedia = useMutation(api.pages.deleteMedia);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return media || [];
    return (media || []).filter((item) =>
      [item.fileName, item.title, item.alt, item.kind]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [media, search]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 20)) {
        const fileKind = kindForFile(file);
        if (kind !== "all" && fileKind !== kind) {
          toast.error(
            kind === "image"
              ? "فقط فایل تصویری انتخاب کنید."
              : kind === "font"
                ? "فقط فایل فونت WOFF/WOFF2/TTF/OTF انتخاب کنید."
                : "نوع فایل مجاز نیست.",
          );
          continue;
        }

        const uploadUrl = await generateUploadUrl({});
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!response.ok) throw new Error("آپلود فایل ناموفق بود.");
        const payload = await response.json();

        await saveMedia({
          storageId: payload.storageId,
          kind: fileKind,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          title: file.name.replace(/\.[^.]+$/, ""),
          alt:
            fileKind === "image"
              ? file.name.replace(/[-_]+/g, " ").replace(/\.[^.]+$/, "")
              : undefined,
        });
      }
      toast.success("فایل در کتابخانه رسانه ذخیره شد");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "آپلود رسانه انجام نشد",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="flex max-h-[88dvh] w-[min(1100px,calc(100vw-1rem))] max-w-none flex-col overflow-hidden rounded-3xl p-0"
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-5 pb-4 pt-5 pe-12 text-right">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-right">
            تصویر و فونت را روی Storage خود دیوساز نگه دارید؛ بدون وابستگی به
            لینک خارجی.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 flex-col gap-2 border-b border-border/60 p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجو در رسانه‌ها…"
              className="pe-10"
            />
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptForKind(kind)}
            className="hidden"
            onChange={(event) => void upload(event.target.files)}
          />
          <Button
            type="button"
            className="gap-2"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            آپلود فایل
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {media === undefined ? (
            <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="me-2 size-4 animate-spin" />
              در حال دریافت رسانه‌ها…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-border text-center">
              <ImagePlus className="size-9 text-muted-foreground/40" />
              <strong className="mt-3 text-sm">هنوز فایلی ندارید</strong>
              <span className="mt-1 text-xs text-muted-foreground">
                اولین تصویر یا فونت را آپلود کنید.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {filtered.map((item) => (
                <div
                  key={String(item._id)}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card"
                >
                  <button
                    type="button"
                    className="block w-full text-right"
                    onClick={() => {
                      onSelect(item);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted/50">
                      {item.kind === "image" && item.url ? (
                        <img
                          src={item.url}
                          alt={item.alt || item.fileName}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      ) : item.kind === "font" ? (
                        <div className="text-center">
                          <Type className="mx-auto size-9 text-primary" />
                          <span className="mt-2 block text-[10px] text-muted-foreground">
                            فونت
                          </span>
                        </div>
                      ) : (
                        <FileText className="size-9 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-2.5">
                      <strong className="block truncate text-[11px]">
                        {item.title || item.fileName}
                      </strong>
                      <span className="mt-1 block truncate text-[9px] text-muted-foreground">
                        {item.fileName}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="absolute start-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-destructive opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                    disabled={removingId === String(item._id)}
                    aria-label="حذف رسانه"
                    onClick={async (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (!window.confirm("این فایل از کتابخانه حذف شود؟")) return;
                      setRemovingId(String(item._id));
                      try {
                        await deleteMedia({ id: item._id });
                        toast.success("رسانه حذف شد");
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "حذف رسانه انجام نشد",
                        );
                      } finally {
                        setRemovingId("");
                      }
                    }}
                  >
                    {removingId === String(item._id) ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
