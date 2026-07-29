"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export type StudentAccessItem = {
  contentId: string;
  title: string;
  category: string;
  price: number;
  purchased: boolean;
  progress: number | null;
  conversationId: string | null;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function StudentAccessList({
  studentId,
  initialItems,
}: {
  studentId: string;
  initialItems: StudentAccessItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggle(item: StudentAccessItem) {
    setPendingId(item.contentId);
    const supabase = createClient();

    if (item.purchased) {
      await supabase
        .from("purchases")
        .delete()
        .eq("user_id", studentId)
        .eq("content_id", item.contentId);
    } else {
      await supabase
        .from("purchases")
        .insert({ user_id: studentId, content_id: item.contentId });
    }

    setPendingId(null);
    setItems((prev) =>
      prev.map((i) =>
        i.contentId === item.contentId
          ? { ...i, purchased: !i.purchased, progress: i.purchased ? null : 0 }
          : i
      )
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.contentId}
          className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-medium tracking-wide text-gold uppercase">
              {item.category}
            </span>
            <p className="mt-1 truncate text-sm text-foreground">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCurrency(item.price)}
              {item.purchased && item.progress !== null && ` · ${item.progress}% concluído`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {item.purchased && item.conversationId && (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/admin/comunidade/${item.conversationId}`} />}
                nativeButton={false}
              >
                <MessageCircle className="size-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              variant={item.purchased ? "outline" : "default"}
              className={!item.purchased ? "bg-rose text-rose-foreground hover:bg-rose/90" : ""}
              disabled={pendingId === item.contentId}
              onClick={() => toggle(item)}
            >
              {item.purchased ? "Remover acesso" : "Conceder acesso"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
