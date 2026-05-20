import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronRight, ClipboardList, Loader2 } from "lucide-react";
import { listConsumerOrdersFn } from "@/lib/consumer.server";
import { orderStatusLabel, skillEmoji } from "@/lib/orderLabels";
import { formatIDR, formatRelative } from "@/lib/formatCurrency";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/consumers/history")({
  head: () => ({ meta: [{ title: "Riwayat · KerjaDekat" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["consumer-orders", accessToken],
    queryFn: () => listConsumerOrdersFn({ data: { accessToken } }),
    enabled: authed && Boolean(accessToken),
    staleTime: 30_000,
  });

  const orders = data?.data.items ?? [];

  return (
    <main className="px-5 pt-6 pb-20">
      <h1 className="display-md">Riwayat order</h1>
      <p className="text-body mt-1">Semua pesanan kamu, dari yang terbaru.</p>

      {isError && (
        <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-4 py-3 text-sm text-[#054d28]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            Gagal memuat riwayat.{" "}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">
              Coba lagi
            </button>
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="animate-spin text-mute" size={32} />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-[24px] bg-[#ffffff] px-6 py-16 text-sm text-mute">
          <ClipboardList className="mb-3 h-10 w-10 opacity-30" />
          Belum ada pesanan. Mulai dari beranda untuk memesan jasa.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => {
            const isLive = o.Status !== "completed" && o.Status !== "cancelled";
            const skillName = o.Skill?.Name ?? "Jasa";
            const workerName = o.Worker?.FullName ?? "—";
            const price = o.AgreedRate ?? o.PlatformFee;
            return (
              <Link
                key={o.ID}
                to="/consumers/order/$id"
                params={{ id: o.ID }}
                className="rounded-[24px] bg-[#ffffff] p-6 flex items-center gap-3"
              >
                <div className="text-3xl">{skillEmoji(skillName)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black">{skillName}</div>
                  <div className="text-xs text-body">
                    {workerName} · {formatRelative(o.CreatedAt)}
                  </div>
                  <span
                    className={`mt-2 inline-block ${
                      isLive ? "badge-positive" : o.Status === "completed" ? "badge-neutral" : "badge-negative"
                    }`}
                  >
                    {orderStatusLabel(o.Status)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-display font-black text-sm">{formatIDR(price)}</div>
                  <ChevronRight size={16} className="ml-auto mt-1 text-mute" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
