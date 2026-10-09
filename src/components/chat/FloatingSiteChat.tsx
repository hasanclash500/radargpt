import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";

const TOKEN_KEY = "divsaz-chat-guest-token";

function makeGuestToken() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(TOKEN_KEY);
  if (existing) return existing;

  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `g_${crypto.randomUUID().replace(/-/g, "")}`
      : `g_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(TOKEN_KEY, value);
  return value;
}

function formatTime(timestamp: number) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp);
  } catch {
    return "";
  }
}

function PersonAvatar({ person }: { person: any }) {
  return person?.imageUrl ? (
    <img
      src={person.imageUrl}
      alt={person.displayName || ""}
      className="size-10 shrink-0 rounded-2xl object-cover"
    />
  ) : (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-black text-primary">
      {(person?.displayName || "د").slice(0, 1)}
    </span>
  );
}

export default function FloatingSiteChat() {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authenticated = isAuthenticated;
  const contacts = useQuery(api.advisorChat.listContacts, {}) ?? [];
  const registerGuest = useMutation(api.advisorChat.registerGuest);
  const startConversation = useMutation(api.advisorChat.startConversation);
  const sendMessage = useMutation(api.advisorChat.sendMessage);
  const markRead = useMutation(api.advisorChat.markRead);

  const [guestToken] = useState(() => makeGuestToken());
  const guestProfile = useQuery(
    api.advisorChat.getGuestProfile,
    !authLoading && !isAuthenticated && guestToken ? { guestToken } : "skip",
  );
  const conversations =
    useQuery(
      api.advisorChat.listConversations,
      authLoading
        ? "skip"
        : isAuthenticated
          ? {}
          : guestToken
            ? { guestToken }
            : "skip",
    ) ?? [];

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [pendingPerson, setPendingPerson] = useState<any>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [registering, setRegistering] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(
    api.advisorChat.getMessages,
    selectedId
      ? { conversationId: selectedId, guestToken: authenticated ? undefined : guestToken || undefined }
      : "skip",
  );

  const unreadTotal = useMemo(
    () =>
      conversations.reduce(
        (sum: number, item: any) => sum + (item.unreadCount || 0),
        0,
      ),
    [conversations],
  );

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("divsaz-open-chat", handleOpen);
    return () => window.removeEventListener("divsaz-open-chat", handleOpen);
  }, []);

  useEffect(() => {
    if (!open || !selectedId) return;
    void markRead({
      conversationId: selectedId,
      guestToken: authenticated ? undefined : guestToken || undefined,
    }).catch(() => undefined);
  }, [open, selectedId, messages?.length, guestToken, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length, selectedId]);

  useEffect(() => {
    if (!selectedId || selectedPerson) return;
    const existing = conversations.find(
      (conversation: any) => String(conversation.id) === String(selectedId),
    );
    if (existing?.other) setSelectedPerson(existing.other);
  }, [selectedId, selectedPerson, conversations]);

  const openConversation = async (person: any) => {
    if (!authenticated && !guestProfile) {
      setPendingPerson(person);
      return;
    }

    try {
      const existing = conversations.find(
        (conversation: any) =>
          conversation.other?.userId === person.userId,
      );
      const id =
        existing?.id ??
        (await startConversation({
          otherUserId: person.userId,
          guestToken: authenticated ? undefined : guestToken || undefined,
        }));
      setSelectedPerson(person);
      setSelectedId(id);
      setPendingPerson(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "باز کردن گفت‌وگو ناموفق بود",
      );
    }
  };

  const submitGuest = async (event: FormEvent) => {
    event.preventDefault();
    if (!pendingPerson || registering) return;
    setRegistering(true);
    try {
      await registerGuest({
        guestToken,
        name: guestName,
        phone: guestPhone.trim() || undefined,
      });
      const id = await startConversation({
        otherUserId: pendingPerson.userId,
        guestToken,
      });
      setSelectedPerson(pendingPerson);
      setSelectedId(id);
      setPendingPerson(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ثبت مشخصات انجام نشد",
      );
    } finally {
      setRegistering(false);
    }
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const body = message.trim();
    if (!selectedId || !body || sending) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId: selectedId,
        body,
        guestToken: authenticated ? undefined : guestToken || undefined,
      });
      setMessage("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ارسال پیام ناموفق بود",
      );
    } finally {
      setSending(false);
    }
  };

  const closeConversation = () => {
    setSelectedId(null);
    setSelectedPerson(null);
    setPendingPerson(null);
  };

  if (
    location.pathname === "/assistant" ||
    location.pathname.startsWith("/dashboard/assistant")
  ) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-24 end-4 z-[80] md:bottom-6 md:end-6"
    >
      {open && (
        <div className="absolute bottom-16 end-0 flex h-[min(72dvh,640px)] w-[calc(100dvw-24px)] max-w-[390px] flex-col overflow-hidden rounded-[1.6rem] border border-border/70 bg-background shadow-2xl">
          <div className="flex shrink-0 items-center gap-2 border-b border-border/70 bg-card px-3 py-3">
            {(selectedId || pendingPerson) && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-9 rounded-xl"
                onClick={closeConversation}
                aria-label="بازگشت"
              >
                <ArrowRight className="size-4" />
              </Button>
            )}
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm">
                {selectedPerson?.displayName || pendingPerson?.displayName || "چت دیوساز"}
              </strong>
              <span className="block truncate text-[10px] text-muted-foreground">
                {selectedPerson
                  ? selectedPerson.role === "manager"
                    ? "گفت‌وگوی خصوصی با مدیر"
                    : "گفت‌وگوی خصوصی با مشاور"
                  : "مدیر یا مشاور خود را انتخاب کنید"}
              </span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 rounded-xl"
              onClick={() => setOpen(false)}
              aria-label="بستن چت"
            >
              <X className="size-4" />
            </Button>
          </div>

          {pendingPerson && !authenticated && !guestProfile ? (
            <form
              onSubmit={(event) => void submitGuest(event)}
              className="flex flex-1 flex-col justify-center gap-3 overflow-y-auto p-4"
            >
              <UserRound className="mx-auto size-10 text-primary" />
              <div className="text-center">
                <h3 className="font-black">شروع گفتگو با {pendingPerson.displayName}</h3>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  برای اینکه بتوانید بعداً همین گفتگو را ادامه دهید، نام خود را وارد کنید.
                </p>
              </div>
              <Input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="نام شما *"
                autoComplete="name"
              />
              <Input
                dir="ltr"
                inputMode="tel"
                value={guestPhone}
                onChange={(event) => setGuestPhone(event.target.value)}
                placeholder="شماره موبایل (اختیاری)"
                autoComplete="tel"
              />
              <div className="rounded-2xl border border-primary/15 bg-primary/[0.035] p-3 text-[10px] leading-5 text-muted-foreground">
                <ShieldCheck className="mb-1 size-4 text-primary" />
                این گفتگو خصوصی است. مدیر سایت برای پشتیبانی و مدیریت، امکان بررسی تاریخچه گفتگوها را دارد.
              </div>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={registering || guestName.trim().length < 2}
              >
                {registering && <Loader2 className="size-4 animate-spin" />}
                شروع گفتگو
              </Button>
            </form>
          ) : selectedId && selectedPerson ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-3">
                {messages === undefined ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full min-h-48 items-center justify-center text-center">
                    <div>
                      <MessageCircle className="mx-auto size-9 text-muted-foreground/30" />
                      <p className="mt-3 text-sm font-black">
                        اولین پیام را ارسال کنید
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((item: any) => (
                      <div
                        key={String(item.id)}
                        className={"flex " + (item.mine ? "justify-start" : "justify-end")}
                      >
                        <div
                          className={
                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm " +
                            (item.mine
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md border border-border/70 bg-card")
                          }
                        >
                          <p dir="auto" className="whitespace-pre-wrap break-words leading-6">
                            {item.body}
                          </p>
                          <p
                            className={
                              "mt-1 text-[9px] " +
                              (item.mine
                                ? "text-primary-foreground/65"
                                : "text-muted-foreground")
                            }
                          >
                            {formatTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={(event) => void submitMessage(event)}
                className="flex shrink-0 items-end gap-2 border-t border-border/70 bg-card p-3"
              >
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={1}
                  maxLength={4000}
                  placeholder="پیام بنویسید…"
                  className="min-h-11 max-h-28 flex-1 resize-none rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="size-11 shrink-0 rounded-2xl"
                  disabled={sending || !message.trim()}
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {conversations.length > 0 && (
                <div className="border-b border-border/60 py-2">
                  <p className="px-4 py-2 text-[10px] font-extrabold text-muted-foreground">
                    گفتگوهای شما
                  </p>
                  {conversations.map((conversation: any) => (
                    <button
                      key={String(conversation.id)}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-right hover:bg-muted/60"
                      onClick={() => {
                        setSelectedId(conversation.id);
                        setSelectedPerson(conversation.other);
                      }}
                    >
                      <PersonAvatar person={conversation.other} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <strong className="truncate text-sm">
                            {conversation.other?.displayName}
                          </strong>
                          <span className="text-[9px] text-muted-foreground">
                            {formatTime(conversation.updatedAt)}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-[10px] text-muted-foreground">
                            {conversation.lastMessage || "گفتگو را ادامه دهید"}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-black text-primary-foreground">
                              {conversation.unreadCount.toLocaleString("fa-IR")}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className="px-4 pb-2 pt-4 text-[10px] font-extrabold text-muted-foreground">
                مدیر و مشاوران دیوساز
              </p>
              {contacts.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                  در حال حاضر مخاطبی برای چت در دسترس نیست.
                </p>
              ) : (
                contacts.map((contact: any) => (
                  <button
                    key={contact.userId}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-right hover:bg-muted/60"
                    onClick={() => void openConversation(contact)}
                  >
                    <PersonAvatar person={contact} />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">
                        {contact.displayName}
                      </strong>
                      <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                        {contact.headline ||
                          (contact.role === "manager" ? "مدیر دیوساز" : "مشاور دیوساز")}
                      </span>
                    </span>
                    <MessageCircle className="size-4 text-primary" />
                  </button>
                ))
              )}

              <p className="m-3 rounded-xl bg-muted/50 px-3 py-2 text-[9px] leading-5 text-muted-foreground">
                گفتگوها خصوصی‌اند؛ مدیر دیوساز برای مدیریت و پشتیبانی به تاریخچه گفتگوها دسترسی دارد.
              </p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-12 items-center justify-center rounded-full bg-[#082f54] text-white shadow-xl ring-1 ring-white/10 transition-transform hover:scale-105 sm:size-14"
        aria-label={open ? "بستن چت دیوساز" : "باز کردن چت دیوساز"}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && unreadTotal > 0 && (
          <span className="absolute -start-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-black text-destructive-foreground ring-2 ring-background">
            {Math.min(unreadTotal, 99).toLocaleString("fa-IR")}
          </span>
        )}
      </button>
    </div>
  );
}
