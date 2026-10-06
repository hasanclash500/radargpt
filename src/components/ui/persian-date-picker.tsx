import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  JALALI_MONTHS,
  PERSIAN_WEEKDAYS,
  faNumber,
  formatJalaliDate,
  jalaliDateToTimestamp,
  jalaliMonthLength,
  jalaliToGregorian,
  normalizeJalaliDate,
  timestampToJalali,
  timestampToJalaliString,
  timestampToTehranTime,
  todayJalaliString,
  weekdayIndexSaturdayFirst,
} from "@/lib/jalali";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CalendarMonth = { year: number; month: number };

type PersianDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
};

type PersianDateTimePickerProps = {
  value?: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
};

function monthFromValue(value?: string): CalendarMonth {
  const normalized = value ? normalizeJalaliDate(value) : "";
  if (normalized) {
    const [year, month] = normalized.split("-").map(Number);
    return { year, month };
  }
  const today = timestampToJalali(new Date());
  return { year: today.year, month: today.month };
}

function shiftMonth(current: CalendarMonth, delta: number): CalendarMonth {
  let year = current.year;
  let month = current.month + delta;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return { year, month };
}

function cellDate(
  year: number,
  month: number,
  firstWeekday: number,
  index: number,
) {
  const dayOffset = index - firstWeekday + 1;
  if (dayOffset >= 1 && dayOffset <= jalaliMonthLength(year, month)) {
    return { year, month, day: dayOffset, current: true };
  }

  if (dayOffset < 1) {
    const prev = shiftMonth({ year, month }, -1);
    const length = jalaliMonthLength(prev.year, prev.month);
    return {
      year: prev.year,
      month: prev.month,
      day: length + dayOffset,
      current: false,
    };
  }

  const next = shiftMonth({ year, month }, 1);
  return {
    year: next.year,
    month: next.month,
    day: dayOffset - jalaliMonthLength(year, month),
    current: false,
  };
}

