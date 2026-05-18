import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { Phone, MessageCircle, MapPin, AlertTriangle } from "lucide-react";
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
    <main className="bg-canvas-soft">
      <TopNav backTo="/consumer" title="Status order" />

      {/* live map */}
      <section className="px-5 pt-4">
        <Suspense fallback={<div className="h-[220px] card-content animate-pulse" />}>
          <NearbyMap
            center={[order.lat, order.lng]}
            workers={worker ? [worker] : []}
            radiusKm={1}
            height="220px"
          />
        </Suspense>
      </section>

      {/* status badge */}
      <section className="px-5 pt-4">
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
              <img src={worker.photo} alt="" className="size-14 rounded-full bg-primary-pale" />
              <div className="flex-1">
                <div className="font-display font-black">{worker.name}</div>
                <div className="text-xs text-body">
                  {service?.name} · ⭐ {worker.rating} · {worker.distanceKm} km
                </div>
              </div>
              <div className="flex gap-2">
                <button aria-label="Telepon" className="size-10 rounded-full bg-canvas-soft flex items-center justify-center">
                  <Phone size={16} />
                </button>
                <button aria-label="Pesan" className="size-10 rounded-full bg-canvas-soft flex items-center justify-center">
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="card-sage !p-3">
              <div className="text-xs text-mute">ETA</div>
              <div className="font-display font-black">~ 8 mnt</div>
            </div>
            <div className="card-sage !p-3">
              <div className="text-xs text-mute">Jarak</div>
              <div className="font-display font-black">{worker?.distanceKm} km</div>
            </div>
          </div>
        </div>
      </section>

      {/* address */}
      <section className="px-5 pt-4">
        <div className="card-content">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5" />
            <div className="flex-1">
              <div className="text-xs text-mute">Alamat tujuan</div>
              <div className="font-semibold">{order.addressLabel}</div>
            </div>
          </div>
          <div className="border-t border-ink/10 mt-4 pt-4">
            <div className="text-xs text-mute">Catatan</div>
            <p className="text-sm mt-1">{order.notes}</p>
          </div>
        </div>
      </section>

      {/* timeline */}
      <section className="px-5 pt-4">
        <div className="card-content">
          <h2 className="font-display font-black text-lg mb-2">Riwayat status</h2>
          <OrderStatusTimeline order={order} />
        </div>
      </section>

      {/* fees */}
      <section className="px-5 pt-4">
        <div className="card-content text-sm">
          <h2 className="font-display font-black text-lg mb-2">Rincian biaya</h2>
          <div className="flex justify-between py-1">
            <span>Biaya admin (ditahan)</span>
            <span className="font-semibold">{formatIDR(order.adminFee)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Upah jasa (tunai ke pekerja)</span>
            <span className="font-semibold">{formatIDR(order.estimatedPrice)}</span>
          </div>
          <p className="text-xs text-mute mt-3">
            Tekan "Konfirmasi pembayaran selesai" setelah upah tunai diserahkan ke pekerja.
          </p>
        </div>
      </section>

      <section className="px-5 pt-4 pb-10 space-y-2">
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
          className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-negative-deep disabled:opacity-40"
        >
          <AlertTriangle size={14} /> Batalkan pesanan
        </button>
        <Link to="/consumer" className="btn-tertiary w-full">Kembali ke beranda</Link>
      </section>
    </main>
  );
}
