import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DiscoverChatIdButton({
  channel,
}: {
  channel: "telegram" | "bale";
}) {
  const discover = useAction(api.integrations.discoverChatId);
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loading}
      className="gap-1.5"
      onClick={async () => {
        setLoading(true);
        try {
          const result = await discover({ channel });
          toast.success("Chat ID پیدا و ذخیره شد", {
            description: result.chatId,
          });
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "پیدا کردن Chat ID ناموفق بود",
          );
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Search className="size-4" />
      )}
      پیدا کردن Chat ID
    </Button>
  );
}
