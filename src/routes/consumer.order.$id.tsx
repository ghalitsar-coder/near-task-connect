import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, MessageCircle, MapPin, AlertTriangle, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import {
  cancelConsumerOrderFn,
  getConsumerOrderFn,
} from "@/lib/consumer.server";
import { ApiOrderStatusTimeline } from "@/components/consumer/ApiOrderStatusTimeline";
import { orderStatusLabel, paymentStatusLabel, skillEmoji } from "@/lib/orderLabels";
import { canCancelOrder, orderMapCenter } from "@/lib/orderUtils";
import { DEFAULT_LAT, DEFAULT_LNG } from "@/lib/geo";
import { formatIDR, formatRelative } from "@/lib/formatCurrency";
import { useSessionStore } from "@/stores/useSessionStore";

const NearbyMap = lazy(() => import("@/components/map/NearbyMap").then((m) => ({ default: m.NearbyMap })));

export const Route = createFileRoute("/consumer/order/$id")({
  head: () => ({ meta: [{ title: "Status Order · KerjaDekat" }] }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = useParams({ from: "/consumer/order/$id" });
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["consumer-order", id, accessToken],
    queryFn: () => getConsumerOrderFn({ data: { accessToken, orderId: id } }),
    enabled: authed && Boolean(accessToken) && Boolean(id),
    refetchInterval: (q) => {
      const status = q.state.data?.data?.Status;
      if (status === "completed" || status === "cancelled") return false;
      return 15_000;
    },
    staleTime: 10_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) =>
      cancelConsumerOrderFn({ data: { accessToken, orderId: id, reason } }),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["consumer-order", id] });
        queryClient.invalidateQueries({ queryKey: ["consumer-orders"] });
      }
    },
  });

  const order = data?.data;
  const mapCenter: [number, number] = order
    ? (orderMapCenter(order, [DEFAULT_LAT, DEFAULT_LNG]) ?? [DEFAULT_LAT, DEFAULT_LNG])
    : [DEFAULT_LAT, DEFAULT_LNG];
  const skillName = order?.Skill?.Name ?? "Jasa";
  const workerName = order?.Worker?.FullName;
  const cancellable = order ? canCancelOrder(order.Status) : false;

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
        <TopNav backTo="/consumer" />
        <div className="rounded-[24px] bg-[#ffffff] max-w-md mx-auto mt-10 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-[#d03238]" />
          <p className="text-body">Order tidak ditemukan atau gagal dimuat.</p>
          <button type="button" onClick={() => refetch()} className="mt-3 font-semibold underline text-sm">
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="md:h-[calc(100vh-73px)] md:flex md:overflow-hidden bg-[#ffffff]">
      <div className="md:hidden">
        <TopNav backTo="/consumer" title="Status order" />
      </div>

      <div className="md:w-[420px] lg:w-[480px] md:shrink-0 md:border-r border-ink/10 md:overflow-y-auto bg-[#e8ebe6] md:bg-[#ffffff] md:flex md:flex-col">
        <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-ink/10 bg-[#ffffff] sticky top-0 z-10">
          <Link
            to="/consumer"
            className="size-8 rounded-full bg-[#e8ebe6] flex items-center justify-center hover:bg-ink/5 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="font-display font-black text-lg">Status pesanan</h1>
        </div>

        <section className="px-5 pt-4 md:hidden">
          <Suspense fallback={<div className="h-[220px] rounded-[24px] bg-[#ffffff] animate-pulse" />}>
            <NearbyMap center={mapCenter} workers={[]} radiusKm={1} height="220px" showUser />
          </Suspense>
        </section>

        <div className="md:flex-1 md:bg-[#e8ebe6]/50 md:p-6 space-y-4 px-5 py-4 pb-10">
          <div className="rounded-[24px] bg-[#ffffff] p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="badge-positive">
                <span className="size-1.5 rounded-full bg-positive animate-pulse" />
                {orderStatusLabel(order.Status)}
              </span>
              <span className="text-xs text-mute">dibuat {formatRelative(order.CreatedAt)}</span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="size-14 rounded-full bg-[#e2f6d5] flex items-center justify-center text-2xl">
                {skillEmoji(skillName)}
              </div>
              <div className="flex-1">
                <div className="font-display font-black">{skillName}</div>
                <div className="text-xs text-body mt-0.5">
                  Pekerja: <strong>{workerName ?? "Mencari pekerja terdekat…"}</strong>
                </div>
                <div className="text-xs text-mute mt-1">{paymentStatusLabel(order.PaymentStatus)}</div>
              </div>
              {workerName && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Telepon"
                    className="size-10 rounded-full bg-[#e8ebe6] flex items-center justify-center"
                  >
                    <Phone size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Pesan"
                    className="size-10 rounded-full bg-[#e8ebe6] flex items-center justify-center"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] bg-[#ffffff] p-6">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 text-mute" />
              <div className="flex-1">
                <div className="text-xs text-mute font-semibold uppercase tracking-wider">Alamat</div>
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

          <div className="rounded-[24px] bg-[#ffffff] p-6">
            <h2 className="font-display font-black text-lg mb-4">Riwayat status</h2>
            <ApiOrderStatusTimeline status={order.Status} />
          </div>

          <div className="rounded-[24px] bg-[#ffffff] p-6 text-sm">
            <h2 className="font-display font-black text-lg mb-3">Rincian biaya</h2>
            <div className="flex justify-between py-1.5 border-b border-ink/5">
              <span className="text-body">Biaya admin (ditahan)</span>
              <span className="font-semibold">{formatIDR(order.PlatformFee)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-body">Upah jasa (tunai)</span>
              <span className="font-semibold">
                {order.AgreedRate != null ? formatIDR(order.AgreedRate) : "—"}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {cancellable && (
              <button
                id="consumer-order-cancel-btn"
                type="button"
                onClick={() => cancelMutation.mutate("Dibatalkan konsumen")}
                disabled={cancelMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#054d28] disabled:opacity-40 hover:bg-[#d03238]/10 rounded-[24px] transition-colors"
              >
                {cancelMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <AlertTriangle size={14} />
                )}
                Batalkan pesanan
              </button>
            )}
            <Link to="/consumer" className="btn-tertiary w-full md:hidden text-center">
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden md:block flex-1 relative bg-[#e8ebe6]">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-[#e8ebe6]" />}>
          <NearbyMap center={mapCenter} workers={[]} height="100%" radiusKm={1} showUser />
        </Suspense>
        <div className="absolute top-6 left-6 z-[400] bg-[#ffffff]/90 backdrop-blur-md px-4 py-3 rounded-[24px] border border-ink/10 shadow-sm">
          <div className="text-xs text-mute font-semibold uppercase tracking-wider">Status</div>
          <div className="font-display font-black text-sm">{orderStatusLabel(order.Status)}</div>
        </div>
      </div>
    </main>
  );
}
