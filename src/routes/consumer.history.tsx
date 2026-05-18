import { createFileRoute, Link } from "@tanstack/react-router";
import { useOrderStore } from "@/stores/useOrderStore";
import { mockServices } from "@/data/mockServices";
import { mockWorkers } from "@/data/mockWorkers";
import { ORDER_STATUS_LABEL } from "@/data/mockOrders";
import { formatIDR, formatRelative } from "@/lib/formatCurrency";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/consumer/history")({
  head: () => ({ meta: [{ title: "Riwayat · KerjaDekat" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const orders = useOrderStore((s) => s.orders);

  return (
    <main className="px-5 pt-6">
      <h1 className="display-md">Riwayat order</h1>
      <p className="text-body mt-1">Semua pesanan kamu, dari yang terbaru.</p>

      <div className="mt-6 space-y-3">
        {orders.map((o) => {
          const svc = mockServices.find((s) => s.id === o.serviceId);
          const w = mockWorkers.find((m) => m.id === o.workerId);
          const isLive = o.status !== "completed" && o.status !== "cancelled";
          return (
            <Link
              key={o.id}
              to="/consumer/order/$id"
              params={{ id: o.id }}
              className="card-content flex items-center gap-3"
            >
              <div className="text-3xl">{svc?.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-black">{svc?.name}</div>
                <div className="text-xs text-body">
                  {w?.name} · {formatRelative(o.createdAt)}
                </div>
                <span
                  className={`mt-2 inline-block ${
                    isLive ? "badge-positive" : o.status === "completed" ? "badge-neutral" : "badge-negative"
                  }`}
                >
                  {ORDER_STATUS_LABEL[o.status]}
                </span>
              </div>
              <div className="text-right">
                <div className="font-display font-black text-sm">{formatIDR(o.estimatedPrice)}</div>
                <ChevronRight size={16} className="ml-auto mt-1 text-mute" />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
