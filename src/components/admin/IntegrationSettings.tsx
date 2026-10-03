import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { Bot, CheckCircle2, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function IntegrationSettings() {
  const status = useQuery(api.integrations.getIntegrationStatus, {});
  const saveSettings = useMutation(api.integrations.saveIntegrationSettings);
  const test = useAction(api.integrations.testIntegrations);

  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [baleToken, setBaleToken] = useState("");
  const [baleChatId, setBaleChatId] = useState("");
  const [notifyLeads, setNotifyLeads] = useState(true);
  const [notifyPublicationRequests, setNotifyPublicationRequests] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (!status?.allowed) return;
    setTelegramChatId(status.telegramChatId || "");
    setBaleChatId(status.baleChatId || "");
    setNotifyLeads(status.notifyLeads);
    setNotifyPublicationRequests(status.notifyPublicationRequests);
  }, [status]);

  if (!status?.allowed) return null;

  const save = async () => {
    setSaving(true);
    try {
      await saveSettings({
        telegramBotToken: telegramToken.trim() || undefined,
        telegramChatId,
        clearTelegramToken: false,
        baleBotToken: baleToken.trim() || undefined,
        baleChatId,
        clearBaleToken: false,
        notifyLeads,
        notifyPublicationRequests,
      });
      setTelegramToken("");
      setBaleToken("");
      toast.success("تنظیمات پیام‌رسان ذخیره شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره تنظیمات ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const runTest = async (channel: "telegram" | "bale") => {
    setTesting(channel);
    try {
      const result = await test({ channel });
      const value = result?.[channel];
      if (value === "sent") toast.success(`پیام آزمایشی ${channel === "telegram" ? "تلگرام" : "بله"} ارسال شد`);
      else toast.error(typeof value === "string" ? value : "ارسال انجام نشد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ارسال آزمایشی ناموفق بود");
    } finally {
      setTesting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="size-5" />
          تلگرام و بله
        </CardTitle>
        <CardDescription>
          توکن‌ها فقط سمت سرور نگهداری می‌شوند. برای هر پیام‌رسان Bot Token و Chat ID مدیر را وارد کنید.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-border/70 p-4">
            <div className="flex items-center justify-between">
              <strong className="text-sm">Telegram</strong>
              {status.telegramConfigured && <CheckCircle2 className="size-4 text-emerald-500" />}
            </div>
            <Input
              dir="ltr"
              type="password"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              placeholder={status.telegramConfigured ? "توکن قبلاً ثبت شده؛ برای تغییر مقدار جدید وارد کنید" : "Bot Token"}
            />
            <Input dir="ltr" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="Chat ID" />
            <Button type="button" variant="outline" size="sm" disabled={testing !== null} onClick={() => void runTest("telegram")} className="gap-1.5">
              {testing === "telegram" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              تست تلگرام
            </Button>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/70 p-4">
            <div className="flex items-center justify-between">
              <strong className="text-sm">بله</strong>
              {status.baleConfigured && <CheckCircle2 className="size-4 text-emerald-500" />}
            </div>
            <Input
              dir="ltr"
              type="password"
              value={baleToken}
              onChange={(e) => setBaleToken(e.target.value)}
              placeholder={status.baleConfigured ? "توکن قبلاً ثبت شده؛ برای تغییر مقدار جدید وارد کنید" : "Bot Token"}
            />
            <Input dir="ltr" value={baleChatId} onChange={(e) => setBaleChatId(e.target.value)} placeholder="Chat ID" />
            <Button type="button" variant="outline" size="sm" disabled={testing !== null} onClick={() => void runTest("bale")} className="gap-1.5">
              {testing === "bale" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              تست بله
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-xs font-bold">
            اعلان درخواست‌های مشتری
            <Switch checked={notifyLeads} onCheckedChange={setNotifyLeads} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-xs font-bold">
            اعلان درخواست تأیید آگهی
            <Switch checked={notifyPublicationRequests} onCheckedChange={setNotifyPublicationRequests} />
          </label>
        </div>

        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          ذخیره تنظیمات پیام‌رسان
        </Button>
      </CardContent>
    </Card>
  );
}
