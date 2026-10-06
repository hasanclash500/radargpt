import { ThemeToggle } from "@/components/ThemeToggle";
import DashboardSectionNav from "@/components/dashboard/DashboardSectionNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useSeo } from "@/hooks/use-seo";
import { formatArea, formatPrice, formatRooms } from "@/lib/format";
import { useAction } from "convex/react";
import {
  ArrowRight,
  Bot,
  Building2,
  ExternalLink,
  Loader2,
  Mic,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { toast } from "sonner";

type AssistantListing = {
  ref: string;
  slug: string;
  title: string;
  city: string;
  propertyType: string;
  dealType: string;
  area: number | null;
  rooms: number | null;
  priceMillion: number;
  depositMillion: number | null;
  rentMillion: number | null;
  description: string;
  imageUrl: string | null;
  score: number;
};

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  listings?: AssistantListing[];
};

const SUGGESTIONS = [
  "سوله حدود ۱۰۰۰ متر برای اجاره با ودیعه نزدیک ۲ میلیارد",
  "دفتر اداری حدود ۱۵۰ متر برای خرید معرفی کن",
  "فایل‌های نزدیک به بودجه ۵ میلیارد را پیدا کن",
  "در معامله ملک صنعتی چه نکات حقوقی مهم است؟",
  "یک سؤال عمومی دارم؛ چطور می‌توانم بهتر تصمیم‌گیری کنم؟",
];

function speak(text: string) {
  if (!("speechSynthesis" in window)) {
    toast.error("خواندن صوتی در این مرورگر پشتیبانی نمی‌شود.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 1800));
  utterance.lang = "fa-IR";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function ListingResultCard({ item }: { item: AssistantListing }) {
  const price =
    item.rentMillion != null && item.rentMillion > 0
      ? `اجاره ${formatPrice(item.rentMillion)}`
      : item.priceMillion > 0
        ? formatPrice(item.priceMillion)
        : "قیمت توافقی";

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_110px] sm:grid-cols-[minmax(0,1fr)_150px]">
        <div className="min-w-0 p-3.5 sm:p-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">
              {item.ref}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {item.dealType || item.propertyType}
            </span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-black leading-6">
            {item.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>{item.city}</span>
            {item.area != null && <span>{formatArea(item.area)}</span>}
            {item.rooms != null && <span>{formatRooms(item.rooms)}</span>}
          </div>
          {item.depositMillion != null && item.depositMillion > 0 && (
            <p className="mt-2 text-xs">
              <span className="text-muted-foreground">ودیعه: </span>
              <strong>{formatPrice(item.depositMillion)}</strong>
            </p>
          )}
          <p className="mt-1 text-xs font-extrabold text-primary">{price}</p>
          <Button asChild size="sm" variant="outline" className="mt-3 h-8 gap-1.5 text-[11px]">
            <Link to={item.slug ? `/listings/${item.slug}` : "/listings"}>
              مشاهده آگهی در دیوساز
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </div>

        <Link
          to={item.slug ? `/listings/${item.slug}` : "/listings"}
          className="flex min-h-32 items-center justify-center bg-muted/50 p-2"
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full max-h-44 w-full object-contain"
              loading="lazy"
            />
          ) : (
            <Building2 className="size-10 text-muted-foreground/30" />
          )}
        </Link>
      </div>
    </article>
  );
}

