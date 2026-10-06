import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { Heart, Loader2 } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

export const PENDING_FAVORITE_KEY = "divsaz:pending-favorite";

export default function FavoriteButton({
  slug,
  className = "",
  showLabel = false,
  size = "icon",
  variant = "outline",
}: {
  slug: string;
  className?: string;
  showLabel?: boolean;
  size?: "icon" | "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost" | "secondary";
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const favoriteSlugs = useQuery(
    api.listings.myFavoriteSlugs,
    isAuthenticated ? {} : "skip",
  );
  const setFavorite = useMutation(api.listings.setFavorite);
  const [saving, setSaving] = useState(false);

  const saved = favoriteSlugs?.includes(slug) ?? false;

  const toggle = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (authLoading) return;

    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(PENDING_FAVORITE_KEY, slug);
      } catch {
        // اگر storage در دسترس نبود، باز هم ورود انجام می‌شود.
      }
      const returnTo = `${location.pathname}${location.search}`;
      navigate(
        `/auth?mode=signUp&reason=favorite&returnTo=${encodeURIComponent(returnTo)}`,
      );
      toast.info("برای ذخیره آگهی ابتدا وارد شوید یا حساب بسازید");
      return;
    }

    setSaving(true);
    try {
      const next = !saved;
      await setFavorite({ slug, favorite: next });
      toast.success(next ? "آگهی ذخیره شد" : "از ذخیره‌شده‌ها حذف شد");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تغییر ذخیره آگهی انجام نشد",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={saved ? "secondary" : variant}
      className={
        "gap-2 " +
        (saved ? "text-rose-600 hover:text-rose-700 " : "") +
        className
      }
      onClick={toggle}
      disabled={saving || authLoading}
      aria-label={saved ? "حذف از ذخیره‌شده‌ها" : "ذخیره آگهی"}
      title={saved ? "حذف از ذخیره‌شده‌ها" : "ذخیره آگهی"}
    >
      {saving ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Heart className={"size-4 " + (saved ? "fill-current" : "")} />
      )}
      {showLabel && (saved ? "ذخیره شده" : "ذخیره")}
    </Button>
  );
}
