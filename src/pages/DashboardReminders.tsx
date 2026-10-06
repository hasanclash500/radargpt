import ListingReminderPanel from "@/components/listings/ListingReminderPanel";
import DashboardSectionNav from "@/components/dashboard/DashboardSectionNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowRight, BellRing, Building2 } from "lucide-react";
import { Link } from "react-router";

export default function DashboardReminders() {
  const role = useQuery(api.roles.myRole, {});

  if (role === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">در حال دریافت دسترسی…</p>
      </main>
    );
  }

  if (!role?.isPrivileged) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
          <BellRing className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 font-black">دسترسی به یادآوری‌ها ندارید</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            این بخش برای مدیر، ادمین و مشاوران دیوساز فعال است.
          </p>
          <Button asChild className="mt-5">
            <Link to="/dashboard">بازگشت به داشبورد</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-muted/30">
      <header className="glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to="/dashboard">
                <ArrowRight className="size-4" />
                داشبورد
              </Link>
            </Button>
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BellRing className="size-5" />
            </span>
            <strong>یادآوری پیگیری</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/dashboard/listings">
                <Building2 className="size-4" />
                آگهی‌ها
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <DashboardSectionNav />

      <section className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        <ListingReminderPanel />
      </section>
    </main>
  );
}
