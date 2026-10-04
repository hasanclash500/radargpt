import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { neshanAppLocationUrl } from "@/lib/neshan";
import { useQuery } from "convex/react";
import {
  Crosshair,
  ExternalLink,
  Map,
  MapPin,
  Navigation,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

const DEFAULT_POSITION = { lat: 35.659, lng: 51.059 };
const ENV_NESHAN_MAP_KEY = (
  import.meta.env.VITE_NESHAN_MAP_KEY as string | undefined
)?.trim();

type MapProvider = "neshan" | "osm";

function osmLocationUrl(lat: number, lng: number, zoom = 16) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}

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

async function ensureMapSdk(provider: MapProvider, neshanKey: string) {
  if (provider === "neshan" && neshanKey) {
    ensureStyle(
      "https://static.neshan.org/sdk/leaflet/1.4.0/leaflet.css",
      "neshan",
    );
    await loadScript(
      "https://static.neshan.org/sdk/leaflet/1.4.0/leaflet.js",
      "neshan",
    );
    return { L: window.L, provider: "neshan" as const };
  }

  if (!window.L) {
    ensureStyle("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "leaflet");
    await loadScript(
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
      "leaflet",
    );
  }
  return { L: window.L, provider: "osm" as const };
}

export type MapPoint = { lat: number; lng: number };

export default function MapPicker({
  value,
  onChange,
}: {
  value?: MapPoint | null;
  onChange: (point: MapPoint) => void;
}) {
  const mapSettings = useQuery(api.folders.getMapSettings, {});
  const configuredKey = (
    mapSettings?.neshanMapKey ||
    ENV_NESHAN_MAP_KEY ||
    ""
  ).trim();

  const savedProvider = (mapSettings?.provider ?? "neshan") as MapProvider;
  const [providerOverride, setProviderOverride] = useState<MapProvider | null>(
    null,
  );
  const requestedProvider = providerOverride ?? savedProvider;
  const effectiveProvider: MapProvider =
    requestedProvider === "neshan" && !configuredKey ? "osm" : requestedProvider;

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MapPoint | null>(value ?? null);
  const [loading, setLoading] = useState(false);
  const [renderedProvider, setRenderedProvider] =
    useState<MapProvider>(effectiveProvider);
  const [loadError, setLoadError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const providerLabel = renderedProvider === "neshan" ? "نشان" : "OpenStreetMap";

  useEffect(() => {
    setSelected(value ?? null);
  }, [value?.lat, value?.lng]);

  useEffect(() => {
    setProviderOverride(null);
  }, [savedProvider]);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    let cancelled = false;

    setLoading(true);
    setLoadError("");

    void ensureMapSdk(effectiveProvider, configuredKey)
      .then(({ L, provider }) => {
        if (cancelled || !containerRef.current || !L) return;
        setRenderedProvider(provider);
        const initial = selected ?? value ?? DEFAULT_POSITION;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map =
          provider === "neshan"
            ? new L.Map(containerRef.current, {
                key: configuredKey,
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

        if (provider === "osm") {
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
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
      .catch((error) => {
        setLoadError(
          error instanceof Error
            ? error.message
            : "بارگذاری نقشه ممکن نشد.",
        );
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
  }, [open, effectiveProvider, configuredKey]);

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

  const providerButtons = useMemo(
    () => [
      {
        id: "neshan" as const,
        label: "نشان",
        available: Boolean(configuredKey),
      },
      {
        id: "osm" as const,
        label: "OpenStreetMap",
        available: true,
      },
    ],
    [configuredKey],
  );

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 rounded-xl"
          >
            <MapPin className="size-4 text-primary" />
            {value ? "تغییر موقعیت روی نقشه" : "انتخاب موقعیت ملک روی نقشه"}
          </Button>
        </DialogTrigger>

        <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl overflow-hidden p-0">
          <div className="p-4 sm:p-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Navigation className="size-5 text-primary" />
                انتخاب موقعیت ملک
              </DialogTitle>
              <DialogDescription>
                روی نقشه لمس کنید یا نشانگر را جابه‌جا کنید. موقعیت دقیق فقط
                برای استفاده داخلی مکا ذخیره می‌شود.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex flex-wrap gap-2">
              {providerButtons.map((item) => {
                const active = effectiveProvider === item.id;
                return (
                  <Button
                    key={item.id}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className="gap-1.5 rounded-xl"
                    disabled={!item.available}
                    onClick={() => setProviderOverride(item.id)}
                  >
                    <Map className="size-4" />
                    {item.label}
                    {!item.available && " (بدون کلید)"}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div
              ref={containerRef}
              className="h-[55vh] min-h-[360px] w-full bg-muted"
            />
            {loading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 text-sm">
                در حال بارگذاری نقشه…
              </div>
            )}
            <span className="absolute start-3 top-3 rounded-full border border-border/60 bg-background/90 px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur">
              {providerLabel}
            </span>
          </div>

          {requestedProvider === "neshan" && !configuredKey && (
            <p className="px-4 pt-3 text-[11px] leading-6 text-amber-700 dark:text-amber-400">
              کلید نشان هنوز در پنل مدیریت ذخیره نشده است؛ OpenStreetMap
              به‌عنوان نقشه جایگزین فعال شده است.
            </p>
          )}

          {loadError && (
            <p className="px-4 pt-3 text-[11px] leading-6 text-destructive">
              {loadError} می‌توانید OpenStreetMap را انتخاب کنید.
            </p>
          )}

          <div className="flex flex-col gap-3 border-t border-border p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={useMyLocation}
                className="gap-2"
              >
                <Crosshair className="size-4" />
                موقعیت فعلی من
              </Button>

              {selected && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    asChild
                    className="gap-2"
                  >
                    <a
                      href={neshanAppLocationUrl(selected.lat, selected.lng)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="size-4" />
                      نشان
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    asChild
                    className="gap-2"
                  >
                    <a
                      href={osmLocationUrl(selected.lat, selected.lng)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="size-4" />
                      OpenStreetMap
                    </a>
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
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
