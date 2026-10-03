import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ContactRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PublicContactDialog() {
  const role = useQuery(api.roles.myRole);
  const save = useMutation(api.roles.updateMyPublicContact);
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDisplayName(role?.displayName || "");
    setPublicPhone(role?.publicPhone || "");
  }, [open, role?.displayName, role?.publicPhone]);

  if (!role?.isPrivileged) return null;

  const submit = async () => {
    setSaving(true);
    try {
      await save({ displayName, publicPhone });
      toast.success("اطلاعات تماس عمومی ذخیره شد");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره اطلاعات تماس ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ContactRound className="size-4" />
          <span className="hidden md:inline">تماس عمومی</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>اطلاعات تماس عمومی</DialogTitle>
          <DialogDescription>
            این شماره فقط برای آگهی‌هایی نمایش داده می‌شود که شما ثبت کرده‌اید و عمومی شده‌اند.
            شماره مالک ملک هیچ‌وقت از این بخش منتشر نمی‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>نام نمایشی مشاور</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="مثلاً حسن محمدی"
            />
          </div>
          <div className="space-y-2">
            <Label>شماره تماس عمومی مشاور</Label>
            <Input
              dir="ltr"
              inputMode="tel"
              value={publicPhone}
              onChange={(e) => setPublicPhone(e.target.value)}
              placeholder="0912..."
            />
            <p className="text-[11px] leading-5 text-muted-foreground">
              اگر خالی باشد، در صفحه عمومی فقط شماره مدیر دفتر نمایش داده می‌شود.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
