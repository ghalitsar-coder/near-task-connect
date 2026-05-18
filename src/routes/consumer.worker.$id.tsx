import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Star, MapPin, CheckCircle2, Clock } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { mockWorkers } from "@/data/mockWorkers";
import { mockServices } from "@/data/mockServices";
import { useOrderStore } from "@/stores/useOrderStore";
import { formatIDR } from "@/lib/formatCurrency";

export const Route = createFileRoute("/consumer/worker/$id")({
  head: () => ({ meta: [{ title: "Profil Pekerja · KerjaDekat" }] }),
  component: WorkerProfilePage,
  notFoundComponent: () => <NotFound />,
});

function NotFound() {
  return (
    <div className="min-h-screen bg-canvas-soft">
      <TopNav backTo="/consumer" />
      <div className="card-content max-w-md mx-auto mt-10 text-center">
        Pekerja tidak ditemukan.
      </div>
    </div>
  );
}

function WorkerProfilePage() {
  const { id } = useParams({ from: "/consumer/worker/$id" });
  const worker = mockWorkers.find((w) => w.id === id);
  const navigate = useNavigate();
  const createOrder = useOrderStore((s) => s.createOrder);

  const [serviceId, setServiceId] = useState(worker ? `svc-${worker.primarySkill}` : "");
  const [notes, setNotes] = useState("");

  if (!worker) return <NotFound />;

  const availableServices = mockServices.filter((s) => worker.skills.includes(s.slug));
  const selected = mockServices.find((s) => s.id === serviceId) ?? availableServices[0];

  const handleOrder = () => {
    const newId = createOrder({
      serviceId: selected.id,
      workerId: worker.id,
      addressLabel: "Jl. Tebet Barat Dalam VIII no. 12, RT 03/RW 05",
      lat: -6.2349,
      lng: 106.857,
      notes: notes || "—",
      estimatedPrice: selected.basePrice,
    });
    navigate({ to: "/consumer/payment/$id", params: { id: newId } });
  };

  return (
    <main className="bg-canvas-soft">
      <TopNav backTo="/consumer" />

      {/* profile head */}
      <section className="px-5 pt-4">
        <div className="card-content">
          <div className="flex items-start gap-4">
            <img src={worker.photo} alt="" className="size-20 rounded-full bg-primary-pale" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="display-sm">{worker.name}</h1>
                {worker.verifiedRT && <CheckCircle2 className="text-positive" size={18} />}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-body mt-1">
                <span className="inline-flex items-center gap-1">
                  <Star size={14} className="fill-warning text-warning" /> {worker.rating}
                  <span className="text-mute">({worker.ratingCount})</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {worker.distanceKm} km
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} /> ~{worker.responseMin}m respons
                </span>
              </div>
              <p className="text-sm text-body mt-3">{worker.bio}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {worker.skills.map((s) => {
                  const svc = mockServices.find((m) => m.slug === s);
                  return svc ? (
                    <span key={s} className="badge-neutral">
                      {svc.icon} {svc.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 border-t border-ink/10 pt-4">
            <Stat label="Pekerjaan selesai" value={worker.completedJobs.toString()} />
            <Stat label="Rating rata-rata" value={worker.rating.toFixed(1)} />
            <Stat label="Tarif / jam" value={formatIDR(worker.hourlyRate)} />
          </div>
        </div>
      </section>

      {/* order form */}
      <section className="px-5 pt-4">
        <div className="card-content">
          <h2 className="font-display font-black text-lg">Detail pesanan</h2>

          <label className="block text-sm font-semibold mt-4 mb-2">Pilih jasa</label>
          <div className="grid grid-cols-2 gap-2">
            {availableServices.map((s) => {
              const active = s.id === serviceId;
              return (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active ? "border-ink bg-primary-pale" : "border-ink/15 bg-canvas"
                  }`}
                >
                  <div className="text-xl">{s.icon}</div>
                  <div className="font-semibold text-sm mt-1">{s.name}</div>
                  <div className="text-xs text-body">{formatIDR(s.basePrice)}</div>
                </button>
              );
            })}
          </div>

          <label className="block text-sm font-semibold mt-5 mb-2">Catatan untuk pekerja</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="mis: kran wastafel dapur bocor, sudah lapis tisu tapi masih netes."
            className="text-input"
          />

          <div className="card-sage mt-5 !p-4 text-sm">
            <div className="flex justify-between">
              <span>Estimasi upah (tunai)</span>
              <strong>{formatIDR(selected.basePrice)}</strong>
            </div>
            <div className="flex justify-between mt-1">
              <span>Biaya admin (ditahan)</span>
              <strong>{formatIDR(2000)}</strong>
            </div>
            <p className="text-xs text-mute mt-2">
              Biaya admin Rp2.000 ditahan via Xendit & otomatis dibebaskan jika pesanan batal.
              Upah jasa dibayar tunai langsung ke pekerja.
            </p>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 inset-x-0 bg-canvas border-t border-ink/10 p-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-mute">Total ditahan</div>
            <div className="font-display font-black text-lg">{formatIDR(2000)}</div>
          </div>
          <WiseButton onClick={handleOrder}>Pesan & bayar admin</WiseButton>
        </div>
      </div>

      <div className="h-6" />
      <div className="px-5 pb-4">
        <Link to="/consumer" className="btn-tertiary w-full">Kembali</Link>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display font-black text-lg">{value}</div>
      <div className="text-xs text-mute">{label}</div>
    </div>
  );
}
