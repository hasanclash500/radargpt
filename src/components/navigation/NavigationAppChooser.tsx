import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import {
  googleMapsNavigationUrl,
  neshanNavigationUrl,
  osmNavigationUrl,
  wazeNavigationUrl,
} from "@/lib/navigation";
import { useQuery } from "convex/react";
import {
  ExternalLink,
  Map,
  MapPinned,
  Navigation,
  Route,
} from "lucide-react";
import type { ReactElement } from "react";

export default function NavigationAppChooser({
  latitude,
  longitude,
  query,
  neshanUrl,
  trigger,
}: {
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
  neshanUrl?: string | null;
  trigger?: ReactElement;
}) {
  const mapSettings = useQuery(api.folders.getMapSettings, {});
  const neshanEnabled = mapSettings?.neshanMapEnabled ?? true;
  const osmEnabled = mapSettings?.osmMapEnabled ?? true;
  const destination = { latitude, longitude, query };

  const options = [
    ...(neshanEnabled
      ? [
          {
            id: "neshan",
            label: "نشان",
            description: "باز کردن مقصد در اپ یا وب نشان",
            href: neshanNavigationUrl(destination, neshanUrl),
            icon: Navigation,
          },
        ]
      : []),
    {
      id: "google",
      label: "Google Maps",
      description: "مسیریابی با Google Maps",
      href: googleMapsNavigationUrl(destination),
      icon: MapPinned,
    },
    {
      id: "waze",
      label: "Waze",
      description: "شروع مسیریابی با Waze",
      href: wazeNavigationUrl(destination),
      icon: Route,
    },
    ...(osmEnabled
      ? [
          {
            id: "osm",
            label: "OpenStreetMap",
            description: "مشاهده مقصد روی OpenStreetMap",
            href: osmNavigationUrl(destination),
            icon: Map,
          },
        ]
      : []),
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" className="gap-2">
            <Navigation className="size-4" />
            مسیریابی
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>انتخاب برنامه مسیریابی</DialogTitle>
          <DialogDescription>
            برنامه موردنظر را انتخاب کنید. در موبایل، اگر اپ نصب باشد لینک
            می‌تواند مستقیماً همان برنامه را باز کند.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 pt-2">
          {options.map(({ id, label, description, href, icon: Icon }) => (
            <DialogClose asChild key={id}>
              <a
                href={href}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 text-right transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm">{label}</strong>
                  <span className="mt-0.5 block text-[11px] leading-5 text-muted-foreground">
                    {description}
                  </span>
                </span>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
              </a>
            </DialogClose>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
