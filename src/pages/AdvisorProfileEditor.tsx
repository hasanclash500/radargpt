import DashboardSectionNav from "@/components/dashboard/DashboardSectionNav";
import MekaBrand from "@/components/MekaBrand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { resizeImageFile } from "@/lib/image-resize";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  Camera,
  ExternalLink,
  Globe2,
  ImagePlus,
  Instagram,
  Loader2,
  MessageCircle,
  Save,
  Send,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const SPECIALTIES = [
  "سوله",
  "کارخانه",
  "کارگاه",
  "انبار",
  "زمین صنعتی",
  "دفتر اداری",
  "املاک تجاری",
  "سرمایه‌گذاری صنعتی",
];

type FormState = {
  slug: string;
  publicProfile: boolean;
  displayName: string;
  headline: string;
  bio: string;
  city: string;
  region: string;
  publicPhone: string;
  whatsapp: string;
  instagram: string;
  telegram: string;
  website: string;
  specialties: string[];
  profileImageStorageId?: any;
  coverImageStorageId?: any;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  successfulDeals: string;
  activeRequests: string;
};

const EMPTY: FormState = {
  slug: "",
  publicProfile: true,
  displayName: "",
  headline: "مشاور املاک صنعتی و اداری",
  bio: "",
  city: "شهریار",
  region: "غرب تهران",
  publicPhone: "",
  whatsapp: "",
  instagram: "",
  telegram: "",
  website: "",
  specialties: ["سوله", "کارخانه", "انبار", "دفتر اداری"],
  successfulDeals: "0",
  activeRequests: "0",
};

