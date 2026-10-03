import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { neshanAppLocationUrl } from "@/lib/neshan";
import { Crosshair, ExternalLink, MapPin, Navigation } from "lucide-react";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

const DEFAULT_POSITION = { lat: 35.659, lng: 51.059 };
const NESHAN_MAP_KEY = (import.meta.env.VITE_NESHAN_MAP_KEY as string | undefined)?.trim();

async function loadScript(src: string, marker: string) {
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-map-sdk="${marker}"]`,
    );
    if (existing) {
      if (window.L) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.mapSdk = marker;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("بارگذاری نقشه ممکن نشد."));
    document.body.appendChild(script);
  });
}

function ensureStyle(href: string, marker: string) {
  if (document.querySelector(`link[data-map-sdk="${marker}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.mapSdk = marker;
  document.head.appendChild(link);
}

async function ensureMapSdk() {
  if (NESHAN_MAP_KEY) {
    ensureStyle(
      "https://static.neshan.org/sdk/leaflet/1.4.0/leaflet.css",
      "neshan",
    );
    await loadScript(
      "https://static.neshan.org/sdk/leaflet/1.4.0/leaflet.js",
      "neshan",
    );
    return { L: window.L, neshan: true };
  }

  if (!window.L) {
    ensureStyle("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "leaflet");
    await loadScript(
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
      "leaflet",
    );
  }
  return { L: window.L, neshan: false };
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
  const [usingNeshan, setUsingNeshan] = useState(Boolean(NESHAN_MAP_KEY));
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    setSelected(value ?? null);
  }, [value?.lat, value?.lng]);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    let cancelled = false;

    setLoading(true);
    void ensureMapSdk()
      .then(({ L, neshan }) => {
        if (cancelled || !containerRef.current || !L) return;
        setUsingNeshan(neshan);
        const initial = selected ?? value ?? DEFAULT_POSITION;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = neshan
          ? new L.Map(containerRef.current, {
              key: NESHAN_MAP_KEY,
              maptype: "dreamy",
              poi: true,
              traffic: false,
              center: [initial.lat, initial.lng],
              zoom: value ? 16 : 13,
            })
          : L.map(containerRef.current, {
              zoomControl: true,
              attributionControl: true,
            }).setView([initial.lat, initial.lng], value ? 16 : 13);

        if (!neshan) {
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap",
          }).addTo(map);
        }

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
        setTimeout(() => map.invalidateSize(), 100);
      })
      .catch(() => setUsingNeshan(false))
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
              ? "تغییر موقعیت روی نقشه نشان"
              : "انتخاب موقعیت ملک روی نقشه نشان"}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl overflow-hidden p-0">
          <div className="p-4 sm:p-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Navigation className="size-5 text-primary" />
                انتخاب موقعیت در نشان
              </DialogTitle>
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
            <span className="absolute start-3 top-3 rounded-full border border-border/60 bg-background/90 px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur">
              {usingNeshan ? "نقشه نشان" : "نمایش پایه موقت"}
            </span>
          </div>

          {!usingNeshan && (
            <p className="px-4 pt-3 text-[11px] leading-6 text-amber-700 dark:text-amber-400">
              برای نمایش کاشی‌های رسمی نشان، متغیر VITE_NESHAN_MAP_KEY را در محیط Production تنظیم کنید. لینک‌های مسیریابی از همین حالا با نشان ساخته می‌شوند.
            </p>
          )}

          <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={useMyLocation} className="gap-2">
              <Crosshair className="size-4" />
              موقعیت فعلی من
            </Button>
            <div className="flex flex-wrap gap-2">
              {selected && (
                <Button type="button" variant="ghost" asChild className="gap-2">
                  <a
                    href={neshanAppLocationUrl(selected.lat, selected.lng)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    بازکردن در نشان
                  </a>
                </Button>
              )}
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
