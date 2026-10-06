import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { getModuleAuthEntries } from "@/modules";
import { useQuery } from "convex/react";
import { Loader2, LockKeyhole, LogIn, Mail, UserPlus } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const settings = useQuery(api.folders.getSettings, {});
  const authEntries = getModuleAuthEntries(settings?.enabledModules ?? []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );

  const requestedMode = searchParams.get("mode") === "signIn" ? "signIn" : "signUp";
  const [mode, setMode] = useState<"signIn" | "signUp">(requestedMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("flow", mode);
      await signIn("password", formData);
      toast.success(mode === "signUp" ? "حساب ساخته شد" : "ورود موفق بود");
      navigate(redirect);
    } catch (err) {
      console.error("Password auth error:", err);
      const message =
        mode === "signUp"
          ? "ساخت حساب انجام نشد. رمز عبور باید حداقل ۸ کاراکتر باشد و ایمیل تکراری نباشد."
          : "ایمیل یا رمز عبور صحیح نیست.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div dir="rtl" className="responsive-page relative flex min-h-screen w-full max-w-[100dvw] items-center justify-center overflow-x-clip bg-background px-3 py-8 text-foreground sm:px-4 sm:py-10">
      <div className="absolute end-4 top-4 z-10 rounded-xl border border-border/70 bg-card/80 shadow-sm backdrop-blur sm:end-6 sm:top-6">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md overflow-hidden border-slate-200 shadow-2xl dark:border-white/10">
        <CardHeader className="text-center">
          <div className="mb-3 flex justify-center">
            <button type="button" onClick={() => navigate("/")} aria-label="صفحه اصلی">
              <img
                src="/divsaz-icon.svg"
                alt="دیوساز"
                width={72}
                height={72}
                className="rounded-2xl shadow-lg ring-1 ring-border/60"
              />
            </button>
          </div>
          <CardTitle className="text-2xl font-black">حساب دیوساز</CardTitle>
          <CardDescription className="leading-6">
            {mode === "signUp"
              ? "برای ایجاد حساب، ایمیل و رمز عبور خود را وارد کنید."
              : "برای ورود، ایمیل و رمز عبور حساب خود را وارد کنید."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1">
            <Button
              type="button"
              variant={mode === "signUp" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setMode("signUp");
                setError(null);
              }}
              disabled={isLoading}
            >
              ساخت حساب
            </Button>
            <Button
              type="button"
              variant={mode === "signIn" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setMode("signIn");
                setError(null);
              }}
              disabled={isLoading}
            >
              ورود
            </Button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-email">ایمیل</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-email"
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  className="pr-9"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-password">رمز عبور</Label>
              <div className="relative">
                <LockKeyhole className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-password"
                  name="password"
                  type="password"
                  dir="ltr"
                  autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                  minLength={8}
                  required
                  disabled={isLoading}
                  className="pr-9"
                  placeholder="حداقل ۸ کاراکتر"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-6 text-destructive">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "signUp" ? (
                <UserPlus className="size-4" />
              ) : (
                <LogIn className="size-4" />
              )}
              {mode === "signUp" ? "ایجاد حساب" : "ورود به حساب"}
            </Button>
          </form>

          {authEntries.length > 0 && (
            <div className="mt-5 space-y-3 border-t border-border/60 pt-5">
              {authEntries.map((entry) => {
                const Entry = entry.component;
                return (
                  <div key={entry.moduleId + ":" + entry.id}>
                    <Entry mode={mode} returnTo={redirect} />
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">
            پس از ورود، بخش‌های متناسب با سطح دسترسی شما نمایش داده می‌شود.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
