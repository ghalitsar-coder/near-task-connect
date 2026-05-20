import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, MapPin, Clock, Power, Star } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { useSessionStore } from "@/stores/useSessionStore";
import { mockServices } from "@/data/mockServices";
import { formatIDR } from "@/lib/formatCurrency";

export const Route = createFileRoute("/workers/")({
  head: () => ({ meta: [{ title: "Dasbor Pekerja · KerjaDekat" }] }),
  component: WorkerDashboard,
});

interface IncomingOffer {
  id: string;
  serviceId: string;
  distanceKm: number;
  estimatedPrice: number;
  notes: string;
  addressLabel: string;
  expiresInSec: number;
}

const MOCK_OFFER: IncomingOffer = {
  id: "offer-1",
  serviceId: "svc-ledeng",
  distanceKm: 0.6,
  estimatedPrice: 95000,
  notes: "Kran wastafel dapur bocor, perlu cepat.",
  addressLabel: "Jl. Tebet Barat Dalam VIII, RT 03/05",
  expiresInSec: 60,
};

function WorkerDashboard() {
  const navigate = useNavigate();
  const { name, signOut } = useSessionStore();
  const [online, setOnline] = useState(true);
  const [offer, setOffer] = useState<IncomingOffer | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [todayEarning] = useState(245000);
  const [todayJobs] = useState(3);

  // simulate incoming after 5s when online
  useEffect(() => {
    if (!online || offer) return;
    const t = setTimeout(() => {
      setOffer(MOCK_OFFER);
      setCountdown(MOCK_OFFER.expiresInSec);
    }, 5000);
    return () => clearTimeout(t);
  }, [online, offer]);

  // countdown auto-reject
  useEffect(() => {
    if (!offer) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setOffer(null);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [offer]);

  return (
    <div className="min-h-screen bg-canvas-soft">
      <TopNav
        backTo="/"
        title="Mitra"
        right={
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="text-xs font-semibold text-mute"
          >
            Keluar
          </button>
        }
      />

      <main className="max-w-md mx-auto px-5 pt-4 pb-20">
        {/* status card */}
        <div className={`card-content ${online ? "border border-positive/30" : ""}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-body">Halo,</div>
              <div className="font-display font-black text-lg">{name}</div>
            </div>
            <button
              onClick={() => setOnline((o) => !o)}
              className={`flex items-center gap-2 rounded-pill px-4 py-2 font-semibold text-sm border ${
                online ? "bg-primary border-ink" : "bg-canvas-soft border-ink/20"
              }`}
            >
              <Power size={14} /> {online ? "Online" : "Offline"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="card-sage !p-3">
              <div className="text-xs text-mute">Pendapatan hari ini</div>
              <div className="font-display font-black text-lg">{formatIDR(todayEarning)}</div>
            </div>
            <div className="card-sage !p-3">
              <div className="text-xs text-mute">Order selesai</div>
              <div className="font-display font-black text-lg">{todayJobs}</div>
            </div>
          </div>
        </div>

        {/* waiting / offer */}
        {online && !offer && (
          <div className="card-content mt-4 text-center">
            <div className="size-14 rounded-full bg-primary-pale mx-auto flex items-center justify-center">
              <Bell size={24} className="animate-pulse" />
            </div>
            <div className="font-display font-black mt-3">Siap menerima tawaran</div>
            <p className="text-sm text-body mt-1">
              Status broadcasting via WebSocket aktif. Tawaran akan muncul dalam beberapa detik (demo).
            </p>
          </div>
        )}

        {!online && (
          <div className="card-sage mt-4 text-center text-sm">
            Kamu sedang offline. Konsumen tidak akan melihatmu di daftar pekerja terdekat.
          </div>
        )}

        {offer && online && (
          <OfferCard
            offer={offer}
            countdown={countdown}
            onAccept={() => navigate({ to: "/consumers/order/$id", params: { id: "ord-LIVE" } })}
            onReject={() => setOffer(null)}
          />
        )}

        {/* today's recents */}
        <h2 className="font-display font-black mt-6 mb-3">Order terakhir</h2>
        {[
          { svc: "svc-bersih", label: "Bu Mira · 2 jam lalu", price: 120000, rating: 5 },
          { svc: "svc-ledeng", label: "Pak Doni · pagi tadi", price: 80000, rating: 4 },
          { svc: "svc-ledeng", label: "Bu Sari · kemarin", price: 45000, rating: 5 },
        ].map((row, i) => {
          const svc = mockServices.find((s) => s.id === row.svc);
          return (
            <div key={i} className="card-content flex items-center gap-3 mb-2">
              <div className="text-2xl">{svc?.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{svc?.name}</div>
                <div className="text-xs text-mute">{row.label}</div>
              </div>
              <div className="text-right">
                <div className="font-display font-black text-sm">{formatIDR(row.price)}</div>
                <div className="text-xs text-mute flex items-center justify-end gap-1">
                  <Star size={10} className="fill-warning text-warning" /> {row.rating}.0
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}

function OfferCard({
  offer,
  countdown,
  onAccept,
  onReject,
}: {
  offer: IncomingOffer;
  countdown: number;
  onAccept: () => void;
  onReject: () => void;
}) {
  const svc = mockServices.find((s) => s.id === offer.serviceId);
  const pct = (countdown / offer.expiresInSec) * 100;

  return (
    <div className="card-dark mt-4 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-ink/40">
        <div
          className="h-full bg-primary transition-[width] duration-1000 linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-canvas-soft/80 text-xs">
        <span className="inline-flex items-center gap-1">
          <Bell size={14} /> Tawaran baru
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={14} /> Auto-reject {countdown}d
        </span>
      </div>
      <h3 className="display-md mt-3">{svc?.icon} {svc?.name}</h3>
      <div className="text-canvas-soft text-sm mt-2 inline-flex items-center gap-1">
        <MapPin size={14} /> {offer.addressLabel} · {offer.distanceKm} km
      </div>
      <p className="text-canvas-soft/80 text-sm mt-3">"{offer.notes}"</p>

      <div className="card-content mt-4 !py-3 flex items-center justify-between">
        <span className="text-sm">Estimasi upah</span>
        <strong className="font-display font-black">{formatIDR(offer.estimatedPrice)}</strong>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button onClick={onReject} className="btn-tertiary">Tolak</button>
        <WiseButton onClick={onAccept}>Terima</WiseButton>
      </div>
    </div>
  );
}
