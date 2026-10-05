import DashboardSectionNav from "@/components/dashboard/DashboardSectionNav";
import MekaBrand from "@/components/MekaBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  History,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

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

function PersonAvatar({
  person,
  size = "md",
}: {
  person: any;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "size-12" : size === "sm" ? "size-9" : "size-10";
  return person?.imageUrl ? (
    <img
      src={person.imageUrl}
      alt={person.displayName || ""}
      className={sizeClass + " shrink-0 rounded-2xl object-cover"}
    />
  ) : (
    <span
      className={
        sizeClass +
        " flex shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-black text-primary"
      }
    >
      {(person?.displayName || "م").slice(0, 1)}
    </span>
  );
}

export default function AdvisorChat() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const role = useQuery(api.roles.myRole, {});
  const conversations = useQuery(api.advisorChat.listConversations, {}) ?? [];
  const allConversations = useQuery(
    api.advisorChat.listAllConversations,
    role?.role === "manager" ? {} : "skip",
  );
  const contacts = useQuery(api.advisorChat.listContacts, {}) ?? [];
  const startConversation = useMutation(api.advisorChat.startConversation);
  const sendMessage = useMutation(api.advisorChat.sendMessage);
  const markRead = useMutation(api.advisorChat.markRead);
  const deleteConversation = useMutation(api.advisorChat.deleteConversation);

  const [selectedId, setSelectedId] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [historyReadOnly, setHistoryReadOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(
    api.advisorChat.getMessages,
    selectedId ? { conversationId: selectedId } : "skip",
  );

  const allowed = isAuthenticated;

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact: any) =>
      [contact.displayName, contact.headline, contact.role]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [contacts, search]);

  useEffect(() => {
    if (!selectedId || historyReadOnly) return;
    void markRead({ conversationId: selectedId }).catch(() => undefined);
  }, [selectedId, messages?.length, historyReadOnly]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length, selectedId]);

  useEffect(() => {
    if (!selectedId || selectedPerson) return;
    const existing = conversations.find(
      (conversation: any) => String(conversation.id) === String(selectedId),
    );
    if (existing) setSelectedPerson(existing.other);
  }, [selectedId, selectedPerson, conversations]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-muted/20 p-4"
      >
        <div className="max-w-md rounded-3xl border border-border bg-card p-6 text-center">
          <MessageCircle className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-black">
            برای استفاده از پنل چت وارد حساب شوید
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            چت شناور عمومی بدون ورود هم در همه صفحات سایت در دسترس است.
          </p>
          <Button asChild className="mt-5">
            <Link to="/dashboard">بازگشت به داشبورد</Link>
          </Button>
        </div>
      </main>
    );
  }

  const openConversation = async (person: any) => {
    try {
      const existing = conversations.find(
        (conversation: any) =>
          conversation.other.userId === person.userId,
      );
      const id =
        existing?.id ??
        (await startConversation({ otherUserId: person.userId }));
      setHistoryReadOnly(false);
      setSelectedPerson(person);
      setSelectedId(id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "باز کردن گفت‌وگو ناموفق بود",
      );
    }
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const body = message.trim();
    if (!selectedId || !body || sending || historyReadOnly) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId: selectedId,
        body,
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

  const openHistoryConversation = (conversation: any) => {
    setHistoryReadOnly(true);
    setSelectedId(conversation.id);
    setSelectedPerson({
      displayName:
        (conversation.participantA?.displayName || "—") +
        " ↔ " +
        (conversation.participantB?.displayName || "—"),
      headline: "مشاهده تاریخچه توسط مدیر",
      imageUrl: null,
      profileSlug: "",
    });
  };

  const removeHistory = async (conversationId: any) => {
    if (
      !window.confirm(
        "کل تاریخچه این گفتگو حذف شود؟ این کار قابل بازگشت نیست.",
      )
    ) {
      return;
    }

    setDeletingId(String(conversationId));
    try {
      await deleteConversation({ conversationId });
      if (String(selectedId) === String(conversationId)) {
        setSelectedId(null);
        setSelectedPerson(null);
        setHistoryReadOnly(false);
      }
      toast.success("تاریخچه گفتگو حذف شد");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "حذف گفتگو ناموفق بود",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-muted/20">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link to="/dashboard">
                <ArrowRight className="size-4" />
                داشبورد
              </Link>
            </Button>
            <MekaBrand compact link={false} />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <DashboardSectionNav />

      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 rounded-3xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-black">چت خصوصی دیوساز</h1>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                گفت‌وگوی خصوصی کاربران، ادمین‌ها و مشاوران با مدیر یا مشاوران دیوساز.
              </p>
            </div>
          </div>
        </div>

        {role?.role === "manager" && (
          <section className="mb-4 rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <History className="size-5 text-primary" />
                <div>
                  <h2 className="text-sm font-black">تاریخچه همه گفتگوها</h2>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    مدیر می‌تواند تاریخچه خصوصی گفتگوها را برای پشتیبانی بررسی و در صورت نیاز حذف کند.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                {(allConversations?.length ?? 0).toLocaleString("fa-IR")}
              </span>
            </div>

            {allConversations === undefined ? (
              <div className="flex justify-center py-5">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            ) : allConversations.length === 0 ? (
              <p className="py-5 text-center text-xs text-muted-foreground">
                هنوز گفتگویی ثبت نشده است.
              </p>
            ) : (
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pe-1">
                {allConversations.map((conversation: any) => (
                  <div
                    key={String(conversation.id)}
                    className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/60 p-2.5"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-right"
                      onClick={() => openHistoryConversation(conversation)}
                    >
                      <strong className="block truncate text-xs">
                        {conversation.participantA?.displayName || "—"}
                        <span className="mx-1.5 text-muted-foreground">↔</span>
                        {conversation.participantB?.displayName || "—"}
                      </strong>
                      <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                        {conversation.lastMessage || "بدون پیام"}
                      </span>
                    </button>
                    <span className="hidden shrink-0 text-[9px] text-muted-foreground sm:block">
                      {formatTime(conversation.updatedAt)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-[10px]"
                      onClick={() => openHistoryConversation(conversation)}
                    >
                      مشاهده
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 shrink-0 text-destructive"
                      disabled={deletingId === String(conversation.id)}
                      onClick={() => void removeHistory(conversation.id)}
                      aria-label="حذف تاریخچه گفتگو"
                    >
                      {deletingId === String(conversation.id) ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm lg:grid lg:h-[calc(100dvh-210px)] lg:min-h-[620px] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className={
              "border-border/60 bg-card lg:block lg:border-l " +
              (selectedId ? "hidden" : "block")
            }
          >
            <div className="border-b border-border/60 p-3">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="جستجوی مدیر یا مشاور…"
                  className="pe-9"
                />
              </div>
            </div>

            <div className="max-h-[calc(100dvh-300px)] overflow-y-auto lg:max-h-none lg:h-[calc(100%-65px)]">
              {conversations.length > 0 && !search.trim() && (
                <div className="border-b border-border/60 py-2">
                  <p className="px-4 py-2 text-[10px] font-extrabold text-muted-foreground">
                    گفت‌وگوهای اخیر
                  </p>
                  {conversations.map((conversation: any) => (
                    <button
                      key={String(conversation.id)}
                      type="button"
                      onClick={() => {
                        setHistoryReadOnly(false);
                        setSelectedId(conversation.id);
                        setSelectedPerson(conversation.other);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
                    >
                      <PersonAvatar person={conversation.other} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <strong className="truncate text-sm">
                            {conversation.other.displayName}
                          </strong>
                          <span className="text-[9px] text-muted-foreground">
                            {formatTime(conversation.updatedAt)}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-[10px] text-muted-foreground">
                            {conversation.lastMessage || "گفت‌وگو را شروع کنید"}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-black text-primary-foreground">
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
              {filteredContacts.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                  مشاوری پیدا نشد.
                </p>
              ) : (
                filteredContacts.map((contact: any) => (
                  <button
                    key={contact.userId}
                    type="button"
                    onClick={() => void openConversation(contact)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
                  >
                    <PersonAvatar person={contact} />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">
                        {contact.displayName}
                      </strong>
                      <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                        {contact.headline ||
                          (contact.role === "manager"
                            ? "مدیر دیوساز"
                            : "مشاور دیوساز")}
                      </span>
                    </span>
                    <MessageCircle className="size-4 text-primary" />
                  </button>
                ))
              )}
            </div>
          </aside>

          <section
            className={
              "min-h-[70dvh] bg-background lg:flex lg:min-h-0 lg:flex-col " +
              (selectedId ? "flex flex-col" : "hidden")
            }
          >
            {selectedId && selectedPerson ? (
              <>
                <div className="flex items-center gap-3 border-b border-border/60 px-3 py-3 sm:px-4">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="lg:hidden"
                    onClick={() => {
                      setSelectedId(null);
                      setSelectedPerson(null);
                    }}
                    aria-label="بازگشت به فهرست گفت‌وگوها"
                  >
                    <ArrowRight className="size-5" />
                  </Button>
                  <PersonAvatar person={selectedPerson} size="lg" />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">
                      {selectedPerson.displayName}
                    </strong>
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      {selectedPerson.headline ||
                        (selectedPerson.role === "manager"
                          ? "مدیر دیوساز"
                          : "مشاور دیوساز")}
                    </p>
                  </div>
                  {selectedPerson.profileSlug && (
                    <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                      <Link to={"/consultants/" + selectedPerson.profileSlug}>
                        پروفایل
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-4 sm:px-5">
                  {messages === undefined ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="size-5 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full min-h-72 items-center justify-center text-center">
                      <div>
                        <UserRound className="mx-auto size-10 text-muted-foreground/40" />
                        <p className="mt-3 text-sm font-black">
                          شروع گفت‌وگو با {selectedPerson.displayName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          اولین پیام را ارسال کنید.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((item: any) => (
                        <div
                          key={String(item.id)}
                          className={
                            "flex " +
                            (item.mine ? "justify-start" : "justify-end")
                          }
                        >
                          <div
                            className={
                              "max-w-[84%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[70%] " +
                              (item.mine
                                ? "rounded-br-md bg-primary text-primary-foreground"
                                : "rounded-bl-md border border-border/70 bg-card")
                            }
                          >
                            {historyReadOnly && (
                              <p
                                className={
                                  "mb-1 text-[9px] font-black " +
                                  (item.mine
                                    ? "text-primary-foreground/80"
                                    : "text-primary")
                                }
                              >
                                {item.senderName}
                              </p>
                            )}
                            <p
                              dir="auto"
                              className="whitespace-pre-wrap break-words text-sm leading-6"
                            >
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

                {historyReadOnly ? (
                  <div className="shrink-0 border-t border-border/60 bg-card p-3 text-center text-[10px] leading-5 text-muted-foreground">
                    این نمای مدیریتی فقط برای بررسی تاریخچه است. برای پاسخ، گفتگویی را که خودتان یکی از طرفین آن هستید از فهرست گفتگوهای اخیر باز کنید.
                  </div>
                ) : (
                  <form
                    onSubmit={(event) => void submitMessage(event)}
                    className="flex shrink-0 items-end gap-2 border-t border-border/60 bg-card p-3 sm:p-4"
                  >
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          window.innerWidth >= 768
                        ) {
                          event.preventDefault();
                          void submitMessage(event as any);
                        }
                      }}
                      rows={1}
                      maxLength={4000}
                      placeholder="پیام بنویسید…"
                      className="min-h-11 max-h-32 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="size-11 shrink-0 rounded-2xl"
                      disabled={!message.trim() || sending}
                      aria-label="ارسال پیام"
                    >
                      {sending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </form>
                )}
              </>
            ) : (
              <div className="hidden h-full items-center justify-center lg:flex">
                <div className="text-center">
                  <MessageCircle className="mx-auto size-12 text-muted-foreground/25" />
                  <h2 className="mt-4 font-black">یک مشاور را انتخاب کنید</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    گفت‌وگوهای داخلی دیوساز به‌صورت لحظه‌ای بروزرسانی می‌شوند.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
