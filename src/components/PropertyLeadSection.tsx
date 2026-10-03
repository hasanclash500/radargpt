import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { PROPERTY_TYPES, toEnglishDigits } from "@/lib/parser";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  HandCoins,
  HomeIcon,
  KeyRound,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Intent = "buy" | "rent" | "sell" | "lease_out";

const INTENTS: Array<{
  id: Intent;
  title: string;
  text: string;
  icon: typeof ShoppingBag;
}> = [
  {
    id: "buy",
    title: "می‌خرم",
    text: "ملک صنعتی یا اداری مدنظرت را ثبت کن تا فایل مناسب پیدا کنیم.",
    icon: ShoppingBag,
  },
  {
    id: "rent",
    title: "اجاره می‌کنم",
    text: "نوع ملک، متراژ و بودجه اجاره را بفرست.",
    icon: KeyRound,
  },
  {
    id: "sell",
    title: "می‌فروشم",
    text: "ملک خودت را برای بررسی و معرفی به مشتریان مکا ثبت کن.",
    icon: HandCoins,
  },
  {
    id: "lease_out",
    title: "اجاره می‌دهم",
    text: "مشخصات ملک اجاره‌ای را ثبت کن تا با متقاضی مناسب تماس بگیریم.",
    icon: HomeIcon,
  },
];

export default function PropertyLeadSection() {
  const settings = useQuery(api.folders.getSettings, {});
  const createLead = useMutation(api.leads.createLead);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "شهریار",
    propertyType: PROPERTY_TYPES[0] as string,
    area: "",
    budget: "",
    details: "",
    website: "",
  });

  const propertyTypes = useMemo(
    () =>
      Array.from(
        new Set([
          ...PROPERTY_TYPES,
          ...(settings?.customPropertyTypes ?? []),
          ...((settings?.listingFieldConfigs ?? []) as any[]).flatMap(
            (config) => config.propertyTypes ?? [],
          ),
        ]),
      ),
    [settings],
  );

  const current = INTENTS.find((item) => item.id === intent);

  const submit = async () => {
    if (!intent) return;
    if (form.name.trim().length < 2) {
      toast.error("نام را کامل وارد کنید");
      return;
    }
    if (!/^09\d{9}$/.test(toEnglishDigits(form.phone).replace(/\D/g, ""))) {
      toast.error("شماره تماس معتبر وارد کنید");
      return;
    }

    setSaving(true);
    try {
      await createLead({
        intent,
        name: form.name.trim(),
        phone: form.phone,
        city: form.city.trim(),
        propertyType: form.propertyType,
        area: form.area ? Number(form.area) : undefined,
        budget: form.budget.trim() || undefined,
        details: form.details.trim() || undefined,
        website: form.website,
      });
      toast.success("درخواست شما ثبت شد", {
        description: "کارشناس مکا برای بررسی جزئیات با شما تماس می‌گیرد.",
      });
      setIntent(null);
      setForm({
        name: "",
        phone: "",
        city: "شهریار",
        propertyType: PROPERTY_TYPES[0] as string,
        area: "",
        budget: "",
        details: "",
        website: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت درخواست ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="property-leads" className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-7">
        <span className="text-xs font-extrabold text-primary">درخواست مستقیم</span>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          دنبال ملک هستی یا می‌خواهی ملکت را معرفی کنی؟
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          نوع درخواست را انتخاب کن؛ اطلاعات مستقیماً برای تیم مکا ارسال می‌شود.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {INTENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIntent(item.id)}
            className="group rounded-[1.6rem] border border-border/70 bg-card/70 p-5 text-right transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
              <item.icon className="size-5" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold">{item.title}</h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.text}</p>
          </button>
        ))}
      </div>

      <Dialog open={intent !== null} onOpenChange={(open) => !open && setIntent(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              {current?.title}
            </DialogTitle>
            <DialogDescription>
              اطلاعات کوتاه را ثبت کن؛ برای هماهنگی و جزئیات بیشتر با شما تماس می‌گیریم.
            </DialogDescription>
          </DialogHeader>

          <input
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی">
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="نام شما"
              />
            </Field>
            <Field label="شماره تماس">
              <Input
                dir="ltr"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0912..."
              />
            </Field>
            <Field label="شهر">
              <Input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </Field>
            <Field label="نوع ملک">
              <Select
                value={form.propertyType}
                onValueChange={(value) => setForm((f) => ({ ...f, propertyType: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="متراژ حدودی">
              <Input
                type="number"
                inputMode="numeric"
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                placeholder="مثلاً 500"
              />
            </Field>
            <Field label={intent === "buy" || intent === "rent" ? "بودجه / شرایط مالی" : "قیمت / شرایط مدنظر"}>
              <Input
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                placeholder="مثلاً تا ۵ میلیارد"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="توضیحات">
                <Textarea
                  rows={4}
                  value={form.details}
                  onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                  placeholder="نیاز یا مشخصات ملک را کوتاه و دقیق بنویسید…"
                />
              </Field>
            </div>
          </div>

          <Button onClick={() => void submit()} disabled={saving} className="mt-2 w-full">
            {saving && <Loader2 className="size-4 animate-spin" />}
            ثبت و ارسال درخواست
          </Button>
        </DialogContent>
      </Dialog>
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
