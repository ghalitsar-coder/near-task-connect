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
    <main className="bg-canvas-soft min-h-[calc(100vh-73px)]">
      {/* Mobile TopNav */}
      <div className="md:hidden">
        <TopNav backTo="/consumer" />
      </div>

      <div className="max-w-6xl mx-auto md:px-8 pt-4 pb-24 md:py-8">
        {/* Desktop breadcrumb */}
        <div className="hidden md:block mb-6">
          <Link to="/consumer" className="text-sm font-semibold text-mute hover:text-ink inline-flex items-center transition-colors">
            &larr; Kembali ke daftar pekerja
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-6 lg:gap-10 items-start">
          
          {/* Left Column: Profile */}
          <div className="space-y-6">
            <section className="px-5 md:px-0">
              <div className="card-content">
                <div className="flex items-start gap-4 md:gap-6">
                  <img src={worker.photo} alt="" className="size-20 md:size-24 rounded-full bg-primary-pale object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="display-sm md:display-md">{worker.name}</h1>
                      {worker.verifiedRT && <CheckCircle2 className="text-positive" size={20} />}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-body mt-2">
                      <span className="inline-flex items-center gap-1">
                        <Star size={16} className="fill-warning text-warning" /> 
                        <strong className="text-ink">{worker.rating}</strong>
                        <span className="text-mute">({worker.ratingCount} ulasan)</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={16} /> {worker.distanceKm} km
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={16} /> ~{worker.responseMin}m respons
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-body mt-4 leading-relaxed">{worker.bio}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {worker.skills.map((s) => {
                        const svc = mockServices.find((m) => m.slug === s);
                        return svc ? (
                          <span key={s} className="badge-neutral !text-sm">
                            {svc.icon} {svc.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8 border-t border-ink/10 pt-6">
                  <Stat label="Pekerjaan selesai" value={worker.completedJobs.toString()} />
                  <Stat label="Rating rata-rata" value={worker.rating.toFixed(1)} />
                  <Stat label="Tarif / jam" value={formatIDR(worker.hourlyRate)} />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Form */}
          <div className="lg:sticky lg:top-28 space-y-6">
            <section className="px-5 md:px-0">
              <div className="card-content">
                <h2 className="font-display font-black text-xl">Detail pesanan</h2>

                <label className="block text-sm font-semibold mt-5 mb-3">Pilih jasa</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableServices.map((s) => {
                    const active = s.id === serviceId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setServiceId(s.id)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          active ? "border-ink bg-primary-pale ring-1 ring-ink shadow-sm" : "border-ink/15 bg-canvas hover:border-ink/40"
                        }`}
                      >
                        <div className="text-2xl">{s.icon}</div>
                        <div className="font-semibold text-sm mt-2">{s.name}</div>
                        <div className="text-xs text-body mt-0.5">{formatIDR(s.basePrice)}</div>
                      </button>
                    );
                  })}
                </div>

                <label className="block text-sm font-semibold mt-6 mb-2">Catatan untuk pekerja</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="mis: kran wastafel dapur bocor, sudah lapis tisu tapi masih netes."
                  className="text-input"
                />

                <div className="card-sage mt-6 !p-5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-body">Estimasi upah (tunai)</span>
                    <strong className="text-base">{formatIDR(selected.basePrice)}</strong>
                  </div>
                  <div className="flex justify-between items-center mt-2 pb-3 border-b border-ink/10">
                    <span className="text-body">Biaya admin (ditahan)</span>
                    <strong className="text-base">{formatIDR(2000)}</strong>
                  </div>
                  <p className="text-xs text-mute mt-3 leading-relaxed">
                    Biaya admin Rp2.000 ditahan via Xendit & otomatis dikembalikan jika pesanan batal. 
                    Upah jasa dibayar <strong>tunai</strong> langsung ke pekerja setelah selesai.
                  </p>
                </div>
              </div>
            </section>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 inset-x-0 bg-canvas border-t border-ink/10 p-4 md:static md:bg-transparent md:border-none md:p-0 z-30">
              <div className="max-w-md mx-auto md:max-w-none flex items-center gap-4 md:bg-canvas md:p-5 md:rounded-2xl md:border md:border-ink/10 md:shadow-sm">
                <div className="flex-1">
                  <div className="text-xs text-mute font-semibold uppercase tracking-wider mb-0.5">Total ditahan</div>
                  <div className="font-display font-black text-xl md:text-2xl">{formatIDR(2000)}</div>
                </div>
                <WiseButton onClick={handleOrder}>Pesan & Bayar</WiseButton>
              </div>
            </div>
            
            <div className="px-5 md:hidden">
              <Link to="/consumer" className="btn-tertiary w-full mt-4">Batal</Link>
            </div>
          </div>
        </div>
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
