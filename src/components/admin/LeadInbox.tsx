import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Inbox, Loader2, PhoneCall, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const INTENTS: Record<string, string> = {
  buy: "می‌خرم",
  rent: "اجاره می‌کنم",
  sell: "می‌فروشم",
  lease_out: "اجاره می‌دهم",
};

type Intent = "buy" | "rent" | "sell" | "lease_out";

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

const EMPTY_FORM = {
  intent: "buy" as Intent,
  name: "",
  phone: "",
  city: "شهریار",
  propertyType: "",
  area: "",
  budget: "",
  details: "",
};

export default function LeadInbox() {
  const leads = useQuery(api.leads.listLeads, {});
  const createLead = useMutation(api.leads.createLead);
  const setStatus = useMutation(api.leads.setLeadStatus);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  if (!leads) return null;

  const submitLead = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await createLead({
        intent: form.intent,
        name: form.name,
        phone: form.phone,
        city: form.city,
        propertyType: form.propertyType,
        area: form.area.trim() ? Number(toEnglishDigits(form.area)) : undefined,
        budget: form.budget || undefined,
        details: form.details || undefined,
      });
      setForm(EMPTY_FORM);
      toast.success("متقاضی جدید ثبت شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت متقاضی انجام نشد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="size-5 text-primary" />
            ثبت متقاضی جدید
          </CardTitle>
          <CardDescription>
            مدیر، ادمین و مشاور می‌توانند درخواست مشتری را مستقیم از داشبورد ثبت کنند.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>نوع درخواست</Label>
              <select
                value={form.intent}
                onChange={(event) => setForm((current) => ({ ...current, intent: event.target.value as Intent }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="buy">می‌خرم</option>
                <option value="rent">اجاره می‌کنم</option>
                <option value="sell">می‌فروشم</option>
                <option value="lease_out">اجاره می‌دهم</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>نام متقاضی</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="نام و نام خانوادگی"
              />
            </div>
            <div className="space-y-1.5">
              <Label>شماره موبایل</Label>
              <Input
                dir="ltr"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="0912..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>شهر / محدوده</Label>
              <Input
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                placeholder="مثلاً شهریار"
              />
            </div>
            <div className="space-y-1.5">
              <Label>نوع ملک</Label>
              <Input
                value={form.propertyType}
                onChange={(event) => setForm((current) => ({ ...current, propertyType: event.target.value }))}
                placeholder="سوله، کارخانه، انبار، دفتر..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>متراژ تقریبی</Label>
              <Input
                dir="ltr"
                inputMode="numeric"
                value={form.area}
                onChange={(event) => setForm((current) => ({ ...current, area: event.target.value.replace(/[^0-9۰-۹]/g, "") }))}
                placeholder="مثلاً 1200"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label>بودجه / شرایط مالی</Label>
              <Input
                value={form.budget}
                onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))}
                placeholder="مثلاً تا ۲۰ میلیارد، یا ودیعه ۲ میلیارد و اجاره تا ۱۵۰ میلیون"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label>توضیحات و نیاز مشتری</Label>
              <Textarea
                rows={4}
                value={form.details}
                onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
                placeholder="شرایط دسترسی، برق، ارتفاع، موقعیت، زمان تحویل و هر نکته‌ای که برای مچ فایل لازم است..."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" className="gap-2" disabled={saving} onClick={() => void submitLead()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              ثبت متقاضی
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Inbox className="size-5" />
            درخواست‌های مشتریان
          </CardTitle>
          <CardDescription>
            درخواست‌های ثبت‌شده از سایت یا داشبورد در این بخش ذخیره می‌شوند.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {leads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">هنوز درخواستی ثبت نشده است.</p>
          ) : (
            leads.map((lead) => (
              <div key={lead._id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                      {INTENTS[lead.intent] || lead.intent}
                    </span>
                    <h3 className="mt-3 font-extrabold">{lead.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {lead.propertyType} · {lead.city}
                      {lead.area != null ? ` · حدود ${lead.area} متر` : ""}
                    </p>
                  </div>
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 font-mono text-xs text-primary"
                    dir="ltr"
                  >
                    <PhoneCall className="size-4" />
                    {lead.phone}
                  </a>
                </div>

                {lead.budget && <p className="mt-3 text-xs"><b>بودجه/شرایط:</b> {lead.budget}</p>}
                {lead.details && <p className="mt-2 whitespace-pre-line text-xs leading-6 text-muted-foreground">{lead.details}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={lead.status === "new" ? "default" : "outline"}
                    onClick={async () => {
                      await setStatus({ id: lead._id, status: "new" });
                      toast.success("وضعیت بروزرسانی شد");
                    }}
                  >
                    جدید
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={lead.status === "contacted" ? "default" : "outline"}
                    onClick={async () => {
                      await setStatus({ id: lead._id, status: "contacted" });
                      toast.success("وضعیت بروزرسانی شد");
                    }}
                  >
                    تماس گرفته شد
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={lead.status === "closed" ? "default" : "outline"}
                    onClick={async () => {
                      await setStatus({ id: lead._id, status: "closed" });
                      toast.success("وضعیت بروزرسانی شد");
                    }}
                  >
                    بسته شد
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
