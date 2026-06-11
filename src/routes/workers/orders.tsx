import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { useSessionStore } from "@/stores/useSessionStore";
import { getWorkerOrdersFn } from "@/lib/worker.server";
import { orderStatusLabel, skillEmoji } from "@/lib/orderLabels";
import { formatIDR, formatRelative } from "@/lib/formatCurrency";

export const Route = createFileRoute("/workers/orders")({
  head: () => ({ meta: [{ title: "Pesanan Saya · KerjaDekat" }] }),
  component: WorkerOrdersPage,
});

function WorkerOrdersPage() {
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");

  const { data, isLoading } = useQuery({
    queryKey: ["worker-orders", accessToken],
    queryFn: () => getWorkerOrdersFn({ data: { accessToken } }),
    enabled: authed && Boolean(accessToken),
    refetchInterval: 15_000,
  });

  const orders = data?.ok ? (data.data?.items ?? []) : [];
  const activeStatuses = ["pending_match", "offered", "accepted", "worker_departed", "in_progress"];
  const filtered = orders.filter((o) => {
    if (tab === "active") return activeStatuses.includes(o.Status);
    if (tab === "completed") return o.Status === "completed";
    return true;
  });

  return (
    <div className="min-h-screen bg-canvas-soft">
      <TopNav
        backTo="/workers"
        title="Pesanan Saya"
        right={
          <Link to="/workers" className="text-xs font-semibold text-mute">Dasbor</Link>
        }
      />

      <main className="max-w-md mx-auto px-5 pt-4 pb-20">
        <div className="inline-flex rounded-full border border-ink/10 bg-white p-1 text-xs font-semibold mb-4">
          {(["active", "completed", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                tab === t ? "bg-ink text-white" : "text-ink hover:bg-ink/5"
              }`}
            >
              {t === "active" ? "Aktif" : t === "completed" ? "Selesai" : "Semua"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-mute" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-content text-center py-12">
            <Clock className="h-10 w-10 mx-auto mb-3 text-mute" />
            <div className="font-display font-black">Belum ada pesanan</div>
            <p className="text-sm text-body mt-1">
              {tab === "active" ? "Tidak ada pesanan aktif." : "Belum ada riwayat pesanan."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const statusIcon = order.Status === "completed"
                ? <CheckCircle2 className="h-4 w-4 text-positive" />
                : activeStatuses.includes(order.Status)
                  ? <Clock className="h-4 w-4 text-warning" />
                  : <XCircle className="h-4 w-4 text-negative" />;

              return (
                <Link
                  key={order.ID}
                  to="/workers/orders/$id"
                  params={{ id: order.ID }}
                  className="card-content block hover:border-ink/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-primary-pale flex items-center justify-center text-xl">
                      {skillEmoji(order.Skill?.Name ?? "")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {order.Skill?.Name ?? "Jasa"}
                      </div>
                      <div className="text-xs text-mute mt-0.5">
                        {order.ConsumerAddress
                          ? order.ConsumerAddress.length > 30
                            ? order.ConsumerAddress.slice(0, 30) + "..."
                            : order.ConsumerAddress
                          : "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-black text-sm">
                        {order.AgreedRate != null ? formatIDR(order.AgreedRate) : "—"}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-xs text-mute mt-0.5">
                        {statusIcon}
                        {orderStatusLabel(order.Status)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
