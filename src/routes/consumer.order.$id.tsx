import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { Phone, MessageCircle, MapPin, AlertTriangle, ArrowLeft } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { useOrderStore } from "@/stores/useOrderStore";
import { mockWorkers } from "@/data/mockWorkers";
import { mockServices } from "@/data/mockServices";
import { ORDER_STATUS_LABEL } from "@/data/mockOrders";
import { OrderStatusTimeline } from "@/components/consumer/OrderStatusTimeline";
import { formatIDR, formatRelative } from "@/lib/formatCurrency";

const NearbyMap = lazy(() => import("@/components/map/NearbyMap").then((m) => ({ default: m.NearbyMap })));

export const Route = createFileRoute("/consumer/order/$id")({
  head: () => ({ meta: [{ title: "Status Order · KerjaDekat" }] }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = useParams({ from: "/consumer/order/$id" });
  const order = useOrderStore((s) => s.orders.find((o) => o.id === id));
  const advance = useOrderStore((s) => s.advanceStatus);

  // simulate progression
  useEffect(() => {
    if (!order) return;
    const flow: Array<typeof order.status> = ["broadcasting", "matched", "enroute", "arrived", "in_progress"];
    const idx = flow.indexOf(order.status);
    if (idx < 0 || idx >= flow.length - 1) return;
    const t = setTimeout(() => advance(order.id, flow[idx + 1]), 6000);
    return () => clearTimeout(t);
  }, [order, advance]);

  if (!order) {
    return (
      <div className="min-h-screen bg-canvas-soft">
        <TopNav backTo="/consumer" />
        <div className="card-content max-w-md mx-auto mt-10 text-center">Order tidak ditemukan.</div>
      </div>
    );
  }

  const worker = mockWorkers.find((w) => w.id === order.workerId);
  const service = mockServices.find((s) => s.id === order.serviceId);

  return (
    <main className="md:h-[calc(100vh-73px)] md:flex md:overflow-hidden bg-canvas">
      {/* Mobile TopNav */}
      <div className="md:hidden">
        <TopNav backTo="/consumer" title="Status order" />
      </div>

      {/* Left Column (Scrollable details on Desktop) */}
      <div className="md:w-[420px] lg:w-[480px] md:shrink-0 md:border-r border-ink/10 md:overflow-y-auto bg-canvas-soft md:bg-canvas md:flex md:flex-col">
        
        {/* Desktop Header for Panel */}
        <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-ink/10 bg-canvas sticky top-0 z-10">
          <Link to="/consumer" className="size-8 rounded-full bg-canvas-soft flex items-center justify-center hover:bg-ink/5 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="font-display font-black text-lg">Status pesanan</h1>
        </div>

        {/* Mobile live map (hidden on desktop) */}
        <section className="px-5 pt-4 md:hidden">
          <Suspense fallback={<div className="h-[220px] card-content animate-pulse" />}>
            <NearbyMap center={[order.lat, order.lng]} workers={worker ? [worker] : []} radiusKm={1} height="220px" />
          </Suspense>
        </section>

        <div className="md:flex-1 md:bg-canvas-soft/50 md:p-6 space-y-4 px-5 py-4 pb-10">
          
          {/* status badge */}
          <div className="card-content">
            <div className="flex items-center justify-between">
              <span className="badge-positive">
                <span className="size-1.5 rounded-full bg-positive animate-pulse" />
                {ORDER_STATUS_LABEL[order.status]}
              </span>
              <span className="text-xs text-mute">dibuat {formatRelative(order.createdAt)}</span>
            </div>

            {worker && (
              <div className="mt-4 flex items-center gap-3">
                <img src={worker.photo} alt="" className="size-14 rounded-full bg-primary-pale object-cover" />
                <div className="flex-1">
                  <div className="font-display font-black">{worker.name}</div>
                  <div className="text-xs text-body mt-0.5">
                    {service?.name} · ⭐ {worker.rating} · {worker.distanceKm} km
                  </div>
                </div>
                <div className="flex gap-2">
                  <button aria-label="Telepon" className="size-10 rounded-full bg-canvas-soft flex items-center justify-center hover:bg-ink/5 transition-colors">
                    <Phone size={16} />
                  </button>
                  <button aria-label="Pesan" className="size-10 rounded-full bg-canvas-soft flex items-center justify-center hover:bg-ink/5 transition-colors">
                    <MessageCircle size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="card-sage !p-3">
                <div className="text-xs text-mute font-semibold uppercase tracking-wider">ETA</div>
                <div className="font-display font-black mt-1">~ 8 mnt</div>
              </div>
              <div className="card-sage !p-3">
                <div className="text-xs text-mute font-semibold uppercase tracking-wider">Jarak</div>
                <div className="font-display font-black mt-1">{worker?.distanceKm} km</div>
              </div>
            </div>
          </div>

          {/* address */}
          <div className="card-content">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 text-mute" />
              <div className="flex-1">
                <div className="text-xs text-mute font-semibold uppercase tracking-wider">Alamat tujuan</div>
                <div className="font-semibold mt-1">{order.addressLabel}</div>
              </div>
            </div>
            <div className="border-t border-ink/10 mt-4 pt-4">
              <div className="text-xs text-mute font-semibold uppercase tracking-wider">Catatan untuk pekerja</div>
              <p className="text-sm mt-1">{order.notes}</p>
            </div>
          </div>

          {/* timeline */}
          <div className="card-content">
            <h2 className="font-display font-black text-lg mb-4">Riwayat status</h2>
            <OrderStatusTimeline order={order} />
          </div>

          {/* fees */}
          <div className="card-content text-sm">
            <h2 className="font-display font-black text-lg mb-3">Rincian biaya</h2>
            <div className="flex justify-between py-1.5 border-b border-ink/5">
              <span className="text-body">Biaya admin (ditahan)</span>
              <span className="font-semibold">{formatIDR(order.adminFee)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-body">Upah jasa (tunai ke pekerja)</span>
              <span className="font-semibold">{formatIDR(order.estimatedPrice)}</span>
            </div>
            <div className="mt-4 card-sage !p-3 text-xs text-mute leading-relaxed">
              Silakan konfirmasi pesanan setelah upah tunai diserahkan ke pekerja. 
              Dana yang ditahan akan menjadi pendapatan KerjaDekat.
            </div>
          </div>

          {/* actions */}
          <div className="space-y-3 pt-2">
            <WiseButton
              full
              onClick={() => advance(order.id, "completed")}
              disabled={order.status === "completed" || order.status === "cancelled"}
            >
              Konfirmasi pembayaran selesai
            </WiseButton>
            <button
              onClick={() => advance(order.id, "cancelled")}
              disabled={order.status === "completed" || order.status === "cancelled"}
              className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-negative-deep disabled:opacity-40 hover:bg-negative-pale/50 rounded-lg transition-colors"
            >
              <AlertTriangle size={14} /> Batalkan pesanan
            </button>
            <Link to="/consumer" className="btn-tertiary w-full md:hidden">Kembali ke beranda</Link>
          </div>
        </div>
      </div>

      {/* Right Column (Sticky Map on Desktop) */}
      <div className="hidden md:block flex-1 relative bg-canvas-soft">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-canvas-soft" />}>
          <NearbyMap center={[order.lat, order.lng]} workers={worker ? [worker] : []} height="100%" radiusKm={1} />
        </Suspense>
        
        {/* Map Overlay Stats */}
        <div className="absolute top-6 left-6 z-[400] bg-canvas/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-ink/10 shadow-sm flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary-pale text-primary-deep flex items-center justify-center">
            <MapPin size={16} />
          </div>
          <div>
            <div className="text-xs text-mute font-semibold uppercase tracking-wider">Lokasi Pesanan</div>
            <div className="font-display font-black text-sm">{ORDER_STATUS_LABEL[order.status]}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
