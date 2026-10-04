import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

type Story = {
  id: any;
  ownerUserId: string;
  title: string;
  body: string;
  contentType: "image" | "video" | "text";
  mediaUrl: string | null;
  linkUrl: string;
  linkLabel: string;
  stickerText: string;
  stickerStyle: string;
  background: string;
  durationSec: number;
  advisor: {
    slug: string;
    displayName: string;
    profileImageUrl: string | null;
    headline: string;
  };
};

function isInternal(href: string) {
  return href.startsWith("/");
}

function StoryLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  if (!href) return null;
  const className =
    "inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-emerald-950 shadow-xl";
  if (isInternal(href)) {
    return (
      <Link to={href} className={className}>
        {label || "مشاهده جزئیات"}
        <ArrowLeft className="size-4" />
      </Link>
    );
  }
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className={className}
    >
      {label || "مشاهده جزئیات"}
      <ExternalLink className="size-4" />
    </a>
  );
}

function StoryViewer({
  stories,
  initialIndex,
  onClose,
}: {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}) {
  const recordView = useMutation(api.stories.recordView);
  const [index, setIndex] = useState(initialIndex);
  const story = stories[index];

  const next = () => {
    if (index >= stories.length - 1) {
      onClose();
      return;
    }
    setIndex((value) => value + 1);
  };

  const previous = () => {
    if (index <= 0) return;
    setIndex((value) => value - 1);
  };

  useEffect(() => {
    if (!story) return;
    void recordView({ id: story.id }).catch(() => undefined);
    const timer = window.setTimeout(next, Math.max(3, story.durationSec) * 1000);
    return () => window.clearTimeout(timer);
  }, [story?.id]);

  if (!story) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      dir="rtl"
    >
      <div className="relative h-[100dvh] w-full max-w-[520px] overflow-hidden bg-zinc-950 sm:h-[min(92dvh,860px)] sm:rounded-[2rem]">
        {story.contentType === "image" && story.mediaUrl ? (
          <img
            src={story.mediaUrl}
            alt={story.title || "استوری مکا"}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : story.contentType === "video" && story.mediaUrl ? (
          <video
            key={story.mediaUrl}
            src={story.mediaUrl}
            autoPlay
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
            onEnded={next}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                story.background ||
                "linear-gradient(160deg,#064e3b,#0f172a 65%,#020617)",
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/5 to-black/80" />

        <div className="absolute inset-x-0 top-0 z-20 px-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex gap-1">
            {stories.map((item, itemIndex) => (
              <div
                key={String(item.id)}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
              >
                {itemIndex < index ? (
                  <div className="h-full w-full bg-white" />
                ) : itemIndex === index ? (
                  <motion.div
                    key={String(story.id)}
                    className="h-full origin-right bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: Math.max(3, story.durationSec),
                      ease: "linear",
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-white">
            <Link
              to={"/consultants/" + story.advisor.slug}
              onClick={onClose}
              className="flex min-w-0 items-center gap-2.5"
            >
              {story.advisor.profileImageUrl ? (
                <img
                  src={story.advisor.profileImageUrl}
                  alt={story.advisor.displayName}
                  className="size-10 rounded-full border-2 border-white/80 object-cover"
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full border-2 border-white/70 bg-white/15 text-sm font-black">
                  {story.advisor.displayName.slice(0, 1)}
                </span>
              )}
              <span className="min-w-0">
                <strong className="block truncate text-sm">
                  {story.advisor.displayName}
                </strong>
                <span className="block truncate text-[10px] text-white/70">
                  {story.advisor.headline}
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full bg-black/25 backdrop-blur"
              aria-label="بستن استوری"
            >
              <X className="size-6" />
            </button>
          </div>
        </div>

        <button
          type="button"
          className="absolute inset-y-24 start-0 z-10 w-[34%]"
          onClick={next}
          aria-label="استوری بعدی"
        />
        <button
          type="button"
          className="absolute inset-y-24 end-0 z-10 w-[34%]"
          onClick={previous}
          aria-label="استوری قبلی"
        />

        {index > 0 && (
          <button
            type="button"
            onClick={previous}
            className="absolute end-3 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
            aria-label="قبلی"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
        {index < stories.length - 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute start-3 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
            aria-label="بعدی"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        <div className="absolute inset-x-0 bottom-0 z-20 p-5 pb-[max(24px,env(safe-area-inset-bottom))] text-white">
          {story.stickerText && (
            <span className="mb-3 inline-flex rotate-[-2deg] rounded-2xl bg-white/90 px-3 py-2 text-sm font-black text-emerald-900 shadow-lg">
              {story.stickerText}
            </span>
          )}
          {story.title && (
            <h2 className="max-w-[92%] text-3xl font-black leading-[1.35] sm:text-4xl">
              {story.title}
            </h2>
          )}
          {story.body && (
            <p className="mt-3 max-w-[92%] whitespace-pre-line text-sm leading-7 text-white/85">
              {story.body}
            </p>
          )}
          {story.linkUrl && (
            <div className="mt-5">
              <StoryLink href={story.linkUrl} label={story.linkLabel} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function PublicStoryStrip({
  advisorUserId,
  className = "",
}: {
  advisorUserId?: string;
  className?: string;
}) {
  const rows = useQuery(api.stories.listActivePublic, {
    advisorUserId,
  }) as Story[] | undefined;
  const [open, setOpen] = useState<{
    stories: Story[];
    index: number;
  } | null>(null);

  const groups = useMemo(() => {
    const list = rows ?? [];
    const map = new Map<string, Story[]>();
    for (const story of list) {
      const current = map.get(story.ownerUserId) ?? [];
      current.push(story);
      map.set(story.ownerUserId, current);
    }
    return Array.from(map.values());
  }, [rows]);

  if (!rows || rows.length === 0) return null;

  return (
    <>
      <section
        dir="rtl"
        className={
          "border-b border-border/50 bg-background/95 " + className
        }
      >
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
            {advisorUserId
              ? rows.map((story, storyIndex) => (
                  <button
                    key={String(story.id)}
                    type="button"
                    onClick={() =>
                      setOpen({ stories: rows, index: storyIndex })
                    }
                    className="w-[76px] shrink-0 text-center"
                  >
                    <span className="mx-auto block rounded-full bg-gradient-to-tr from-primary via-emerald-400 to-amber-400 p-[2px]">
                      <span className="flex size-[66px] items-center justify-center overflow-hidden rounded-full border-2 border-background bg-muted">
                        {story.contentType === "image" && story.mediaUrl ? (
                          <img
                            src={story.mediaUrl}
                            alt={story.title || story.advisor.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : story.advisor.profileImageUrl ? (
                          <img
                            src={story.advisor.profileImageUrl}
                            alt={story.advisor.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-black text-primary">
                            {story.advisor.displayName.slice(0, 1)}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="mt-1.5 block truncate text-[10px] font-extrabold">
                      {story.title || "استوری جدید"}
                    </span>
                  </button>
                ))
              : groups.map((stories) => {
                  const first = stories[0];
                  return (
                    <button
                      key={first.ownerUserId}
                      type="button"
                      onClick={() => setOpen({ stories, index: 0 })}
                      className="w-[76px] shrink-0 text-center"
                    >
                      <span className="mx-auto block rounded-full bg-gradient-to-tr from-primary via-emerald-400 to-amber-400 p-[2px]">
                        <span className="flex size-[66px] items-center justify-center overflow-hidden rounded-full border-2 border-background bg-muted">
                          {first.advisor.profileImageUrl ? (
                            <img
                              src={first.advisor.profileImageUrl}
                              alt={first.advisor.displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-black text-primary">
                              {first.advisor.displayName.slice(0, 1)}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="mt-1.5 block truncate text-[10px] font-extrabold">
                        {first.advisor.displayName}
                      </span>
                    </button>
                  );
                })}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {open && (
          <StoryViewer
            stories={open.stories}
            initialIndex={open.index}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
