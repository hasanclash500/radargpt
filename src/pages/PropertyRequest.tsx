import PropertyLeadSection from "@/components/PropertyLeadSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Link } from "react-router";

export default function PropertyRequest() {
  return (
    <main dir="rtl" className="responsive-page min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-background">
      <header className="glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to="/">
                <ArrowRight className="size-4" />
                صفحه اصلی
              </Link>
            </Button>
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </span>
            <strong>ثبت تقاضای ملک</strong>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <PropertyLeadSection />
    </main>
  );
}
