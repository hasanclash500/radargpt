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
  if (provider === "neshan") {
    if (!neshanKey) {
      throw new Error("برای نمایش نقشه نشان، کلید Web SDK لازم است.");
    }
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

  const neshanEnabled = mapSettings?.neshanMapEnabled ?? true;
  const osmEnabled = mapSettings?.osmMapEnabled ?? true;
  const neshanUsable = neshanEnabled && Boolean(configuredKey);
  const savedProvider = (mapSettings?.provider ?? "neshan") as MapProvider;
  const [providerOverride, setProviderOverride] = useState<MapProvider | null>(
    null,
  );
  const requestedProvider = providerOverride ?? savedProvider;
  const effectiveProvider = useMemo<MapProvider>(() => {
    if (requestedProvider === "neshan" && neshanUsable) return "neshan";
    if (requestedProvider === "osm" && osmEnabled) return "osm";
    if (neshanUsable) return "neshan";
    return "osm";
  }, [requestedProvider, neshanUsable, osmEnabled]);
  const mapAvailable = neshanUsable || osmEnabled;

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

    if (!mapAvailable) {
      setLoading(false);
      setLoadError("هیچ موتور نقشه قابل استفاده‌ای فعال نیست.");
      return;
    }

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
  }, [open, effectiveProvider, configuredKey, mapAvailable]);

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
      ...(neshanEnabled
        ? [
            {
              id: "neshan" as const,
              label: "نشان",
              available: Boolean(configuredKey),
            },
          ]
        : []),
      ...(osmEnabled
        ? [
            {
              id: "osm" as const,
              label: "OpenStreetMap",
              available: true,
            },
          ]
        : []),
    ],
    [configuredKey, neshanEnabled, osmEnabled],
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

        <DialogContent className="z-[120] flex max-h-[calc(100dvh-0.75rem)] w-[calc(100dvw-0.75rem)] max-w-[calc(100dvw-0.75rem)] flex-col overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl">
          <div className="shrink-0 p-3 sm:p-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Navigation className="size-5 text-primary" />
                انتخاب موقعیت ملک
              </DialogTitle>
              <DialogDescription>
                روی نقشه لمس کنید یا نشانگر را جابه‌جا کنید. موقعیت دقیق فقط
                برای استفاده داخلی دیوساز ذخیره می‌شود.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
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

          <div className="relative min-h-0 flex-1">
            <div
              ref={containerRef}
              className="h-[34dvh] min-h-[210px] w-full bg-muted sm:h-[48vh] sm:min-h-[320px]"
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

          {neshanEnabled &&
            requestedProvider === "neshan" &&
            !configuredKey &&
            osmEnabled && (
              <p className="px-4 pt-3 text-[11px] leading-6 text-amber-700 dark:text-amber-400">
                کلید نشان هنوز در پنل مدیریت ذخیره نشده است؛ OpenStreetMap
                به‌عنوان نقشه جایگزین فعال شده است.
              </p>
            )}

          {loadError && (
            <p className="px-4 pt-3 text-[11px] leading-6 text-destructive">
              {loadError}
            </p>
          )}

          <div className="z-20 shrink-0 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:p-4">
            <div className="flex max-h-[28dvh] flex-col gap-3 overflow-y-auto sm:max-h-none">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              <Button
                type="button"
                variant="outline"
                onClick={useMyLocation}
                className="shrink-0 gap-2"
              >
                <Crosshair className="size-4" />
                موقعیت فعلی من
              </Button>

              {selected && (
                <>
                  {neshanEnabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      asChild
                      className="shrink-0 gap-2"
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
                  )}
                  {osmEnabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      asChild
                      className="shrink-0 gap-2"
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
                  )}
                </>
              )}
            </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={() => setOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
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
