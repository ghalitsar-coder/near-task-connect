import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ArrowLeft, MapPin, AlertTriangle, CheckCircle2, Play, XCircle, Phone, MessageCircle, Star } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { useSessionStore } from "@/stores/useSessionStore";
import {
  getWorkerOrderFn,
  acceptWorkerOrderFn,
  startWorkerOrderFn,
  completeWorkerOrderFn,
  cancelWorkerOrderFn,
} from "@/lib/worker.server";
import { ApiOrderStatusTimeline } from "@/components/consumer/ApiOrderStatusTimeline";
import { orderStatusLabel, paymentStatusLabel, skillEmoji } from "@/lib/orderLabels";
import { formatIDR, formatRelative } from "@/lib/formatCurrency";

export const Route = createFileRoute("/workers/orders/$id")({
  head: () => ({ meta: [{ title: "Detail Pesanan · KerjaDekat" }] }),
  component: WorkerOrderDetailPage,
});

function WorkerOrderDetailPage() {
  const { id } = useParams({ from: "/workers/orders/$id" });
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);
  const queryClient = useQueryClient();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["worker-order", id, accessToken],
    queryFn: () => getWorkerOrderFn({ data: { accessToken, orderId: id } }),
    enabled: authed && Boolean(accessToken) && Boolean(id),
    refetchInterval: (q) => {
      const status = q.state.data?.data?.Status;
      if (status === "completed" || status?.startsWith("cancelled") || status === "expired") return false;
      return 10_000;
    },
    staleTime: 5_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["worker-order", id] });
    queryClient.invalidateQueries({ queryKey: ["worker-orders"] });
  };

  const acceptMutation = useMutation({
    mutationFn: () => acceptWorkerOrderFn({ data: { accessToken, orderId: id } }),
    onSuccess: (res) => { if (res.ok) invalidate(); },
  });

  const startMutation = useMutation({
    mutationFn: () => startWorkerOrderFn({ data: { accessToken, orderId: id } }),
    onSuccess: (res) => { if (res.ok) invalidate(); },
  });

  const completeMutation = useMutation({
    mutationFn: () => completeWorkerOrderFn({ data: { accessToken, orderId: id } }),
    onSuccess: (res) => { if (res.ok) invalidate(); },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => cancelWorkerOrderFn({ data: { accessToken, orderId: id, reason } }),
    onSuccess: (res) => { if (res.ok) { invalidate(); setShowCancel(false); } },
  });

  const order = data?.data;
  const status = order?.Status ?? "";
  const canAccept = status === "offered" || status === "pending_match";
  const canStart = status === "accepted";
  const canComplete = status === "in_progress" || status === "worker_departed";
  const canCancelAction = ["accepted", "offered", "pending_match"].includes(status);
  const isTerminal = ["completed", "expired"].includes(status) || status.startsWith("cancelled");
  const consumerName = order?.Consumer?.FullName ?? "Konsumen";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
        <Loader2 className="animate-spin text-mute" size={40} />
      </div>
    );
  }

  if (isError || !order || !data?.ok) {
    return (
      <div className="min-h-screen bg-canvas-soft">
        <TopNav backTo="/workers/orders" title="Detail Pesanan" />
        <div className="card-content max-w-md mx-auto mt-10 text-center">
          <AlertTriangle className="mx-auto mb-2 text-negative" />
          <p className="text-body">Pesanan tidak ditemukan.</p>
          <button type="button" onClick={() => refetch()} className="mt-3 font-semibold underline text-sm">Coba lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-soft">
      <TopNav
        backTo="/workers/orders"
        title="Detail Pesanan"
        right={
          <Link to="/workers" className="text-xs font-semibold text-mute">Dasbor</Link>
        }
      />

      <main className="max-w-md mx-auto px-5 pt-4 pb-20 space-y-4">
        {/* Status Header */}
        <div className="card-content">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold ${
              status === "completed" ? "bg-primary-pale text-positive-deep" :
              status.startsWith("cancelled") || status === "expired" ? "bg-negative-bg text-white" :
              "bg-warning/20 text-warning-content"
            }`}>
              {orderStatusLabel(status)}
            </span>
            <span className="text-xs text-mute">dibuat {formatRelative(order.CreatedAt)}</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="size-14 rounded-full bg-primary-pale flex items-center justify-center text-2xl">
              {skillEmoji(order.Skill?.Name ?? "")}
            </div>
            <div className="flex-1">
              <div className="font-display font-black">{order.Skill?.Name ?? "Jasa"}</div>
              <div className="text-xs text-body mt-0.5">
                Konsumen: <strong>{consumerName}</strong>
              </div>
              <div className="text-xs text-mute mt-1">{paymentStatusLabel(order.PaymentStatus)}</div>
            </div>
            {!isTerminal && (
              <div className="flex gap-2">
                <button type="button" aria-label="Telepon" className="size-10 rounded-full bg-canvas-soft flex items-center justify-center">
                  <Phone size={16} />
                </button>
                <button type="button" aria-label="Pesan" className="size-10 rounded-full bg-canvas-soft flex items-center justify-center">
                  <MessageCircle size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="card-content">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 text-mute" />
            <div className="flex-1">
              <div className="text-xs text-mute font-semibold uppercase tracking-wider">Lokasi Pesanan</div>
              <div className="font-semibold mt-1">{order.ConsumerAddress ?? "—"}</div>
            </div>
          </div>
          {order.Description && (
            <div className="border-t border-ink/10 mt-4 pt-4">
              <div className="text-xs text-mute font-semibold uppercase tracking-wider">Catatan</div>
              <p className="text-sm mt-1">{order.Description}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="card-content">
          <h2 className="font-display font-black text-lg mb-4">Riwayat Status</h2>
          <ApiOrderStatusTimeline status={status} logs={order.Logs} />
        </div>

        {/* Actions */}
        {!isTerminal && (
          <div className="card-content">
            <h2 className="font-display font-black text-lg mb-3">Aksi</h2>
            <div className="space-y-3">
              {canAccept && (
                <WiseButton
                  full
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending ? "Memproses..." : "Terima Pesanan"}
                </WiseButton>
              )}
              {canStart && (
                <WiseButton
                  full
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                >
                  {startMutation.isPending ? "Memproses..." : "Mulai Pekerjaan"}
                </WiseButton>
              )}
              {canComplete && (
                <WiseButton
                  full
                  onClick={() => {
                    if (confirm("Tandai pekerjaan selesai? Konsumen akan diminta konfirmasi.")) {
                      completeMutation.mutate();
                    }
                  }}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? "Memproses..." : "Selesaikan Pekerjaan"}
                </WiseButton>
              )}

              {canCancelAction && !showCancel && (
                <button
                  type="button"
                  onClick={() => setShowCancel(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-negative hover:bg-negative/10 rounded-xl transition-colors"
                >
                  <XCircle size={16} /> Batalkan Pesanan
                </button>
              )}

              {showCancel && (
                <div className="space-y-2 rounded-xl bg-canvas-soft p-4">
                  <div className="text-sm font-semibold">Alasan pembatalan</div>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Contoh: sedang sibuk, lokasi terlalu jauh..."
                    className="w-full h-11 rounded-xl border bg-white px-3 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCancel(false)}
                      className="flex-1 py-2 rounded-xl border text-sm font-semibold"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelMutation.mutate(cancelReason || "Dibatalkan pekerja")}
                      disabled={cancelMutation.isPending}
                      className="flex-1 py-2 rounded-xl bg-negative text-white text-sm font-semibold disabled:opacity-40"
                    >
                      {cancelMutation.isPending ? "..." : "Ya, Batalkan"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rate (for completed) */}
        {status === "completed" && (
          <div className="card-content">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-positive" />
              <div>
                <div className="font-display font-black">Pekerjaan Selesai</div>
                <p className="text-sm text-body">Terima kasih! Konsumen akan mengonfirmasi pembayaran.</p>
              </div>
            </div>
          </div>
        )}

        {/* Cost */}
        <div className="card-content text-sm">
          <h2 className="font-display font-black text-lg mb-3">Rincian Biaya</h2>
          <div className="flex justify-between py-1.5 border-b border-ink/5">
            <span className="text-body">Upah jasa</span>
            <span className="font-semibold">
              {order.AgreedRate != null ? formatIDR(order.AgreedRate) : "—"}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-body">Biaya admin</span>
            <span className="font-semibold">{formatIDR(order.PlatformFee)}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
