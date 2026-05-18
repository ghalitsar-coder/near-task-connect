import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { ORDER_STATUS_FLOW, orderStatusLabel } from "@/lib/orderLabels";
import type { ApiOrderStatusLog } from "@/lib/api/types";

type ApiOrderStatusTimelineProps = {
  status: string;
  logs?: ApiOrderStatusLog[];
};

function normalizeStatus(status: string): string {
  if (status === "worker_departed") return "in_progress";
  return status;
}

function resolveLatestStatus(status: string, logs?: ApiOrderStatusLog[]): string {
  if (logs && logs.length > 0) {
    return logs[logs.length - 1]?.ToStatus ?? status;
  }
  return status;
}

export function ApiOrderStatusTimeline({ status, logs }: ApiOrderStatusTimelineProps) {
  const latestStatus = resolveLatestStatus(status, logs);
  const normalizedStatus = normalizeStatus(latestStatus);
  const isFinal = normalizedStatus === "completed";
  const isCancelled =
    latestStatus === "cancelled" ||
    latestStatus === "expired" ||
    latestStatus.startsWith("cancelled_");

  if (isCancelled) {
    return (
      <div className="flex items-start gap-3 py-2 text-[#d03238]">
        <XCircle size={20} className="shrink-0" />
        <div className="font-semibold">{orderStatusLabel(latestStatus)}</div>
      </div>
    );
  }

  const currentIdx = ORDER_STATUS_FLOW.indexOf(
    normalizedStatus as (typeof ORDER_STATUS_FLOW)[number],
  );

  return (
    <ol className="space-y-1">
      {ORDER_STATUS_FLOW.map((s, i) => {
        const done = currentIdx >= 0 && (isFinal ? i <= currentIdx : i < currentIdx);
        const active = !isFinal && s === normalizedStatus;
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