export default function AdvisorProfileEditor() {
  const profile = useQuery(api.advisors.getMyProfile, {});
  const saveProfile = useMutation(api.advisors.saveMyProfile);
  const generateUploadUrl = useMutation(api.advisors.generateProfileUploadUrl);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"profile" | "cover" | "">("");
  const profileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile?.allowed) return;
    if (!profile.exists) {
      setForm((current) => ({
        ...current,
        displayName: profile.displayName || current.displayName,
        publicPhone: profile.publicPhone || current.publicPhone,
        whatsapp: profile.publicPhone || current.whatsapp,
      }));
      return;
    }
    setForm({
      slug: profile.slug || "",
      publicProfile: Boolean(profile.publicProfile),
      displayName: profile.displayName || "",
      headline: profile.headline || "",
      bio: profile.bio || "",
      city: profile.city || "",
      region: profile.region || "",
      publicPhone: profile.publicPhone || "",
      whatsapp: profile.whatsapp || "",
      instagram: profile.instagram || "",
      telegram: profile.telegram || "",
      website: profile.website || "",
      specialties: profile.specialties || [],
      profileImageStorageId: (profile as any).profileImageStorageId,
      coverImageStorageId: (profile as any).coverImageStorageId,
      profileImageUrl: profile.profileImageUrl,
      coverImageUrl: profile.coverImageUrl,
      successfulDeals: String(profile.successfulDeals ?? 0),
      activeRequests: String(profile.activeRequests ?? 0),
    });
  }, [profile]);

  if (profile === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.allowed) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-6 text-center">
          <UserRound className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-black">پروفایل مشاور برای این حساب فعال نیست</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            این بخش فقط برای مدیر و مشاوران دیوساز نمایش داده می‌شود.
          </p>
          <Button asChild className="mt-5">
            <Link to="/dashboard">بازگشت به داشبورد</Link>
          </Button>
        </div>
      </main>
    );
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadImage = async (file: File, kind: "profile" | "cover") => {
    if (!file.type.startsWith("image/")) {
      toast.error("فایل انتخاب‌شده تصویر نیست.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("حجم تصویر باید کمتر از ۲۰ مگابایت باشد.");
      return;
    }

    setUploading(kind);
    try {
      const resized = await resizeImageFile(file, {
        maxWidth: kind === "profile" ? 1000 : 1800,
        maxHeight: kind === "profile" ? 1000 : 900,
        quality: 0.86,
      });
      const url = await generateUploadUrl();
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": resized.type || "application/octet-stream" },
        body: resized,
      });
      if (!response.ok) throw new Error("آپلود تصویر ناموفق بود.");
      const payload = await response.json();
      const localUrl = URL.createObjectURL(resized);
      if (kind === "profile") {
        setForm((current) => ({
          ...current,
          profileImageStorageId: payload.storageId,
          profileImageUrl: localUrl,
        }));
      } else {
        setForm((current) => ({
          ...current,
          coverImageStorageId: payload.storageId,
          coverImageUrl: localUrl,
        }));
      }
      toast.success("تصویر آماده ذخیره است");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "آپلود تصویر ناموفق بود");
    } finally {
      setUploading("");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const id = await saveProfile({
        slug: form.slug,
        publicProfile: form.publicProfile,
        displayName: form.displayName,
        headline: form.headline,
        bio: form.bio,
        city: form.city,
        region: form.region,
        publicPhone: form.publicPhone,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        telegram: form.telegram,
        website: form.website,
        specialties: form.specialties,
        profileImageStorageId: form.profileImageStorageId,
        coverImageStorageId: form.coverImageStorageId,
        successfulDeals: Number(form.successfulDeals) || 0,
        activeRequests: Number(form.activeRequests) || 0,
      });
      toast.success("پروفایل مشاور ذخیره شد");
      if (!form.slug && id) {
        // query refresh will fill the generated slug
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره پروفایل ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-muted/30">
      <header className="glass border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
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

      <section className="mx-auto max-w-5xl space-y-4 px-3 py-5 sm:px-6 sm:py-8">
        <div className="rounded-[2rem] border border-primary/20 bg-primary/[0.04] p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-black sm:text-2xl">پروفایل عمومی مشاور</h1>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                بیوگرافی، عکس، راه‌های تماس و تخصص‌های خود را مدیریت کنید.
              </p>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-sm">
          <div className="relative min-h-40 bg-gradient-to-l from-primary/10 via-background to-amber-50/50 dark:to-amber-950/10">
            {form.coverImageUrl && (
              <img
                src={form.coverImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-45"
              />
            )}
            <div className="relative flex items-end gap-4 p-5">
              {form.profileImageUrl ? (
                <img
                  src={form.profileImageUrl}
                  alt="تصویر پروفایل"
                  className="size-28 rounded-3xl border-4 border-background object-cover shadow-lg"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-3xl border-4 border-background bg-primary/10 text-primary shadow-lg">
                  <UserRound className="size-10" />
                </div>
              )}
              <div className="flex flex-wrap gap-2 pb-1">
                <input
                  ref={profileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(file, "profile");
                    e.target.value = "";
                  }}
                />
                <input
                  ref={coverInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(file, "cover");
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={Boolean(uploading)}
                  onClick={() => profileInput.current?.click()}
                >
                  {uploading === "profile" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                  عکس پروفایل
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={Boolean(uploading)}
                  onClick={() => coverInput.current?.click()}
                >
                  {uploading === "cover" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                  تصویر کاور
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>نام نمایشی *</Label>
              <Input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>آدرس پروفایل</Label>
              <Input
                dir="ltr"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="ali-mohammadi"
              />
              <p className="text-[10px] text-muted-foreground">
                بعد از ذخیره: /consultants/{form.slug || "..."}
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>عنوان تخصصی</Label>
              <Input
                value={form.headline}
                onChange={(e) => set("headline", e.target.value)}
                placeholder="مشاور املاک صنعتی و اداری"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>بیوگرافی</Label>
              <Textarea
                rows={7}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="تجربه، حوزه تخصص، مناطق فعالیت و شیوه هدیوسازری خود را معرفی کنید…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>شهر</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>محدوده فعالیت</Label>
              <Input value={form.region} onChange={(e) => set("region", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="font-black">راه‌های دسترسی</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Camera className="size-3.5" />تلفن عمومی</Label>
              <Input dir="ltr" value={form.publicPhone} onChange={(e) => set("publicPhone", e.target.value)} placeholder="0912..." />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><MessageCircle className="size-3.5" />واتساپ</Label>
              <Input dir="ltr" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="0912..." />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Instagram className="size-3.5" />اینستاگرام</Label>
              <Input dir="ltr" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="username" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Send className="size-3.5" />تلگرام</Label>
              <Input dir="ltr" value={form.telegram} onChange={(e) => set("telegram", e.target.value)} placeholder="username" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="flex items-center gap-1.5"><Globe2 className="size-3.5" />وب‌سایت</Label>
              <Input dir="ltr" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="font-black">تخصص‌ها و آمار پروفایل</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {SPECIALTIES.map((item) => {
              const active = form.specialties.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    set(
                      "specialties",
                      active
                        ? form.specialties.filter((value) => value !== item)
                        : [...form.specialties, item],
                    )
                  }
                  className={
                    "rounded-full border px-3 py-2 text-xs font-bold transition-colors " +
                    (active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background")
                  }
                >
                  {item}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>تعداد معاملات موفق</Label>
              <Input
                type="number"
                min={0}
                value={form.successfulDeals}
                onChange={(e) => set("successfulDeals", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>درخواست‌های فعال</Label>
              <Input
                type="number"
                min={0}
                value={form.activeRequests}
                onChange={(e) => set("activeRequests", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card p-5">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={form.publicProfile}
              onChange={(e) => set("publicProfile", e.target.checked)}
            />
            <span>
              <strong className="block text-sm">نمایش عمومی پروفایل</strong>
              <span className="mt-1 block text-[11px] leading-6 text-muted-foreground">
                اگر خاموش باشد، صفحه مشاور و استوری‌های او برای کاربران عمومی نمایش داده نمی‌شود.
              </span>
            </span>
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="gap-2"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              ذخیره پروفایل
            </Button>
            {form.slug && form.publicProfile && (
              <Button asChild variant="outline" className="gap-2">
                <a href={"/consultants/" + form.slug} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  مشاهده صفحه عمومی
                </a>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/dashboard/stories">مدیریت استوری‌ها</Link>
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}
