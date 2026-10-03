import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { faNum, formatArea } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, Clock3, MapPin, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function PendingPublicationPanel() {
  const items = useQuery(api.listings.listPendingPublications, {});
  const approve = useMutation(api.listings.approvePublication);
  const reject = useMutation(api.listings.rejectPublication);

  if (!items || items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock3 className="size-5 text-amber-600 dark:text-amber-400" />
          <div>
            <h2 className="text-sm font-extrabold">در انتظار تأیید انتشار</h2>
            <p className="text-[11px] text-muted-foreground">
              {faNum(items.length)} آگهی برای بررسی مدیر
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-border/70 bg-background/80 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="size-3.5 text-primary" />
              {item.city} · {item.propertyType} · {item.dealType}
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-6">
              {item.title || item.propertyType + " در " + item.city}
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatArea(item.area)}
            </p>

            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 flex-1 gap-1 text-xs"
                onClick={async () => {
                  await approve({ key: item.id });
                  toast.success("آگهی تأیید و عمومی شد");
                }}
              >
                <CheckCircle2 className="size-3.5" />
                تأیید
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 flex-1 gap-1 border-destructive/30 text-xs text-destructive"
                onClick={async () => {
                  const reason =
                    window.prompt("دلیل رد یا اصلاح موردنیاز را بنویسید:", "نیاز به اصلاح دارد.") ??
                    undefined;
                  await reject({ key: item.id, reason });
                  toast.success("درخواست انتشار رد شد");
                }}
              >
                <XCircle className="size-3.5" />
                رد
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
