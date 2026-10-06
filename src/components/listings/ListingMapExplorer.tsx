import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { faDecimalNum, faNum, formatArea, formatPrice } from "@/lib/format";
import { neshanAppLocationUrl } from "@/lib/neshan";
import { useQuery } from "convex/react";
import {
  ChevronLeft,
  ExternalLink,
  Focus,
  ImageOff,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

export type ListingMapBounds = {
  south: number;
  north: number;
  west: number;
  east: number;
};

export type ListingMapItem = {
  key: string;
  slug?: string;
  radarCode?: string;
  title: string;
  city: string;
  neighborhood?: string;
  area?: number | null;
  priceMillion?: number | null;
  depositMillion?: number | null;
  rentMillion?: number | null;
  dealType?: string;
  propertyType?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  publicSlug?: string;
  listingKind?: "member" | "imported";
  featuredOnHome?: boolean;
};

export const DEFAULT_LISTING_MAP_BOUNDS: ListingMapBounds = {
  south: 35.42,
  north: 35.9,
  west: 50.72,
  east: 51.42,
};

const DEFAULT_POSITION = { lat: 35.659, lng: 51.059 };
const ENV_NESHAN_MAP_KEY = (
  import.meta.env.VITE_NESHAN_MAP_KEY as string | undefined
)?.trim();

type MapProvider = "neshan" | "osm";

function osmLocationUrl(lat: number, lng: number, zoom = 16) {
  return (
    "https://www.openstreetmap.org/?mlat=" +
    lat +
    "&mlon=" +
    lng +
    "#map=" +
    zoom +
    "/" +
    lat +
    "/" +
    lng
  );
}

async function loadScript(src: string, marker: string) {
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-map-sdk="' + marker + '"]',
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
  if (document.querySelector('link[data-map-sdk="' + marker + '"]')) return;
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

function roundBound(value: number) {
  return Number(value.toFixed(5));
}

function compactMapPrice(point: ListingMapItem) {
  const value =
    point.rentMillion != null && point.rentMillion > 0
      ? point.rentMillion
      : point.priceMillion != null && point.priceMillion > 0
        ? point.priceMillion
        : point.depositMillion != null && point.depositMillion > 0
          ? point.depositMillion
          : null;
  if (value == null) return "ملک";
  if (value >= 1000) return `${faDecimalNum(value / 1000)} میلیارد`;
  return `${faDecimalNum(value)} میلیون`;
}

function markerCaption(point: ListingMapItem) {
  if (point.rentMillion != null && point.rentMillion > 0) {
    return `اجاره ${compactMapPrice(point)}`;
  }
  if (point.priceMillion != null && point.priceMillion > 0) {
    return compactMapPrice(point);
  }
  if (point.depositMillion != null && point.depositMillion > 0) {
    return `ودیعه ${compactMapPrice(point)}`;
  }
  return "آگهی";
}

export default function ListingMapExplorer({
  points,
  loading = false,
  truncated = false,
  mode = "internal",
  onBoundsChange,
  onOpenListing,
}: {
  points: ListingMapItem[];
  loading?: boolean;
  truncated?: boolean;
  mode?: "public" | "internal";
  onBoundsChange?: (bounds: ListingMapBounds) => void;
  onOpenListing: (point: ListingMapItem) => void;
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

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const boundsCallbackRef = useRef(onBoundsChange);
  const lastViewRef = useRef<{ center: [number, number]; zoom: number } | null>(
    null,
  );
  const fittedRef = useRef(false);
  const [readyVersion, setReadyVersion] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ListingMapItem | null>(null);

  useEffect(() => {
    boundsCallbackRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    setProviderOverride(null);
  }, [savedProvider]);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    setLoadError("");

    if (!mapAvailable) {
      setLoadError("هیچ موتور نقشه قابل استفاده‌ای فعال نیست.");
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      layerRef.current = null;
      return;
    }

    void ensureMapSdk(effectiveProvider, configuredKey)
      .then(({ L, provider }) => {
        if (cancelled || !containerRef.current || !L) return;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const previous = lastViewRef.current;
        const center = previous?.center ?? [
          DEFAULT_POSITION.lat,
          DEFAULT_POSITION.lng,
        ];
        const zoom = previous?.zoom ?? 11;

        const map =
          provider === "neshan"
            ? new L.Map(containerRef.current, {
                key: configuredKey,
                maptype: "dreamy",
                poi: true,
                traffic: false,
                center,
                zoom,
                zoomControl: mode !== "public",
              })
            : L.map(containerRef.current, {
                zoomControl: mode !== "public",
                attributionControl: true,
              }).setView(center, zoom);

        if (provider === "osm") {
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(map);
        }

        const emitBounds = () => {
          const bounds = map.getBounds();
          const centerPoint = map.getCenter();
          lastViewRef.current = {
            center: [centerPoint.lat, centerPoint.lng],
            zoom: map.getZoom(),
          };
          boundsCallbackRef.current?.({
            south: roundBound(bounds.getSouth()),
            north: roundBound(bounds.getNorth()),
            west: roundBound(bounds.getWest()),
            east: roundBound(bounds.getEast()),
          });
        };

        map.on("moveend", emitBounds);
        mapRef.current = map;
        setReadyVersion((value) => value + 1);
        window.setTimeout(() => {
          map.invalidateSize();
          emitBounds();
        }, 100);
      })
      .catch((error) => {
        setLoadError(
          error instanceof Error
            ? error.message
            : "بارگذاری نقشه ممکن نشد.",
        );
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      layerRef.current = null;
    };
  }, [effectiveProvider, configuredKey, mapAvailable, mode]);

  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L) return;

    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }

    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    for (const point of points) {
      if (
        !Number.isFinite(point.latitude) ||
        !Number.isFinite(point.longitude)
      ) {
        continue;
      }

      const active = point.key === activeKey;
      const marker =
        mode === "public"
          ? L.marker([point.latitude, point.longitude], {
              icon: L.divIcon({
                className: "",
                iconSize: [92, 38],
                iconAnchor: [46, 19],
                html:
                  '<div dir="rtl" style="' +
                  "display:flex;align-items:center;justify-content:center;" +
                  "min-width:44px;max-width:92px;height:38px;padding:0 10px;border-radius:9999px;" +
                  "font-family:inherit;font-size:10px;font-weight:900;white-space:nowrap;" +
                  "overflow:hidden;text-overflow:ellipsis;" +
                  "box-shadow:0 4px 12px rgba(15,23,42,.28);" +
                  (active
                    ? "background:#7f1d1d;color:#fff;border:3px solid #fff;transform:scale(1.08);"
                    : "background:#b91c1c;color:#fff;border:2px solid #fff;") +
                  '">' +
                  markerCaption(point) +
                  "</div>",
              }),
              riseOnHover: true,
              riseOffset: active ? 1200 : 300,
            }).addTo(layer)
          : L.circleMarker([point.latitude, point.longitude], {
              radius: active ? 10 : 8,
              color: active ? "#d4a72c" : "#0f172a",
              fillColor: active ? "#f2c94c" : "#1d4ed8",
              fillOpacity: 0.92,
              weight: active ? 4 : 2,
            }).addTo(layer);

      marker.on("click", () => {
        setActiveKey(point.key);
        setSelectedPoint(point);
        map.panTo([point.latitude, point.longitude], {
          animate: true,
          duration: 0.25,
        });
        if (mode === "public") {
          window.setTimeout(() => {
            map.panBy([0, 150], { animate: true, duration: 0.2 });
          }, 180);
        }
      });
    }

    if (!fittedRef.current && points.length > 0) {
      const valid = points.filter(
        (point) =>
          Number.isFinite(point.latitude) &&
          Number.isFinite(point.longitude),
      );
      if (valid.length > 0) {
        fittedRef.current = true;
        if (valid.length === 1) {
          map.setView([valid[0].latitude, valid[0].longitude], 15);
        } else {
          map.fitBounds(
            valid.map((point) => [point.latitude, point.longitude]),
            { padding: [36, 36], maxZoom: 15 },
          );
        }
      }
    }
  }, [points, activeKey, readyVersion, mode]);

  useEffect(() => {
    if (!activeKey) return;
    const refreshed = points.find((point) => point.key === activeKey);
    if (refreshed) setSelectedPoint(refreshed);
  }, [activeKey, points]);

  const activePoint = useMemo(
    () =>
      points.find((point) => point.key === activeKey) ??
      (selectedPoint?.key === activeKey ? selectedPoint : null),
    [activeKey, points, selectedPoint],
  );
  const selectedPublicListing = useQuery(
    api.listings.getPublicBySlug,
    mode === "public" && activePoint?.slug
      ? { slug: activePoint.slug }
      : "skip",
  );
  const selectedPublicImage =
    selectedPublicListing?.images?.find((image: any) => image.featured) ??
    selectedPublicListing?.images?.[0] ??
    null;

  const fitAllPoints = () => {
    const map = mapRef.current;
    if (!map) return;
    const valid = points.filter(
      (point) =>
        Number.isFinite(point.latitude) &&
        Number.isFinite(point.longitude),
    );
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].latitude, valid[0].longitude], 15);
      return;
    }
    map.fitBounds(
      valid.map((point) => [point.latitude, point.longitude]),
      { padding: [36, 36], maxZoom: 15 },
    );
  };

  const useMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.setView(
          [position.coords.latitude, position.coords.longitude],
          15,
        );
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <section
      className={
        "overflow-hidden bg-card shadow-sm " +
        (mode === "public"
          ? "rounded-none border-y border-border/70 sm:rounded-3xl sm:border"
          : "rounded-3xl border border-border/70")
      }
    >
      {mode === "internal" && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-3 py-3 sm:px-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-black">
              <MapIcon className="size-4 text-primary" />
              انتخاب آگهی از روی نقشه
            </p>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
              فقط آگهی‌هایی که موقعیت جغرافیایی برای آن‌ها ثبت شده باشد روی نقشه
              دیده می‌شوند.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl"
              onClick={fitAllPoints}
            >
              <Focus className="size-4" />
              نمایش همه
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl"
              onClick={useMyLocation}
            >
              <LocateFixed className="size-4" />
              موقعیت من
            </Button>
            {neshanEnabled && (
              <Button
                type="button"
                size="sm"
                variant={effectiveProvider === "neshan" ? "default" : "outline"}
                className="rounded-xl"
                disabled={!configuredKey}
                onClick={() => setProviderOverride("neshan")}
              >
                نشان
              </Button>
            )}
            {osmEnabled && (
              <Button
                type="button"
                size="sm"
                variant={effectiveProvider === "osm" ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => setProviderOverride("osm")}
              >
                OSM
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <div
          ref={containerRef}
          className={
            mode === "public"
              ? "h-[calc(100dvh-8.75rem)] min-h-[610px] w-full bg-muted sm:h-[72vh] lg:h-[76vh] [&_.leaflet-control-attribution]:!text-[8px] [&_.leaflet-control-attribution]:!leading-3"
              : "h-[56dvh] min-h-[360px] w-full bg-muted sm:h-[62vh] lg:h-[66vh]"
          }
        />

        {mode === "public" && (
          <div className="absolute inset-x-3 top-3 z-[1000] flex items-center justify-between gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-11 shrink-0 gap-2 rounded-2xl border-2 border-primary/70 bg-background/95 px-4 text-xs font-black shadow-lg backdrop-blur"
              onClick={fitAllPoints}
            >
              <Focus className="size-4" />
              نمایش همه
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-11 shrink-0 gap-2 rounded-2xl px-4 text-xs font-black shadow-lg"
              onClick={useMyLocation}
            >
              <LocateFixed className="size-4" />
              مرکز من
            </Button>
          </div>
        )}

        {loading && (
          <div
            className={
              "pointer-events-none absolute inset-x-0 mx-auto w-fit rounded-full border border-border/70 bg-background/95 px-3 py-1.5 text-[11px] font-bold shadow-sm backdrop-blur " +
              (mode === "public" ? "top-16 z-[1000]" : "top-3")
            }
          >
            در حال دریافت آگهی‌های این محدوده…
          </div>
        )}

        {!loading && points.length === 0 && !loadError && (
          <div
            className={
              "pointer-events-none absolute inset-x-4 mx-auto max-w-sm rounded-2xl border border-border/70 bg-background/95 px-4 py-3 text-center text-xs leading-6 shadow-lg backdrop-blur " +
              (mode === "public" ? "top-16 z-[1000]" : "top-4")
            }
          >
            در این محدوده آگهی دارای لوکیشن پیدا نشد. نقشه را جابه‌جا یا کوچک
            کنید.
          </div>
        )}

        {truncated && (
          <div
            className={
              "absolute start-3 end-3 rounded-xl border border-amber-500/30 bg-background/95 px-3 py-2 text-[10px] leading-5 text-amber-700 shadow-sm backdrop-blur dark:text-amber-300 sm:end-auto sm:max-w-sm " +
              (mode === "public" ? "top-28 z-[1000]" : "bottom-3")
            }
          >
            تعداد نقاط این محدوده زیاد است؛ برای دیدن فایل‌های دقیق‌تر روی نقشه
            زوم کنید.
          </div>
        )}

        {loadError && (
          <div
            className={
              "absolute inset-x-4 mx-auto max-w-sm rounded-2xl border border-destructive/30 bg-background/95 px-4 py-3 text-center text-xs text-destructive shadow-lg " +
              (mode === "public" ? "top-16 z-[1000]" : "top-4")
            }
          >
            {loadError}
          </div>
        )}

        {mode === "public" && activePoint && (
          <article
            aria-live="polite"
            className="absolute inset-x-2 bottom-2 z-[1100] mx-auto max-w-xl overflow-hidden rounded-[1.6rem] border border-border/80 bg-background shadow-[0_18px_48px_rgba(15,23,42,0.32)] sm:inset-x-4 sm:bottom-4"
          >
            <div className="relative flex h-[225px] items-center justify-center overflow-hidden bg-muted/70 sm:h-[250px]">
              {selectedPublicImage?.url ? (
                <img
                  src={selectedPublicImage.url}
                  alt={selectedPublicImage.alt || activePoint.title}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              ) : selectedPublicListing === undefined ? (
                <div className="text-xs font-bold text-muted-foreground">
                  در حال دریافت تصویر…
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageOff className="size-9 opacity-50" />
                  <span className="text-xs">تصویری برای این آگهی ثبت نشده</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                setActiveKey(null);
                setSelectedPoint(null);
              }}
                className="absolute end-3 top-3 z-20 flex size-10 items-center justify-center rounded-full bg-background/95 shadow-md"
                aria-label="بستن کارت آگهی"
              >
                <X className="size-5" />
              </button>

              <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
                {activePoint.dealType && (
                  <span className="rounded-full bg-background/95 px-3 py-1.5 text-[10px] font-black shadow-sm">
                    {activePoint.dealType}
                  </span>
                )}
                {activePoint.featuredOnHome && (
                  <span className="rounded-full bg-amber-400 px-3 py-1.5 text-[10px] font-black text-slate-950 shadow-sm">
                    ویژه
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenListing(activePoint)}
              className="block w-full p-4 text-right sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block text-2xl font-black leading-8">
                    {activePoint.rentMillion != null && activePoint.rentMillion > 0
                      ? `اجاره ${formatPrice(activePoint.rentMillion)}`
                      : activePoint.priceMillion != null && activePoint.priceMillion > 0
                        ? formatPrice(activePoint.priceMillion)
                        : activePoint.depositMillion != null && activePoint.depositMillion > 0
                          ? `ودیعه ${formatPrice(activePoint.depositMillion)}`
                          : "قیمت توافقی"}
                  </strong>
                  {activePoint.depositMillion != null &&
                    activePoint.depositMillion > 0 &&
                    activePoint.rentMillion != null &&
                    activePoint.rentMillion > 0 && (
                      <p className="mt-1 text-xs font-bold text-muted-foreground">
                        ودیعه {formatPrice(activePoint.depositMillion)}
                      </p>
                    )}
                </div>
                <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ChevronLeft className="size-5" />
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-foreground">
                {selectedPublicListing?.rooms != null && (
                  <span>
                    {selectedPublicListing.rooms === 0
                      ? "بدون اتاق"
                      : `${faNum(selectedPublicListing.rooms)} اتاق`}
                  </span>
                )}
                {selectedPublicListing?.rooms != null && activePoint.area != null && (
                  <span className="text-muted-foreground/40">|</span>
                )}
                {activePoint.area != null && <span>{formatArea(activePoint.area)}</span>}
                {activePoint.propertyType && (
                  <>
                    <span className="text-muted-foreground/40">|</span>
                    <span>{activePoint.propertyType}</span>
                  </>
                )}
              </div>

              <h3 className="mt-2 line-clamp-1 text-sm font-black leading-6">
                {activePoint.title}
              </h3>

              <p className="mt-1 flex items-start gap-1.5 text-xs leading-6 text-muted-foreground">
                <MapPin className="mt-1 size-3.5 shrink-0 text-primary" />
                {[activePoint.city, activePoint.neighborhood]
                  .filter(Boolean)
                  .join("، ")}
              </p>
            </button>
          </article>
        )}

        {mode === "public" && !activePoint && !loading && points.length > 0 && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1000] mx-auto w-fit max-w-[calc(100%-1.5rem)] rounded-full border border-border/70 bg-background/95 px-4 py-2 text-center text-[11px] font-bold shadow-lg backdrop-blur">
            {faNum(points.length)} آگهی در این محدوده · یکی از نشانگرها را لمس کنید
          </div>
        )}
      </div>

      {mode === "internal" &&
        (activePoint ? (
          <div className="border-t border-border/70 bg-background/80 p-3 sm:p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                  {activePoint.dealType && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                      {activePoint.dealType}
                    </span>
                  )}
                  {activePoint.propertyType && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                      {activePoint.propertyType}
                    </span>
                  )}
                  {activePoint.radarCode && (
                    <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                      کد {activePoint.radarCode}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 truncate text-sm font-black sm:text-base">
                  {activePoint.title}
                </h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3 text-primary" />
                    {[activePoint.city, activePoint.neighborhood]
                      .filter(Boolean)
                      .join("، ")}
                  </span>
                  {activePoint.area != null && (
                    <span>{formatArea(activePoint.area)}</span>
                  )}
                  {activePoint.depositMillion != null &&
                    activePoint.depositMillion > 0 && (
                      <span>
                        ودیعه {formatPrice(activePoint.depositMillion)}
                      </span>
                    )}
                  {activePoint.rentMillion != null &&
                    activePoint.rentMillion > 0 && (
                      <span>اجاره {formatPrice(activePoint.rentMillion)}</span>
                    )}
                  {(activePoint.rentMillion == null ||
                    activePoint.rentMillion <= 0) &&
                    activePoint.priceMillion != null &&
                    activePoint.priceMillion > 0 && (
                      <span>قیمت {formatPrice(activePoint.priceMillion)}</span>
                    )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="flex-1 gap-1.5 rounded-xl lg:flex-none"
                  onClick={() => onOpenListing(activePoint)}
                >
                  <Navigation className="size-4" />
                  انتخاب و بازکردن پرونده
                </Button>
                {neshanEnabled && (
                  <Button asChild type="button" variant="outline" size="icon">
                    <a
                      href={neshanAppLocationUrl(
                        activePoint.latitude,
                        activePoint.longitude,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="باز کردن در نشان"
                      title="باز کردن در نشان"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                )}
                {osmEnabled && (
                  <Button asChild type="button" variant="outline" size="icon">
                    <a
                      href={osmLocationUrl(
                        activePoint.latitude,
                        activePoint.longitude,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="باز کردن در OpenStreetMap"
                      title="باز کردن در OpenStreetMap"
                    >
                      <MapIcon className="size-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t border-border/70 px-4 py-3 text-center text-[11px] text-muted-foreground">
            یک نشانگر را لمس کنید تا اطلاعات همان آگهی و گزینه انتخاب نمایش داده
            شود. {faNum(points.length)} نقطه در محدوده فعلی دیده می‌شود.
          </div>
        ))}
    </section>
  );
}
