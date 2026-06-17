import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader2, ArrowLeft, MapPin, AlertTriangle, CheckCircle2, Play, XCircle, Phone, MessageCircle, Star, Navigation, Clock } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { useSessionStore } from "@/stores/useSessionStore";
import {
  getWorkerOrderFn,
  acceptWorkerOrderFn,
  startWorkerOrderFn,
  completeWorkerOrderFn,
  cancelWorkerOrderFn,
  rejectWorkerOrderFn,
} from "@/lib/worker.server";
import { ApiOrderStatusTimeline } from "@/components/consumer/ApiOrderStatusTimeline";
import { orderStatusLabel, paymentStatusLabel, skillEmoji } from "@/lib/orderLabels";
import { formatIDR, formatRelative } from "@/lib/formatCurrency";
import { Map, MapMarker, MarkerContent, MarkerLabel } from "@/components/ui/map";

export const Route = createFileRoute("/workers/orders/$id")({
  head: () => ({ meta: [{ title: "Detail Pesanan · KerjaDekat" }] }),
  component: WorkerOrderDetailPage,
});

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function postAction(accessToken: string | null, path: string, body?: unknown) {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

const DEFAULT_LAT = -6.9175;
const DEFAULT_LNG = 107.6191;

function WorkerOrderDetailPage() {
  const { id } = useParams({ from: "/workers/orders/$id" });
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);
  const queryClient = useQueryClient();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [workerLat, setWorkerLat] = useState(DEFAULT_LAT);
  const [workerLng, setWorkerLng] = useState(DEFAULT_LNG);
  const geoInit = useRef(false);

  useEffect(() => {
    if (geoInit.current) return;
    geoInit.current = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setWorkerLat(pos.coords.latitude); setWorkerLng(pos.coords.longitude); },
        () => {},
        { timeout: 5000, enableHighAccuracy: false },
      );
    }
  }, []);

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

  const departMutation = useMutation({
    mutationFn: () => postAction(accessToken, `/api/v1/orders/${id}/depart`),
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

  const rejectMutation = useMutation({
    mutationFn: () => rejectWorkerOrderFn({ data: { accessToken, orderId: id } }),
    onSuccess: (res) => { if (res.ok) invalidate(); },
  });

  const order = data?.data;
  const status = order?.Status ?? "";
  const canAccept = status === "offered" || status === "pending_match";
  const canDepart = status === "accepted";
  const canStart = status === "worker_departed";
  const canComplete = status === "in_progress";
  const canCancelAction = ["accepted", "offered", "pending_match"].includes(status);
  const canReject = status === "offered" || status === "pending_match";
  const isTerminal = ["completed", "expired"].includes(status) || status.startsWith("cancelled");
  const consumerName = order?.Consumer?.FullName ?? "Konsumen";

  const consumerLocation = order?.ConsumerLocation;
  const hasConsumerLocation = consumerLocation?.Valid && consumerLocation.Lat !== 0 && consumerLocation.Lng !== 0;
  const mapCenter: [number, number] = hasConsumerLocation
    ? [consumerLocation.Lng, consumerLocation.Lat]
    : [DEFAULT_LNG, DEFAULT_LAT];

  const distanceKm = hasConsumerLocation
    ? haversineKm(workerLat, workerLng, consumerLocation.Lat, consumerLocation.Lng)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e8ebe6] flex items-center justify-center">
        <Loader2 className="animate-spin text-mute" size={40} />
      </div>
    );
  }

  if (isError || !order || !data?.ok) {
    return (
      <div className="min-h-screen bg-[#e8ebe6]">
        <TopNav backTo="/workers/orders" title="Detail Pesanan" />
        <div className="rounded-[24px] bg-[#ffffff] p-6 max-w-md mx-auto mt-10 text-center">
          <AlertTriangle className="mx-auto mb-2 text-mute" />
          <p className="text-body">Pesanan tidak ditemukan.</p>
          <button type="button" onClick={() => refetch()} className="mt-3 font-semibold underline text-sm">Coba lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8ebe6]">
      <TopNav
        backTo="/workers/orders"
        title="Detail Pesanan"
        right={
          <Link to="/workers" className="text-xs font-semibold text-mute">Dasbor</Link>
        }
      />

      <main className="max-w-2xl mx-auto px-4 lg:px-6 pt-4 pb-20 space-y-4">
        {/* Status Header */}
        <div className="rounded-[24px] bg-[#ffffff] p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              status === "completed" ? "bg-[#e2f6d5] text-[#054d28]" :
              status.startsWith("cancelled") || status === "expired" ? "bg-red-50 text-red-700" :
              "bg-amber-50 text-amber-700"
            }`}>
              {orderStatusLabel(status)}
            </span>
            <span className="text-xs text-mute">dibuat {formatRelative(order.CreatedAt)}</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="size-14 rounded-full bg-[#e2f6d5] flex items-center justify-center text-2xl">
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
                <button type="button" aria-label="Telepon" className="size-10 rounded-full bg-[#e8ebe6] flex items-center justify-center">
                  <Phone size={16} />
                </button>
                <button type="button" aria-label="Pesan" className="size-10 rounded-full bg-[#e8ebe6] flex items-center justify-center">
                  <MessageCircle size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Location with Map */}
        <div className="rounded-[24px] bg-[#ffffff] p-5">
          <div className="flex items-start gap-3 mb-4">
            <MapPin size={18} className="mt-0.5 text-mute" />
            <div className="flex-1">
              <div className="text-xs text-mute font-semibold uppercase tracking-wider">Lokasi Pesanan</div>
              <div className="font-semibold mt-1">{order.ConsumerAddress ?? "—"}</div>
              {distanceKm != null && (
                <div className="text-xs text-body mt-1 inline-flex items-center gap-1">
                  <Navigation size={12} /> {distanceKm.toFixed(1)} km dari lokasi kamu
                </div>
              )}
            </div>
          </div>

          {hasConsumerLocation && (
            <div className="rounded-[16px] overflow-hidden border border-ink/10 h-[200px]">
              <Map center={mapCenter} zoom={15} className="h-full w-full">
                <MapMarker longitude={consumerLocation.Lng} latitude={consumerLocation.Lat}>
                  <MarkerContent>
                    <div className="size-6 rounded-full border-2 border-white bg-[#9fe870] shadow-sm" />
                    <MarkerLabel position="bottom">Konsumen</MarkerLabel>
                  </MarkerContent>
                </MapMarker>
              </Map>
            </div>
          )}

          {order.Description && (
            <div className="border-t border-ink/10 mt-4 pt-4">
              <div className="text-xs text-mute font-semibold uppercase tracking-wider">Deskripsi Pekerjaan</div>
              <p className="text-sm mt-1">{order.Description}</p>
            </div>
          )}
        </div>

        {/* Cost */}
        <div className="rounded-[24px] bg-[#ffffff] p-5 text-sm">
          <h2 className="font-display font-black text-lg mb-3">Estimasi Biaya Jasa</h2>
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
          {distanceKm != null && (
            <div className="flex justify-between py-1.5 border-t border-ink/5 mt-1.5 pt-1.5 text-xs text-mute">
              <span>Jarak</span>
              <span>{distanceKm.toFixed(1)} km</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="rounded-[24px] bg-[#ffffff] p-5">
          <h2 className="font-display font-black text-lg mb-4">Riwayat Status</h2>
          <ApiOrderStatusTimeline status={status} logs={order.Logs} />
        </div>

        {/* Actions */}
        {!isTerminal && (
          <div className="rounded-[24px] bg-[#ffffff] p-5">
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

              {canReject && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Tolak tawaran pesanan ini?")) rejectMutation.mutate();
                  }}
                  disabled={rejectMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-mute hover:text-red-600 border border-ink/10 rounded-[24px] hover:border-red-200 transition-colors"
                >
                  <XCircle size={16} /> Tolak
                </button>
              )}

              {canDepart && (
                <WiseButton
                  full
                  onClick={() => departMutation.mutate()}
                  disabled={departMutation.isPending}
                >
                  {departMutation.isPending ? "Memproses..." : "Berangkat"}
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
                  className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-[24px] transition-colors"
                >
                  <XCircle size={16} /> Batalkan Pesanan
                </button>
              )}

              {showCancel && (
                <div className="space-y-2 rounded-[24px] bg-[#e8ebe6] p-4">
                  <div className="text-sm font-semibold">Alasan pembatalan</div>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Contoh: sedang sibuk, lokasi terlalu jauh..."
                    className="w-full h-11 rounded-[24px] border border-ink/10 bg-[#ffffff] px-3 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCancel(false)}
                      className="flex-1 py-2 rounded-[24px] border border-ink/10 text-sm font-semibold"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelMutation.mutate(cancelReason || "Dibatalkan pekerja")}
                      disabled={cancelMutation.isPending}
                      className="flex-1 py-2 rounded-[24px] bg-red-600 text-white text-sm font-semibold disabled:opacity-40"
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
          <div className="rounded-[24px] bg-[#ffffff] p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-[#2ecc40]" />
              <div>
                <div className="font-display font-black">Pekerjaan Selesai</div>
                <p className="text-sm text-body">Terima kasih! Konsumen akan mengonfirmasi pembayaran.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
