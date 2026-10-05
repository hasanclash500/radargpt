import { Button } from "@/components/ui/button";
import ListingImageManager from "@/components/listings/ListingImageManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Listing } from "@/lib/parser";
import { CheckCircle2, ExternalLink, Globe2, Loader2, RefreshCw, Search, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type PublicSettings = {
  isPublic: boolean;
  featuredOnHome: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  noIndex: boolean;
};

export default function PublicListingDialog({
  listing,
  onSave,
}: {
  listing: Listing;
  onSave: (settings: PublicSettings) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [featuredOnHome, setFeaturedOnHome] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [noIndex, setNoIndex] = useState(false);
  const [saving, setSaving] = useState(false);

  const autoTitle = useMemo(() => {
    const deal = listing.dealType || "معامله";
    const property = listing.propertyType || "ملک";
    const area = listing.area ? ` ${listing.area} متری` : "";
    const city = listing.city || "غرب تهران";
    return `${deal} ${property}${area} در ${city} | دیوساز`.slice(0, 65);
  }, [listing]);

  const autoDescription = useMemo(() => {
    const deal = listing.dealType || "معامله";
    const property = listing.propertyType || "ملک";
    const city = listing.city || "غرب تهران";
    const area = listing.area ? ` با متراژ حدود ${listing.area} متر` : "";
    const priceBits = [
      listing.priceMillion != null && listing.priceMillion > 0
        ? `قیمت ${listing.priceMillion.toLocaleString("fa-IR")} میلیون تومان`
        : "",
      listing.depositMillion != null && listing.depositMillion > 0
        ? `ودیعه ${listing.depositMillion.toLocaleString("fa-IR")} میلیون تومان`
        : "",
      listing.rentMillion != null && listing.rentMillion > 0
        ? `اجاره ${listing.rentMillion.toLocaleString("fa-IR")} میلیون تومان`
        : "",
    ].filter(Boolean);
    const detail = (listing.description || "").replace(/\s+/g, " ").trim();
    const natural = `این ${property}${area} در ${city} برای ${deal} ارائه شده است${priceBits.length ? ` و شرایط مالی آن شامل ${priceBits.join(" و ")} است` : ""}. ${detail}`;
    return natural.replace(/\s+/g, " ").trim().slice(0, 160);
  }, [listing]);

  const autoKeywords = useMemo(() => {
    const values = [
      listing.dealType && `${listing.dealType} ${listing.propertyType || "ملک"}`,
      listing.city && `${listing.propertyType || "ملک"} در ${listing.city}`,
      listing.area && listing.propertyType
        ? `${listing.propertyType} ${listing.area} متری`
        : "",
      "املاک صنعتی و اداری",
      "دیوساز",
    ].filter(Boolean);
    return Array.from(new Set(values)).join("، ");
  }, [listing]);

  useEffect(() => {
    if (!open) return;
    setIsPublic(Boolean(listing.isPublic || listing.publicationStatus === "pending"));
    setFeaturedOnHome(listing.featuredOnHome ?? false);
    setSeoTitle(listing.seoTitle?.trim() || autoTitle);
    setSeoDescription(listing.seoDescription?.trim() || autoDescription);
    setSeoKeywords(
      listing.seoKeywords?.length
        ? listing.seoKeywords.join("، ")
        : autoKeywords,
    );
    setNoIndex(listing.noIndex ?? false);
  }, [open, listing, autoTitle, autoDescription, autoKeywords]);

  const regenerateSeo = () => {
    setSeoTitle(autoTitle);
    setSeoDescription(autoDescription);
    setSeoKeywords(autoKeywords);
  };

  const finalTitle = seoTitle || autoTitle;
  const finalDescription = seoDescription || autoDescription;
  const checklist = [
    { label: "عنوان مشخص و شامل نوع ملک + شهر", ok: finalTitle.length >= 25 && finalTitle.length <= 65 },
    { label: "توضیحات متا کامل", ok: finalDescription.length >= 100 && finalDescription.length <= 165 },
    { label: "توضیحات خود آگهی حداقل ۱۵۰ کاراکتر", ok: listing.description.trim().length >= 150 },
    { label: "متراژ و نوع معامله مشخص است", ok: listing.area != null && listing.dealType !== "سایر" },
  ];

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        isPublic,
        featuredOnHome: isPublic ? featuredOnHome : false,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        seoKeywords: seoKeywords.split(/[،,]/).map((x) => x.trim()).filter(Boolean),
        noIndex,
      });
      toast.success(
        isPublic
          ? "درخواست/تنظیمات انتشار ذخیره شد"
          : "آگهی از حالت عمومی خارج شد",
      );
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره تنظیمات انتشار ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={listing.isPublic ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5 text-xs"
        >
          <Globe2 className="size-3.5" />
          {listing.publicationStatus === "pending"
            ? "در انتظار تأیید"
            : listing.isPublic
              ? "عمومی"
              : "انتشار"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>انتشار عمومی و SEO آگهی</DialogTitle>
          <DialogDescription>
            در نسخه عمومی فقط شهر، مشخصات ملک و توضیحات کامل نمایش داده می‌شود.
            شماره مالک، یادداشت داخلی، محله، آدرس دقیق، لینک دیوار و نقشه منتشر نمی‌شوند.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
              <div>
                <p className="text-sm font-extrabold">انتشار عمومی</p>
                <p className="mt-1 text-[11px] text-muted-foreground">ساخت صفحه اختصاصی برای این ملک</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-extrabold">
                  <Star className="size-4 text-gold" />
                  صفحه اصلی
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">در بخش آگهی‌های منتخب لندینگ</p>
              </div>
              <Switch
                checked={featuredOnHome}
                onCheckedChange={setFeaturedOnHome}
                disabled={!isPublic}
              />
            </div>
          </div>

          <ListingImageManager listing={listing} />

          <div className="space-y-4 rounded-2xl border border-border/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-primary" />
                <h3 className="text-sm font-extrabold">تنظیمات SEO</h3>
              </div>
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={regenerateSeo}>
                <RefreshCw className="size-3.5" />
                بازنویسی خودکار
              </Button>
            </div>
            <p className="text-[11px] leading-6 text-muted-foreground">
              فیلدهای خالی بر اساس مشخصات همین آگهی با متن طبیعی پر می‌شوند و قبل از انتشار کاملاً قابل ویرایش هستند.
            </p>

            <div className="space-y-2">
              <Label>SEO Title</Label>
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={autoTitle}
              />
              <p className="text-[10px] text-muted-foreground">{finalTitle.length}/65 کاراکتر</p>
            </div>

            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder={autoDescription}
                className="min-h-24 leading-7"
              />
              <p className="text-[10px] text-muted-foreground">{finalDescription.length}/160 کاراکتر</p>
            </div>

            <div className="space-y-2">
              <Label>کلمات کلیدی مرتبط</Label>
              <Input
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="اجاره سوله شهریار، ملک صنعتی، سوله ۵۰۰ متری"
              />
              <p className="text-[10px] text-muted-foreground">با ویرگول جدا کنید؛ برای دسته‌بندی معنایی، نه تکرار مصنوعی کلمات.</p>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
              <div>
                <p className="text-xs font-bold">Noindex</p>
                <p className="mt-1 text-[10px] text-muted-foreground">صفحه عمومی باشد ولی از موتور جست‌وجو درخواست ایندکس نشود.</p>
              </div>
              <Switch checked={noIndex} onCheckedChange={setNoIndex} />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background p-4">
            <p dir="ltr" className="truncate text-[10px] text-emerald-700 dark:text-emerald-400">
              radargpt.vercel.app › listings › {listing.publicSlug || "property-slug"}
            </p>
            <p className="mt-1 text-lg font-medium leading-7 text-blue-700 dark:text-blue-400">
              {finalTitle}
            </p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">{finalDescription}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-start gap-2 rounded-xl border border-border/60 p-3 text-xs">
                <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${item.ok ? "text-emerald-500" : "text-muted-foreground/35"}`} />
                <span className={item.ok ? "" : "text-muted-foreground"}>{item.label}</span>
              </div>
            ))}
          </div>

          {listing.isPublic && listing.publicSlug ? (
            <Button variant="outline" asChild className="w-full gap-2">
              <Link to={`/listings/${listing.publicSlug}`} target="_blank">
                <ExternalLink className="size-4" />
                مشاهده صفحه عمومی فعلی
              </Link>
            </Button>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            ذخیره تنظیمات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
