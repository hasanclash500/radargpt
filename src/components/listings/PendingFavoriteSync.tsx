import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { PENDING_FAVORITE_KEY } from "./FavoriteButton";

export default function PendingFavoriteSync() {
  const { isAuthenticated, isLoading } = useAuth();
  const setFavorite = useMutation(api.listings.setFavorite);
  const processingRef = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || processingRef.current) return;

    let slug = "";
    try {
      slug = sessionStorage.getItem(PENDING_FAVORITE_KEY) || "";
    } catch {
      return;
    }
    if (!slug) return;

    processingRef.current = true;
    try {
      sessionStorage.removeItem(PENDING_FAVORITE_KEY);
    } catch {
      // ادامه بده.
    }

    void setFavorite({ slug, favorite: true })
      .then(() => {
        toast.success("آگهی به ذخیره‌شده‌های شما اضافه شد");
      })
      .catch(() => {
        try {
          sessionStorage.setItem(PENDING_FAVORITE_KEY, slug);
        } catch {
          // ignore
        }
        toast.error("ذخیره آگهی بعد از ورود انجام نشد");
      })
      .finally(() => {
        processingRef.current = false;
      });
  }, [isAuthenticated, isLoading, setFavorite]);

  return null;
}