function dateString(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shortDate(value: string) {
  const normalized = normalizeJalaliDate(value);
  if (!normalized) return "";
  return faNumber(normalized.replace(/-/g, "/"));
}

function monthSecondaryLabels(year: number, month: number) {
  const midDay = Math.min(15, jalaliMonthLength(year, month));
  const g = jalaliToGregorian(year, month, midDay);
  const date = new Date(Date.UTC(g.gy, g.gm - 1, g.gd, 12));
  const gregorian = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  const hijri = new Intl.DateTimeFormat("fa-IR-u-ca-islamic", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return { gregorian, hijri };
}

function CalendarBody({
  selected,
  month,
  onMonthChange,
  onSelect,
}: {
  selected: string;
  month: CalendarMonth;
  onMonthChange: (month: CalendarMonth) => void;
  onSelect: (value: string) => void;
}) {
  const today = todayJalaliString();
  const firstWeekday = weekdayIndexSaturdayFirst(month.year, month.month, 1);
  const labels = useMemo(
    () => monthSecondaryLabels(month.year, month.month),
    [month.year, month.month],
  );

  return (
    <div dir="rtl">
      <div className="rounded-3xl border border-border/70 bg-muted/35 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-10 rounded-full"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            aria-label="ماه قبل"
          >
            <ChevronRight className="size-5" />
          </Button>

          <div className="min-w-0 text-center">
            <div className="text-xl font-black text-primary sm:text-2xl">
              {JALALI_MONTHS[month.month - 1]} {faNumber(month.year)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {labels.gregorian}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground/80">
              {labels.hijri}
            </div>
          </div>

          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-10 rounded-full"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            aria-label="ماه بعد"
          >
            <ChevronLeft className="size-5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 overflow-hidden rounded-2xl bg-primary text-primary-foreground">
        {PERSIAN_WEEKDAYS.map((label, index) => (
          <div
            key={label + index}
            className="flex h-11 items-center justify-center text-sm font-black"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-y-1">
        {Array.from({ length: 42 }, (_, index) => {
          const cell = cellDate(
            month.year,
            month.month,
            firstWeekday,
            index,
          );
          const value = dateString(cell.year, cell.month, cell.day);
          const active = value === selected;
          const isToday = value === today;
          const weekday = index % 7;
          const friday = weekday === 6;

          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className={
                "relative mx-auto flex size-11 items-center justify-center rounded-2xl text-sm font-black transition-all sm:size-12 " +
                (active
                  ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                  : isToday
                    ? "border-2 border-primary text-primary"
                    : cell.current
                      ? friday
                        ? "text-destructive hover:bg-destructive/5"
                        : "text-foreground hover:bg-muted"
                      : "text-muted-foreground/35 hover:bg-muted/50")
              }
              aria-label={formatJalaliDate(value, true)}
            >
              {faNumber(cell.day)}
              {isToday && !active ? (
                <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            const now = timestampToJalali(new Date());
            onMonthChange({ year: now.year, month: now.month });
            onSelect(today);
          }}
        >
          <RotateCcw className="size-3.5" />
          برو به امروز
        </Button>
        {selected ? (
          <span className="text-xs font-bold text-muted-foreground">
            {formatJalaliDate(selected)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function PersianDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ شمسی",
  disabled = false,
  className = "",
  allowClear = true,
}: PersianDatePickerProps) {
  const normalized = normalizeJalaliDate(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() =>
    monthFromValue(normalized),
  );

  useEffect(() => {
    if (open) setVisibleMonth(monthFromValue(normalized));
  }, [open, normalized]);

  return (
    <>
      <div className={"flex min-w-0 gap-1.5 " + className}>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-10 min-w-0 flex-1 justify-start gap-2 rounded-xl px-3 font-normal"
          onClick={() => setOpen(true)}
        >
          <CalendarDays className="size-4 shrink-0 text-primary" />
          <span className={normalized ? "truncate font-bold" : "truncate text-muted-foreground"}>
            {normalized ? shortDate(normalized) : placeholder}
          </span>
        </Button>
        {allowClear && normalized ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            onClick={() => onChange("")}
            aria-label="پاک کردن تاریخ"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          dir="rtl"
          className="max-h-[96dvh] w-[calc(100dvw-16px)] max-w-[calc(100dvw-16px)] overflow-x-hidden overflow-y-auto rounded-3xl p-4 sm:max-w-md sm:p-5"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              انتخاب تاریخ شمسی
            </DialogTitle>
            <DialogDescription className="text-right">
              تاریخ را از تقویم جلالی انتخاب کنید.
            </DialogDescription>
          </DialogHeader>

          <CalendarBody
            selected={normalized}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            onSelect={(next) => {
              onChange(next);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PersianDateTimePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ و ساعت",
  disabled = false,
  className = "",
  allowClear = true,
}: PersianDateTimePickerProps) {
  const currentDate = value ? timestampToJalaliString(value) : "";
  const currentTime = value ? timestampToTehranTime(value) : "09:00";
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(currentDate);
  const [draftTime, setDraftTime] = useState(currentTime);
  const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() =>
    monthFromValue(currentDate),
  );

  useEffect(() => {
    if (!open) return;
    setDraftDate(currentDate);
    setDraftTime(currentTime);
    setVisibleMonth(monthFromValue(currentDate));
  }, [open, currentDate, currentTime]);

  const commit = () => {
    if (!draftDate) {
      onChange(null);
      setOpen(false);
      return;
    }
    const timestamp = jalaliDateToTimestamp(draftDate, draftTime);
    if (timestamp != null) onChange(timestamp);
    setOpen(false);
  };

  return (
    <>
      <div className={"flex min-w-0 gap-1.5 " + className}>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-10 min-w-0 flex-1 justify-start gap-2 rounded-xl px-3 font-normal"
          onClick={() => setOpen(true)}
        >
          <CalendarDays className="size-4 shrink-0 text-primary" />
          <span className={value ? "truncate font-bold" : "truncate text-muted-foreground"}>
            {value
              ? `${formatJalaliDate(currentDate)} · ${faNumber(currentTime)}`
              : placeholder}
          </span>
        </Button>
        {allowClear && value ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            onClick={() => onChange(null)}
            aria-label="پاک کردن تاریخ"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          dir="rtl"
          className="max-h-[96dvh] w-[calc(100vw-16px)] max-w-md overflow-y-auto rounded-3xl p-4 sm:p-5"
        >
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              انتخاب تاریخ و ساعت
            </DialogTitle>
            <DialogDescription className="text-right">
              تاریخ شمسی و ساعت تهران را مشخص کنید.
            </DialogDescription>
          </DialogHeader>

          <CalendarBody
            selected={draftDate}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            onSelect={(next) => {
              setDraftDate(next);
              const [year, month] = next.split("-").map(Number);
              setVisibleMonth({ year, month });
            }}
          />

          <div className="mt-1 rounded-2xl border border-border/70 bg-muted/30 p-3">
            <label className="flex items-center gap-3">
              <Clock3 className="size-5 text-primary" />
              <span className="text-xs font-black">ساعت تهران</span>
              <Input
                type="time"
                dir="ltr"
                value={draftTime}
                onChange={(event) => setDraftTime(event.target.value)}
                className="ms-auto w-32"
              />
            </label>
          </div>

          <Button
            type="button"
            className="w-full rounded-xl"
            disabled={!draftDate}
            onClick={commit}
          >
            تأیید تاریخ و ساعت
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
