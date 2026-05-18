import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { Order, OrderStatus } from "@/data/mockOrders";
import { ORDER_STATUS_LABEL } from "@/data/mockOrders";

const FLOW: OrderStatus[] = ["broadcasting", "matched", "enroute", "arrived", "in_progress", "awaiting_payment", "completed"];

export function OrderStatusTimeline({ order }: { order: Order }) {
  const currentIdx = FLOW.indexOf(order.status);

  return (
    <ol className="space-y-1">
      {FLOW.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s} className="flex items-start gap-3 py-2">
            <span className="mt-0.5">
              {done ? (
                <CheckCircle2 size={20} className="text-positive" />
              ) : active ? (
                <Loader2 size={20} className="text-ink animate-spin" />
              ) : (
                <Circle size={20} className="text-mute" />
              )}
            </span>
            <div>
              <div className={`font-semibold ${active ? "text-ink" : done ? "text-body" : "text-mute"}`}>
                {ORDER_STATUS_LABEL[s]}
              </div>
              {active && (
                <div className="text-xs text-mute mt-0.5">Sedang berlangsung…</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
