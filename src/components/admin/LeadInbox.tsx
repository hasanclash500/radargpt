import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Inbox, PhoneCall } from "lucide-react";
import { toast } from "sonner";

const INTENTS: Record<string, string> = {
  buy: "می‌خرم",
  rent: "اجاره می‌کنم",
  sell: "می‌فروشم",
  lease_out: "اجاره می‌دهم",
};

export default function LeadInbox() {
  const leads = useQuery(api.leads.listLeads, {});
  const setStatus = useMutation(api.leads.setLeadStatus);

  if (!leads) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Inbox className="size-5" />
          درخواست‌های مشتریان
        </CardTitle>
        <CardDescription>
          فرم‌های «می‌خرم، اجاره می‌کنم، می‌فروشم، اجاره می‌دهم» از لندینگ در این بخش ذخیره می‌شوند.
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
  );
}
