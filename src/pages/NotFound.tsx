import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      dir="rtl"
      className="relative flex min-h-screen flex-col bg-background text-foreground"
    >
      <div className="absolute end-4 top-4 rounded-xl border border-border/70 bg-card/80 shadow-sm backdrop-blur sm:end-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="mx-auto max-w-lg text-center">
          <img
            src="/divsaz-icon.svg"
            alt="دیوساز"
            className="mx-auto size-16 rounded-2xl shadow-lg"
          />
          <h1 className="mt-5 text-5xl font-black">۴۰۴</h1>
          <p className="mt-3 text-lg font-black">این صفحه پیدا نشد</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            نشانی صفحه را بررسی کنید یا به صفحه اصلی دیوساز برگردید.
          </p>
          <Button asChild className="mt-5 gap-2">
            <Link to="/">
              <Home className="size-4" />
              صفحه اصلی
            </Link>
          </Button>
        </div>
      </div>
    </motion.main>
  );
}
