import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { KeyRound, Loader2, Mail, Shield, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLES = [
  { value: "manager", label: "مدیر" },
  { value: "admin", label: "ادمین" },
  { value: "consultant", label: "مشاور" },
  { value: "user", label: "کاربر" },
] as const;

export default function UserManagement() {
  const users = useQuery(api.roles.listUsers, {});
  const setRole = useMutation(api.roles.setUserRole);
  const updateEmail = useMutation(api.roles.updateUserEmail);
  const resetPassword = useAction(api.roles.resetUserPassword);
  const deleteUser = useMutation(api.roles.deleteUser);

  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({});
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  if (users === null) return null;

  async function perform(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "عملیات ناموفق بود");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCog className="size-5" />
          کاربران، نقش‌ها و دسترسی‌ها
        </CardTitle>
        <CardDescription>
          مدیر می‌تواند نقش، ایمیل و رمز ورود پرسنل را تغییر دهد یا حساب را حذف کند.
          تغییر ایمیل یا رمز، نشست‌های فعال آن کاربر را باطل می‌کند.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(users ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">کاربری یافت نشد.</p>
        )}

        {(users ?? []).map((user) => {
          const id = String(user.userId);
          const emailValue = emailDrafts[id] ?? user.email ?? "";
          const passwordValue = passwordDrafts[id] ?? "";
          return (
            <section key={id} className="space-y-4 rounded-2xl border border-border/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-extrabold">
                    {user.displayName || user.name || user.email || "کاربر بی‌نام"}
                    {user.isSelf ? " (شما)" : ""}
                  </p>
                  <p dir="ltr" className="mt-1 truncate text-xs text-muted-foreground">
                    {user.email || id}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ROLES.map((role) => (
                    <Button
                      key={role.value}
                      type="button"
                      size="sm"
                      variant={user.role === role.value ? "default" : "outline"}
                      disabled={busy !== null}
                      onClick={() =>
                        void perform(
                          `role-${id}`,
                          () => setRole({ userId: user.userId, role: role.value }),
                          `نقش کاربر به «${role.label}» تغییر کرد`,
                        )
                      }
                    >
                      {busy === `role-${id}` ? <Loader2 className="size-3.5 animate-spin" /> : <Shield className="size-3.5" />}
                      {role.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2 rounded-xl bg-muted/30 p-3">
                  <p className="flex items-center gap-2 text-xs font-extrabold">
                    <Mail className="size-4 text-primary" />
                    تغییر ایمیل ورود
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      dir="ltr"
                      type="email"
                      value={emailValue}
                      onChange={(e) =>
                        setEmailDrafts((current) => ({ ...current, [id]: e.target.value }))
                      }
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy !== null || !emailValue.trim() || emailValue === user.email}
                      onClick={() =>
                        void perform(
                          `email-${id}`,
                          () => updateEmail({ userId: user.userId, email: emailValue }),
                          "ایمیل ورود تغییر کرد",
                        )
                      }
                    >
                      {busy === `email-${id}` && <Loader2 className="size-4 animate-spin" />}
                      ذخیره
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl bg-muted/30 p-3">
                  <p className="flex items-center gap-2 text-xs font-extrabold">
                    <KeyRound className="size-4 text-primary" />
                    تعیین رمز جدید
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      dir="ltr"
                      type="password"
                      placeholder="حداقل ۸ کاراکتر"
                      value={passwordValue}
                      onChange={(e) =>
                        setPasswordDrafts((current) => ({ ...current, [id]: e.target.value }))
                      }
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy !== null || passwordValue.length < 8}
                      onClick={() =>
                        void perform(
                          `password-${id}`,
                          async () => {
                            await resetPassword({ userId: user.userId, newPassword: passwordValue });
                            setPasswordDrafts((current) => ({ ...current, [id]: "" }));
                          },
                          "رمز عبور جدید ثبت شد",
                        )
                      }
                    >
                      {busy === `password-${id}` && <Loader2 className="size-4 animate-spin" />}
                      تغییر رمز
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-border/60 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={user.isSelf || busy !== null}
                  onClick={() => {
                    if (!window.confirm(`حساب «${user.email || user.name || id}» کاملاً حذف شود؟ این عملیات قابل بازگشت نیست.`)) return;
                    void perform(
                      `delete-${id}`,
                      () => deleteUser({ userId: user.userId }),
                      "حساب کاربر حذف شد",
                    );
                  }}
                >
                  {busy === `delete-${id}` ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  حذف حساب
                </Button>
              </div>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
