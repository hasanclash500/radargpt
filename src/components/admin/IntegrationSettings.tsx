import { Button } from "@/components/ui/button";
import DiscoverChatIdButton from "@/components/admin/DiscoverChatIdButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { Bot, BrainCircuit, CheckCircle2, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function IntegrationSettings() {
  const status = useQuery(api.integrations.getIntegrationStatus, {});
  const saveSettings = useMutation(api.integrations.saveIntegrationSettings);
  const test = useAction(api.integrations.testIntegrations);
  const testAi = useAction(api.integrations.testAi);

  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [baleToken, setBaleToken] = useState("");
  const [baleChatId, setBaleChatId] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [aiModel, setAiModel] = useState("openrouter/free");
  const [notifyLeads, setNotifyLeads] = useState(true);
  const [notifyPublicationRequests, setNotifyPublicationRequests] = useState(true);
  const [notifyListingActivity, setNotifyListingActivity] = useState(true);
  const [notifyChatMessages, setNotifyChatMessages] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (!status?.allowed) return;
    setTelegramChatId(status.telegramChatId || "");
    setBaleChatId(status.baleChatId || "");
    setAiModel(status.aiModel || "openrouter/free");
    setNotifyLeads(status.notifyLeads);
    setNotifyPublicationRequests(status.notifyPublicationRequests);
    setNotifyListingActivity(status.notifyListingActivity);
    setNotifyChatMessages(status.notifyChatMessages);
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
        openRouterApiKey: openRouterKey.trim() || undefined,
        openRouterModel: aiModel.trim() || "openrouter/free",
        clearOpenRouterApiKey: false,
        notifyLeads,
        notifyPublicationRequests,
        notifyListingActivity,
        notifyChatMessages,
      });
      setTelegramToken("");
      setBaleToken("");
      setOpenRouterKey("");
      toast.success("تنظیمات اتصال‌ها و دستیار هوشمند ذخیره شد");
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

  const runAiTest = async () => {
    setTesting("ai");
    try {
      const result = await testAi({});
      if (result?.ok) {
        toast.success(result.answer || "اتصال هوش مصنوعی برقرار است");
      } else {
        toast.error(result?.error || "اتصال هوش مصنوعی برقرار نشد");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "آزمایش هوش مصنوعی ناموفق بود",
      );
    } finally {
      setTesting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="size-5" />
          اتصال‌ها و دستیار هوشمند
        </CardTitle>
        <CardDescription>
          توکن‌ها فقط سمت سرور نگهداری می‌شوند. OpenRouter برای پاسخ مولد دستیار دیوساز و تلگرام/بله برای اعلان‌ها استفاده می‌شوند.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="size-5 text-primary" />
              <strong className="text-sm">هوش مصنوعی دستیار دیوساز</strong>
            </div>
            {status.aiConfigured && <CheckCircle2 className="size-4 text-emerald-500" />}
          </div>
          <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
            کلید OpenRouter سمت سرور ذخیره می‌شود. می‌توانید از مدل/Router رایگان استفاده کنید؛
            جستجو و کارت‌های ملک مستقل از مدل هستند و فقط از آگهی‌های خود دیوساز می‌آیند.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input
              dir="ltr"
              type="password"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              placeholder={status.aiConfigured ? "کلید قبلاً ثبت شده؛ برای تغییر، کلید جدید وارد کنید" : "OpenRouter API Key"}
            />
            <Input
              dir="ltr"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder="openrouter/free"
            />
          </div>
          <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
            مدل پیشنهادی پیش‌فرض: <span dir="ltr">openrouter/free</span>. این Router
            فقط مدل‌های رایگان OpenRouter را انتخاب می‌کند و برای پاسخ عمومی دستیار
            استفاده می‌شود.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testing !== null}
              onClick={() => void runAiTest()}
              className="gap-1.5"
            >
              {testing === "ai" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BrainCircuit className="size-4" />
              )}
              تست هوش مصنوعی رایگان
            </Button>
            <Button asChild type="button" variant="ghost" size="sm">
              <a
                href="https://openrouter.ai/settings/keys"
                target="_blank"
                rel="noreferrer"
              >
                ساخت کلید رایگان OpenRouter
              </a>
            </Button>
          </div>
        </div>

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
            <p className="text-[10px] leading-5 text-muted-foreground">
              بعد از ذخیره توکن، به ربات /start بفرستید؛ سپس می‌توانید Chat ID را خودکار پیدا کنید.
            </p>
            <div className="flex flex-wrap gap-2">
              <DiscoverChatIdButton channel="telegram" />
              <Button type="button" variant="outline" size="sm" disabled={testing !== null} onClick={() => void runTest("telegram")} className="gap-1.5">
              {testing === "telegram" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              تست تلگرام
              </Button>
            </div>
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
            <p className="text-[10px] leading-5 text-muted-foreground">
              بعد از ذخیره توکن، در بازوی بله /start بفرستید و Chat ID را خودکار پیدا کنید.
            </p>
            <div className="flex flex-wrap gap-2">
              <DiscoverChatIdButton channel="bale" />
              <Button type="button" variant="outline" size="sm" disabled={testing !== null} onClick={() => void runTest("bale")} className="gap-1.5">
              {testing === "bale" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              تست بله
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-xs font-bold">
            اعلان درخواست‌های مشتری
            <Switch checked={notifyLeads} onCheckedChange={setNotifyLeads} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-xs font-bold">
            اعلان درخواست تأیید آگهی
            <Switch checked={notifyPublicationRequests} onCheckedChange={setNotifyPublicationRequests} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-xs font-bold">
            اعلان ثبت/برداشتن آگهی
            <Switch checked={notifyListingActivity} onCheckedChange={setNotifyListingActivity} />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-xs font-bold">
            اعلان پیام جدید چت
            <Switch checked={notifyChatMessages} onCheckedChange={setNotifyChatMessages} />
          </label>
        </div>

        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          ذخیره تنظیمات اتصال‌ها
        </Button>
      </CardContent>
    </Card>
  );
}
