import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { ORDER_STATUS_FLOW, orderStatusLabel } from "@/lib/orderLabels";

export function ApiOrderStatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-start gap-3 py-2 text-[#054d28]">
        <XCircle size={20} className="shrink-0" />
        <div className="font-semibold">Pesanan dibatalkan</div>
      </div>
    );
  }

  const currentIdx = ORDER_STATUS_FLOW.indexOf(status as (typeof ORDER_STATUS_FLOW)[number]);

  return (
    <ol className="space-y-1">
      {ORDER_STATUS_FLOW.map((s, i) => {
        const done = currentIdx >= 0 && i < currentIdx;
        const active = s === status;
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
                {orderStatusLabel(s)}
              </div>
              {active && <div className="text-xs text-mute mt-0.5">Sedang berlangsung…</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
