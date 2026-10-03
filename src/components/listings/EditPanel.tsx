import MapPicker, { type MapPoint } from "@/components/listings/MapPicker";
import { neshanAppLocationUrl } from "@/lib/neshan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ExternalLink, FolderPlus, NotebookPen, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface Folder {
  _id: string;
  name: string;
  color?: string;
}

interface EditPanelProps {
  notes: string;
  onSaveNotes: (notes: string) => Promise<void>;
  folderIds: string[];
  folders: Folder[];
  onToggleFolder: (folderId: string) => Promise<void>;
  currentAddress: string;
  currentDivarUrl: string;
  currentMapsUrl: string;
  currentLatitude?: number;
  currentLongitude?: number;
  onSaveLocation: (patch: {
    address: string;
    divarUrl: string;
    mapsUrl: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  canEdit: boolean;
}

function mapsUrl(point: MapPoint) {
  return neshanAppLocationUrl(point.lat, point.lng);
}

export default function EditPanel({
  notes,
  onSaveNotes,
  folderIds,
  folders,
  onToggleFolder,
  currentAddress,
  currentDivarUrl,
  currentMapsUrl,
  currentLatitude,
  currentLongitude,
  onSaveLocation,
  canEdit,
}: EditPanelProps) {
  const [open, setOpen] = useState(false);
  const [draftNotes, setDraftNotes] = useState(notes);
  const [address, setAddress] = useState(currentAddress);
  const [divar, setDivar] = useState(currentDivarUrl);
  const [point, setPoint] = useState<MapPoint | null>(
    currentLatitude != null && currentLongitude != null
      ? { lat: currentLatitude, lng: currentLongitude }
      : null,
  );
  const [saving, setSaving] = useState(false);

  const toggleOpen = () => {
    setDraftNotes(notes);
    setAddress(currentAddress);
    setDivar(currentDivarUrl);
    setPoint(
      currentLatitude != null && currentLongitude != null
        ? { lat: currentLatitude, lng: currentLongitude }
        : null,
    );
    setOpen((value) => !value);
  };

  if (!canEdit) return null;

  const saveAll = async () => {
    setSaving(true);
    try {
      if (draftNotes !== notes) await onSaveNotes(draftNotes);

      const nextMapsUrl = point ? mapsUrl(point) : currentMapsUrl;
      const locationChanged =
        address !== currentAddress ||
        divar !== currentDivarUrl ||
        nextMapsUrl !== currentMapsUrl ||
        point?.lat !== currentLatitude ||
        point?.lng !== currentLongitude;

      if (locationChanged) {
        await onSaveLocation({
          address,
          divarUrl: divar,
          mapsUrl: nextMapsUrl,
          latitude: point?.lat,
          longitude: point?.lng,
        });
      }

      toast.success("تغییرات ذخیره شد");
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("ذخیرهٔ تغییرات ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={toggleOpen}>
          {open ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
          یادداشت و بایگانی
        </Button>

        {folders.map((folder) => {
          const active = folderIds.includes(folder._id);
          return (
            <button
              key={folder._id}
              type="button"
              onClick={() => void onToggleFolder(folder._id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors",
                active
                  ? "border-primary bg-primary/12 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              )}
            >
              {active && <NotebookPen className="size-3" />}
              {folder.name}
            </button>
          );
        })}

        {folders.length === 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <FolderPlus className="size-3" />
            زونکنی ساخته نشده — از بخش بایگانی بسازید
          </span>
        )}
      </div>

      {!open && notes && (
        <p className="line-clamp-2 whitespace-pre-line text-[13px] leading-6 text-muted-foreground">
          {notes}
        </p>
      )}

      {open && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">یادداشت روی پرونده</Label>
            <Textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              placeholder="مثلاً: تماس گرفته شد، قیمت قابل مذاکره…"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">آدرس دقیق داخلی</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="آدرس دقیق ملک" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">موقعیت روی نقشه</Label>
            <MapPicker value={point} onChange={setPoint} />
            {currentMapsUrl && !point && (
              <a
                href={currentMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary"
              >
                <ExternalLink className="size-3.5" />
                مشاهده موقعیت قبلی
              </a>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">لینک دیوار</Label>
            <Input
              dir="ltr"
              value={divar}
              onChange={(e) => setDivar(e.target.value)}
              placeholder="https://divar.ir/v/..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              انصراف
            </Button>
            <Button type="button" size="sm" className="gap-1.5" disabled={saving} onClick={() => void saveAll()}>
              <Save className="size-4" />
              {saving ? "در حال ذخیره…" : "ذخیره"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