export default function AssistantPage() {
  const location = useLocation();
  const insideDashboard = location.pathname.startsWith("/dashboard/");
  const backHref = insideDashboard ? "/dashboard" : "/";
  const listingsHref = insideDashboard ? "/dashboard/listings" : "/listings";
  const ask = useAction(api.assistant.ask);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text:
        "سلام، من راهنمای دیوساز هستم. برای معرفی ملک فقط داخل آگهی‌های منتشرشده همین سایت جستجو می‌کنم. می‌توانید نوع ملک، شهر، متراژ و حدود قیمت را بنویسید یا با میکروفن بگویید.",
    },
  ]);
  const nextId = useRef(2);

  useSeo({
    title: "راهنمای ملک دیوساز",
    description:
      "جستجوی کلامی و صوتی در آگهی‌های خود دیوساز و دریافت اطلاعات عمومی ملکی و حقوقی.",
    keywords: ["راهنمای ملک", "جستجوی صوتی ملک", "دیوساز"],
    type: "website",
  });

  const speechSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      Boolean(
        (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition,
      ),
    [],
  );

  const submit = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || sending) return;

    const userMessage: Message = {
      id: nextId.current++,
      role: "user",
      text: question,
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);

    try {
      const result = await ask({ question });
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          text: result.answer,
          listings: result.listings as AssistantListing[],
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "پاسخ دستیار دریافت نشد.";
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          text: "در دریافت پاسخ مشکلی پیش آمد. دوباره تلاش کنید.",
        },
      ]);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const startVoice = () => {
    const Recognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      toast.error("جستجوی صوتی در این مرورگر پشتیبانی نمی‌شود.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "fa-IR";
    recognition.interimResults = false;
    recognition.continuous = false;
    setListening(true);

    recognition.onresult = (event: any) => {
      const transcript =
        event?.results?.[0]?.[0]?.transcript?.trim?.() ?? "";
      if (transcript) {
        setInput(transcript);
        void submit(transcript);
      }
    };
    recognition.onerror = () => {
      setListening(false);
      toast.error("صدای شما دریافت نشد. دوباره امتحان کنید.");
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <main dir="rtl" className="min-h-screen w-full max-w-[100dvw] overflow-x-clip bg-muted/30">
      <header className="glass sticky top-0 z-50 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to={backHref} className="flex items-center gap-2.5 font-extrabold">
            <ArrowRight className="size-4" />
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bot className="size-5" />
            </span>
            دستیار دیوساز
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to={listingsHref}>آگهی‌ها</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {insideDashboard && <DashboardSectionNav />}

      <section className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.045] p-4">
            <div className="flex items-center gap-2">
              <Search className="size-5 text-primary" />
              <p className="font-extrabold">جستجوی ملک فقط در دیوساز</p>
            </div>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              هیچ آگهی از سایت‌های دیگر وارد پیشنهادها نمی‌شود. کارت‌های ملک مستقیماً از دیتابیس آگهی‌های عمومی دیوساز ساخته می‌شوند.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <p className="font-extrabold">حقوقی و پرسش‌های عمومی</p>
            </div>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              دستیار به پرسش‌های عمومی هم پاسخ می‌دهد. پاسخ‌های حقوقی جنبه عمومی و آموزشی دارند و برای قرارداد، اختلاف یا اقدام حقوقی باید اسناد واقعی توسط وکیل یا کارشناس بررسی شوند.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm">
          <div className="flex min-h-[56vh] flex-col gap-4 p-3 sm:p-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ms-auto max-w-[88%]"
                    : "me-auto w-full max-w-[94%]"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "rounded-2xl rounded-es-md bg-primary px-4 py-3 text-sm leading-7 text-primary-foreground"
                      : "rounded-2xl rounded-ee-md border border-border/70 bg-card px-4 py-3 text-sm leading-7"
                  }
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => speak(message.text)}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary"
                    >
                      <Volume2 className="size-3.5" />
                      خواندن پاسخ
                    </button>
                  )}
                </div>

                {message.listings && message.listings.length > 0 && (
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {message.listings.map((item) => (
                      <ListingResultCard key={item.ref + item.slug} item={item} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="me-auto inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                در حال بررسی آگهی‌های دیوساز…
              </div>
            )}
          </div>

          <div className="border-t border-border/70 bg-card/60 p-3 sm:p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={sending}
                  onClick={() => void submit(suggestion)}
                  className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-bold hover:border-primary/40 hover:text-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                rows={2}
                placeholder="مثلاً: سوله ۸۰۰ تا ۱۲۰۰ متر برای اجاره، ودیعه حدود ۲ میلیارد…"
                className="min-h-[52px] resize-none rounded-2xl bg-background"
              />
              {speechSupported && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-12 shrink-0 rounded-2xl"
                  disabled={sending || listening}
                  onClick={startVoice}
                  aria-label="جستجوی صوتی"
                >
                  {listening ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                className="size-12 shrink-0 rounded-2xl"
                disabled={sending || !input.trim()}
                onClick={() => void submit()}
                aria-label="ارسال"
              >
                {sending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Send className="size-5" />
                )}
              </Button>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              پیشنهاد ملک فقط از آگهی‌های منتشرشده سایت دیوساز است.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
