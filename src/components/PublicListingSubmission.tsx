import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, Loader2, Send, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function n(value: string) {
  const cleaned = value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،٬\s]/g, "");
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function PublicListingSubmission() {
  const settings = useQuery(api.folders.getSettings, {});
  const submit = useMutation(api.listings.submitPublicListing);
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState("");
  const [form, setForm] = useState({
    phone: "",
    city: "شهریار",
    propertyType: "",
    dealType: "فروش",
    area: "",
    price: "",
    deposit: "",
    rent: "",
    title: "",
    description: "",
    website: "",
  });

  const types = useMemo(
    () =>
      Array.from(
        new Set([
          "سوله",
          "کارخانه",
          "کارگاه",
          "انبار",
          "زمین صنعتی",
          "دفتر اداری",
          "واحد اداری",
          ...(settings?.customPropertyTypes ?? []),
        ]),
      ),
    [settings?.customPropertyTypes],
  );

  const deals = useMemo(
    () => Array.from(new Set(["فروش", "رهن و اجاره", ...(settings?.customDeals ?? [])])),
    [settings?.customDeals],
  );

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      const result = await submit({
        phone: form.phone,
        city: form.city,
        propertyType: form.propertyType,
        dealType: form.dealType,
        area: n(form.area),
        priceMillion: n(form.price),
        depositMillion: n(form.deposit),
        rentMillion: n(form.rent),
        title: form.title,
        description: form.description,
        website: form.website || undefined,
      });
      setTracking(result.trackingCode);
      toast.success("آگهی برای بررسی ارسال شد");
      setForm((current) => ({
        ...current,
        area: "",
        price: "",
        deposit: "",
        rent: "",
        title: "",
        description: "",
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ارسال آگهی ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="submit-listing" className="border-y border-border/60 bg-card/30 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-extrabold text-primary">
            <Smartphone className="size-4" />
            بدون نیاز به ساخت حساب
          </span>
          <h2 className="mt-4 text-2xl font-black sm:text-3xl">آگهی ملک خود را با شماره موبایل ثبت کنید</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            فرم را تکمیل کنید. آگهی ابتدا برای مدیر و ادمین مکا ارسال می‌شود و فقط پس از بررسی و تأیید در سایت نمایش داده خواهد شد.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-border/70 bg-background/80 p-4 shadow-sm sm:p-7">
          {tracking ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-5 text-center">
              <CheckCircle2 className="mx-auto size-9 text-emerald-600" />
              <p className="mt-3 font-extrabold">آگهی شما با موفقیت ثبت شد</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                پس از تأیید مدیر یا ادمین آگهی، در سایت منتشر می‌شود.
              </p>
              {tracking && (
                <p dir="ltr" className="mt-3 text-xs font-bold text-primary">Tracking: {tracking}</p>
              )}
              <Button type="button" variant="outline" className="mt-4" onClick={() => setTracking("")}>
                ثبت آگهی دیگر
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="شماره موبایل *">
                <Input dir="ltr" inputMode="tel" placeholder="0912..." value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="شهر *">
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="نوع ملک *">
                <select
                  value={form.propertyType}
                  onChange={(e) => set("propertyType", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">انتخاب کنید</option>
                  {types.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </Field>
              <Field label="نوع معامله *">
                <select
                  value={form.dealType}
                  onChange={(e) => set("dealType", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {deals.map((deal) => <option key={deal} value={deal}>{deal}</option>)}
                </select>
              </Field>
              <Field label="متراژ">
                <Input dir="ltr" inputMode="decimal" value={form.area} onChange={(e) => set("area", e.target.value)} />
              </Field>
              <Field label="قیمت کل (میلیون تومان)">
                <Input dir="ltr" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </Field>
              <Field label="ودیعه / رهن (میلیون تومان)">
                <Input dir="ltr" inputMode="decimal" value={form.deposit} onChange={(e) => set("deposit", e.target.value)} />
              </Field>
              <Field label="اجاره ماهانه (میلیون تومان)">
                <Input dir="ltr" inputMode="decimal" value={form.rent} onChange={(e) => set("rent", e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="عنوان آگهی *">
                  <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="مثلاً فروش سوله ۱۲۰۰ متری در شهریار" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="توضیحات *">
                  <Textarea rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="مشخصات ملک، امکانات، دسترسی و شرایط معامله را بنویسید." />
                </Field>
              </div>
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="hidden"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
              />
              <div className="sm:col-span-2">
                <Button type="button" className="h-12 w-full gap-2 text-base font-extrabold" disabled={saving} onClick={() => void save()}>
                  {saving ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                  ارسال آگهی برای تأیید
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
