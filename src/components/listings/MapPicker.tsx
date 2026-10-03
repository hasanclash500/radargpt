import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Crosshair, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

const DEFAULT_POSITION = { lat: 35.659, lng: 51.059 };

async function ensureLeaflet() {
  if (window.L) return window.L;

  if (!document.querySelector('link[data-meka-leaflet="1"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.dataset.mekaLeaflet = "1";
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-meka-leaflet="1"]',
    );
    if (existing) {
      if (window.L) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.dataset.mekaLeaflet = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("بارگذاری نقشه ممکن نشد."));
    document.body.appendChild(script);
  });

  return window.L;
}

export type MapPoint = { lat: number; lng: number };

export default function MapPicker({
  value,
  onChange,
}: {
  value?: MapPoint | null;
  onChange: (point: MapPoint) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MapPoint | null>(value ?? null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    let cancelled = false;

    setLoading(true);
    void ensureLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || !L) return;
        const initial = selected ?? value ?? DEFAULT_POSITION;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([initial.lat, initial.lng], value ? 16 : 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);

        const marker = L.marker([initial.lat, initial.lng], {
          draggable: true,
        }).addTo(map);

        const apply = (lat: number, lng: number) => {
          const point = {
            lat: Number(lat.toFixed(7)),
            lng: Number(lng.toFixed(7)),
          };
          setSelected(point);
          marker.setLatLng([point.lat, point.lng]);
        };

        map.on("click", (event: any) => {
          apply(event.latlng.lat, event.latlng.lng);
        });
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          apply(pos.lat, pos.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        setTimeout(() => map.invalidateSize(), 80);
      })
      .finally(() => setLoading(false));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [open]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: Number(position.coords.latitude.toFixed(7)),
          lng: Number(position.coords.longitude.toFixed(7)),
        };
        setSelected(point);
        mapRef.current?.setView([point.lat, point.lng], 16);
        markerRef.current?.setLatLng([point.lat, point.lng]);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-start gap-2 rounded-xl">
            <MapPin className="size-4 text-primary" />
            {value
              ? "تغییر موقعیت روی نقشه"
              : "انتخاب موقعیت ملک روی نقشه"}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl overflow-hidden p-0">
          <div className="p-4 sm:p-5">
            <DialogHeader>
              <DialogTitle>انتخاب موقعیت ملک</DialogTitle>
              <DialogDescription>
                روی نقشه لمس کنید یا نشانگر را جابه‌جا کنید. این موقعیت داخلی است و در آگهی عمومی منتشر نمی‌شود.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="relative">
            <div ref={containerRef} className="h-[55vh] min-h-[360px] w-full bg-muted" />
            {loading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 text-sm">
                در حال بارگذاری نقشه…
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={useMyLocation} className="gap-2">
              <Crosshair className="size-4" />
              موقعیت فعلی من
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                انصراف
              </Button>
              <Button
                type="button"
                disabled={!selected}
                onClick={() => {
                  if (!selected) return;
                  onChange(selected);
                  setOpen(false);
                }}
              >
                ثبت این موقعیت
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {value && (
        <p dir="ltr" className="text-[11px] text-muted-foreground">
          {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
