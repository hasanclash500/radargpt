import { neshanAppLocationUrl, neshanSearchUrl } from "./neshan";

export type NavigationDestination = {
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
};

function coordinates(destination: NavigationDestination) {
  if (
    destination.latitude == null ||
    destination.longitude == null ||
    !Number.isFinite(destination.latitude) ||
    !Number.isFinite(destination.longitude)
  ) {
    return null;
  }
  return {
    lat: destination.latitude,
    lng: destination.longitude,
  };
}

function fallbackQuery(destination: NavigationDestination) {
  return destination.query?.trim() || "شهریار";
}

export function neshanNavigationUrl(
  destination: NavigationDestination,
  preferredUrl?: string | null,
) {
  const direct = preferredUrl?.trim();
  if (direct) return direct;
  const point = coordinates(destination);
  return point
    ? neshanAppLocationUrl(point.lat, point.lng)
    : neshanSearchUrl(fallbackQuery(destination));
}

export function googleMapsNavigationUrl(destination: NavigationDestination) {
  const point = coordinates(destination);
  const value = point
    ? `${point.lat},${point.lng}`
    : fallbackQuery(destination);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(value)}`;
}

export function wazeNavigationUrl(destination: NavigationDestination) {
  const point = coordinates(destination);
  if (point) {
    return `https://www.waze.com/ul?ll=${encodeURIComponent(
      `${point.lat},${point.lng}`,
    )}&navigate=yes`;
  }
  return `https://www.waze.com/ul?q=${encodeURIComponent(
    fallbackQuery(destination),
  )}&navigate=yes`;
}

export function osmNavigationUrl(
  destination: NavigationDestination,
  zoom = 16,
) {
  const point = coordinates(destination);
  if (point) {
    return (
      "https://www.openstreetmap.org/?mlat=" +
      point.lat +
      "&mlon=" +
      point.lng +
      "#map=" +
      zoom +
      "/" +
      point.lat +
      "/" +
      point.lng
    );
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(
    fallbackQuery(destination),
  )}`;
}
