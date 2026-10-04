import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  SHARE_CHANNELS,
  buildBulkText,
  buildShareText,
  shareToChannel,
  type ShareChannel,
  type ShareSettings,
  type ShareableListing,
} from "@/lib/share";
import { faNum } from "@/lib/format";
import {
  Copy,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  Share2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: ShareableListing[];
  settings: ShareSettings;
  onSettingsChange: (patch: Partial<ShareSettings>) => void;
  /** تعداد پیش‌فرض آگهی ارسالی موقع باز شدن دیالوگ (مثلاً تعداد انتخاب‌شده‌ها). */
  initialCount?: number;
  onShared?: () => void;
}

const CHANNEL_ICONS: Record<ShareChannel, typeof Send> = {
  telegram: Send,
  whatsapp: MessageCircle,
  bale: MessageCircle,
  clipboard: Copy,
  native: Share2,
  sms: Phone,
};

/** دیالوگ آماده‌سازی و ارسال متن آگهی به شبکه‌های اجتماعی و پیام‌رسان‌ها. */
export default function ShareDialog({
  open,
  onOpenChange,
  listings,
  settings,
  onSettingsChange,
  initialCount = 1,
  onShared,
}: ShareDialogProps) {
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState<ShareChannel | null>(null);
  const [editedText, setEditedText] = useState("");
  const [manualText, setManualText] = useState(false);

  const limit = listings.length;
  const effective = Math.max(1, Math.min(count, Math.max(limit, 1)));
  const chosen = useMemo(
    () => listings.slice(0, effective),
    [listings, effective],
  );

  const generatedText = useMemo(() => {
    if (chosen.length === 0) return "";
    if (chosen.length === 1) return buildShareText(chosen[0], settings);
    return buildBulkText(chosen, settings);
  }, [chosen, settings]);

  useEffect(() => {
    if (!open) return;
    const next = Math.max(1, Math.min(initialCount, Math.max(listings.length, 1)));
    setCount(next);
    setManualText(false);
  }, [open, initialCount, listings.length]);

  useEffect(() => {
    if (!open || manualText) return;
    setEditedText(generatedText);
  }, [open, generatedText, manualText]);

  const resetGeneratedText = () => {
    setEditedText(generatedText);
    setManualText(false);
  };

  const handleShare = async (channel: ShareChannel) => {
    const text = editedText.trim();
    if (!text) return;
    setBusy(channel);
    try {
      const res = await shareToChannel(
        channel,
        text,
        chosen[0]?.contactPhone,
      );
      if (!res.ok) {
        toast("اشتراک‌گذاری لغو شد");
        return;
      }
      toast.success(
        channel === "clipboard"
          ? "متن آگهی کپی شد"
          : `آگهی برای «${SHARE_CHANNELS.find((c) => c.id === channel)?.label}» آماده شد`,
        {
          description:
            res.fallback === "clipboard"
              ? "متن کپی شد؛ آن را داخل برنامه بچسبانید."
              : undefined,
        },
      );
      onShared?.();
    } catch {
      toast.error("ارسال انجام نشد");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="flex max-h-[calc(100dvh-12px)] w-[calc(100vw-12px)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[92vh] sm:w-full sm:rounded-2xl"
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 pb-3 pt-5 text-right sm:px-5">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Send className="size-5 text-primary" />
            ارسال آگهی
          </DialogTitle>
          <DialogDescription className="text-right leading-6">
            متن به‌صورت خودکار ساخته می‌شود، اما قبل از ارسال می‌توانید کل متن
            آگهی را مستقیم ویرایش کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_250px]">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground">
                  متن قابل ویرایش ({faNum(chosen.length)} آگهی)
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 px-2 text-[11px]"
                  onClick={resetGeneratedText}
                >
                  <RefreshCw className="size-3.5" />
                  بازسازی خودکار
                </Button>
              </div>
              <Textarea
                dir="auto"
                value={editedText}
                onChange={(event) => {
                  setEditedText(event.target.value);
                  setManualText(true);
                }}
                placeholder="متن آگهی برای ارسال…"
                className="min-h-[300px] resize-y whitespace-pre-wrap text-[13px] leading-7 sm:min-h-[380px]"
              />
              <p className="text-[10px] leading-5 text-muted-foreground">
                هر تغییری که اینجا انجام دهید دقیقاً همان متن در تلگرام،
                واتساپ، پیامک یا کپی متن استفاده می‌شود.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  تعداد آگهی ارسالی
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={Math.max(limit, 1)}
                  value={effective}
                  onChange={(e) => {
                    setCount(Number(e.target.value) || 1);
                    setManualText(false);
                  }}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[1, 3, 5, 10, 20].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant={effective === n ? "default" : "outline"}
                      className="h-8 min-w-10 px-2 text-xs"
                      onClick={() => {
                        setCount(n);
                        setManualText(false);
                      }}
                      disabled={n > limit}
                    >
                      {faNum(n)}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      setCount(Math.max(limit, 1));
                      setManualText(false);
                    }}
                    disabled={limit <= 1}
                  >
                    همه
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground" htmlFor="sd-name">
                  نام دفتر
                </Label>
                <Input
                  id="sd-name"
                  value={settings.officeName}
                  onChange={(e) => {
                    onSettingsChange({ officeName: e.target.value });
                    setManualText(false);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  className="text-xs text-muted-foreground"
                  htmlFor="sd-phone"
                >
                  شماره تماس در متن
                </Label>
                <Input
                  id="sd-phone"
                  dir="ltr"
                  inputMode="tel"
                  placeholder="09120858095"
                  value={settings.managerPhone}
                  onChange={(e) => {
                    onSettingsChange({ managerPhone: e.target.value });
                    setManualText(false);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground" htmlFor="sd-foot">
                  متن پایانی
                </Label>
                <Textarea
                  id="sd-foot"
                  rows={3}
                  placeholder="توضیحات اضافه…"
                  value={settings.shareFooter}
                  onChange={(e) => {
                    onSettingsChange({ shareFooter: e.target.value });
                    setManualText(false);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border/60 bg-background px-4 py-3 sm:px-5">
          <div className="flex w-full flex-col gap-3">
            <p className="text-[10px] text-muted-foreground">
              متن بالا قبل از ارسال کاملاً قابل ویرایش است.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {SHARE_CHANNELS.map((channel) => {
                const Icon = CHANNEL_ICONS[channel.id];
                return (
                  <Button
                    key={channel.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-10 gap-1.5"
                    disabled={
                      busy !== null ||
                      chosen.length === 0 ||
                      !editedText.trim()
                    }
                    onClick={() => void handleShare(channel.id)}
                  >
                    <Icon className="size-4" />
                    {channel.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
