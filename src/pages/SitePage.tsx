import SitePageRenderer from "@/components/pages/SitePageRenderer";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";

export default function SitePage() {
  const { slug = "" } = useParams();
  const page = useQuery(api.pages.getPublishedBySlug, { slug });

  if (page === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">در حال بارگذاری…</div>;
  }

  if (!page) {
    return (
      <main dir="rtl" className="responsive-page flex min-h-screen w-full max-w-[100dvw] items-center justify-center overflow-x-clip bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-black">صفحه پیدا نشد</h1>
          <p className="mt-2 text-sm text-muted-foreground">این برگه منتشر نشده یا وجود ندارد.</p>
          <Button asChild className="mt-5"><Link to="/">صفحه اصلی</Link></Button>
        </div>
      </main>
    );
  }

  return <SitePageRenderer page={page as any} />;
}
