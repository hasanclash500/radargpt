import SitePageRenderer from "@/components/pages/SitePageRenderer";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Landing from "./Landing";

export default function Homepage() {
  const page = useQuery(api.pages.getHomepage, {});

  if (page === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        در حال بارگذاری…
      </div>
    );
  }

  if (!page) return <Landing />;
  return <SitePageRenderer page={page as any} />;
}
