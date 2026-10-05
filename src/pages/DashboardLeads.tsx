import LeadInbox from "@/components/admin/LeadInbox";
import DashboardSectionNav from "@/components/dashboard/DashboardSectionNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  BrainCircuit,
  LayoutDashboard,
  UserRoundSearch,
} from "lucide-react";
import { Link } from "react-router";

export default function DashboardLeads() {
  const role = useQuery(api.roles.myRole, {});

  if (role === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">در حال دریافت دسترسی…</p>
      </main>
    );
  }

  if (!(role?.role === "manager" || role?.role === "admin" || role?.role === "consultant")) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
          <UserRoundSearch className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 font-black">دسترسی به متقاضی‌ها ندارید</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            این بخش برای مدیر، ادمین و مشاوران فعال است.
          </p>
          <Button asChild className="mt-5">
            <Link to="/dashboard">بازگشت به داشبورد</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-muted/30">
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
              <UserRoundSearch className="size-5" />
            </span>
            <strong>متقاضی‌ها</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/dashboard/matches">
                <BrainCircuit className="size-4" />
                مچ هوشمند
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <DashboardSectionNav />

      <section className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:px-6 sm:py-8">
        <div className="rounded-3xl border border-primary/20 bg-primary/[0.035] p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LayoutDashboard className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-black sm:text-2xl">مدیریت متقاضی‌ها</h1>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                ثبت متقاضی جدید و پیگیری درخواست‌های خرید، فروش، رهن و اجاره در این بخش انجام می‌شود.
              </p>
            </div>
          </div>
        </div>

        <LeadInbox />
      </section>
    </main>
  );
}
