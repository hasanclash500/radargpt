import { ChevronDown, ChevronUp, GripHorizontal, MapPinned } from "lucide-react";
import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";

type DragState = { pointerId: number; startY: number; startHeight: number; moved: boolean };

/**
 * In-page, curtain-style map. The handle belongs to the page flow, not to a
 * full-screen overlay, so scrolling the listings below remains possible.
 */
export default function ResizableMapPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const maximum = () =>
    typeof window === "undefined" ? 680 : Math.max(260, Math.round(window.innerHeight * 0.76));
  const initial = () =>
    typeof window === "undefined"
      ? 440
      : Math.min(maximum(), window.innerWidth < 640 ? 320 : 480);

  const [height, setHeight] = useState(initial);
  const [collapsed, setCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastOpenHeight = useRef(height);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const adjust = () => setHeight((value) => Math.min(value, maximum()));
    window.addEventListener("resize", adjust);
    return () => window.removeEventListener("resize", adjust);
  }, []);

  const toggle = () => {
    if (collapsed) {
      setHeight(Math.min(Math.max(200, lastOpenHeight.current), maximum()));
      setCollapsed(false);
    } else {
      lastOpenHeight.current = height;
      setCollapsed(true);
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: collapsed ? 0 : height,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) < 6 && !drag.moved) return;
    drag.moved = true;
    setIsDragging(true);
    if (collapsed && delta > 12) setCollapsed(false);
    const newHeight = Math.max(0, Math.min(maximum(), drag.startHeight + delta));
    setHeight(newHeight);
  };

  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
    if (!drag.moved) return;
    suppressClickRef.current = true;
    const proposedHeight = Math.max(0, Math.min(maximum(), drag.startHeight + event.clientY - drag.startY));
    if (proposedHeight < 160) {
      setCollapsed(true);
      setHeight(Math.max(200, lastOpenHeight.current));
    } else {
      setCollapsed(false);
      const finalHeight = Math.max(160, proposedHeight);
      setHeight(finalHeight);
      lastOpenHeight.current = finalHeight;
    }
  };

  return (
    <div className={"relative min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl sm:rounded-3xl " + className}>
      <div
        className={isDragging ? "overflow-hidden" : "overflow-hidden transition-[height] duration-200 ease-out"}
        style={{ height: collapsed ? 0 : height }}
        aria-hidden={collapsed}
      >
        <div className="h-full w-full">{children}</div>
      </div>
      <button
        type="button"
        aria-label={collapsed ? "باز کردن نقشه" : "تغییر اندازه نقشه؛ برای بستن به بالا بکشید"}
        aria-expanded={!collapsed}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          toggle();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (collapsed || height <= 220) {
              lastOpenHeight.current = height;
              setCollapsed(true);
            } else {
              setHeight((value) => Math.max(160, value - 60));
            }
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setCollapsed(false);
            setHeight((value) => Math.min(maximum(), Math.max(220, value + 60)));
          } else if (event.key === "Home") {
            event.preventDefault();
            setCollapsed(true);
          } else if (event.key === "End") {
            event.preventDefault();
            setCollapsed(false);
            setHeight(maximum());
          }
        }}
        className="relative z-10 flex min-h-12 w-full touch-none select-none items-center justify-center gap-2 border-t border-border/70 bg-background px-3 py-2 text-xs font-extrabold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <ChevronUp className={"size-4 transition-transform " + (collapsed ? "rotate-180" : "")} aria-hidden="true" />
        <GripHorizontal className="size-7 text-primary" aria-hidden="true" />
        <span>{collapsed ? "نمایش نقشه" : "برای کوچک‌کردن نقشه، نوار را بالا بکشید"}</span>
        {collapsed ? <MapPinned className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
