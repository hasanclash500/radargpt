import SitePageRenderer from "@/components/pages/SitePageRenderer";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Landing from "./Landing";
import LandingV2 from "./LandingV2";
import LandingV3 from "./LandingV3";

export default function Homepage() {
  const page = useQuery(api.pages.getHomepage, {});
  const settings = useQuery(api.folders.getSettings, {});

  if (page === undefined || settings === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        در حال بارگذاری…
      </div>
    );
  }

  if (settings.homepageVariant === "visual") return <LandingV3 />;
  if (settings.homepageVariant === "modern") return <LandingV2 />;
  if (!page) return <Landing />;
  return <SitePageRenderer page={page as any} />;
}
