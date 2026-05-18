import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { Search, MapPin, ChevronRight } from "lucide-react";
import { mockServices } from "@/data/mockServices";
import { mockWorkers, SEED_LAT, SEED_LNG } from "@/data/mockWorkers";
import { WorkerCard } from "@/components/consumer/WorkerCard";
import { useSessionStore } from "@/stores/useSessionStore";

const NearbyMap = lazy(() =>
  import("@/components/map/NearbyMap").then((m) => ({ default: m.NearbyMap }))
);

export const Route = createFileRoute("/consumer/")({
  head: () => ({ meta: [{ title: "Beranda · KerjaDekat" }] }),
  component: ConsumerHome,
});

function ConsumerHome() {
  const name = useSessionStore((s) => s.name);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const workers = useMemo(() => {
    let list = mockWorkers.filter((w) => w.online);
    if (activeSlug) list = list.filter((w) => w.skills.includes(activeSlug));
    if (query) list = list.filter((w) => w.name.toLowerCase().includes(query.toLowerCase()));
    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [activeSlug, query]);

  return (
    <main className="md:h-[calc(100vh-73px)] md:flex md:overflow-hidden bg-canvas">
      {/* Left Column (Scrollable List on Desktop) */}
      <div className="md:w-[420px] lg:w-[480px] md:shrink-0 md:border-r border-ink/10 md:overflow-y-auto bg-canvas-soft md:bg-canvas md:flex md:flex-col">
        
        <section className="bg-canvas-soft px-5 pt-6 pb-4 md:bg-transparent md:pt-8">
          {/* Mobile Only Greeting */}
          <div className="flex items-center justify-between md:hidden">
            <div>
              <p className="text-sm text-body">Halo, {name.split(" ")[0]} 👋</p>
              <p className="font-semibold flex items-center gap-1 mt-0.5">
                <MapPin size={14} /> Tebet Barat, Jakarta Selatan
              </p>
            </div>
            <Link to="/consumer/profile" className="size-10 rounded-full bg-canvas border border-ink/10 flex items-center justify-center font-display font-black">
              {name[0]}
            </Link>
          </div>

          <h1 className="display-md mt-5 leading-tight md:mt-0">
            Cari jasa <span className="bg-primary px-1.5 -mx-0.5 rounded-md">di sekitarmu.</span>
          </h1>

          {/* search */}
          <div className="mt-5 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari pekerja, mis: 'Hendra' atau 'ledeng'"
              className="text-input !pl-11 bg-canvas shadow-sm"
            />
          </div>
        </section>

        {/* categories */}
        <section className="px-5 pt-2 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 hide-scrollbar">
            <Chip active={activeSlug === null} onClick={() => setActiveSlug(null)} label="Semua" />
            {mockServices.map((s) => (
              <Chip
                key={s.id}
                active={activeSlug === s.slug}
                onClick={() => setActiveSlug((cur) => (cur === s.slug ? null : s.slug))}
                label={`${s.icon} ${s.name}`}
              />
            ))}
          </div>
        </section>

        {/* mobile map (hidden on desktop) */}
        <section className="px-5 pt-2 md:hidden">
          <Suspense fallback={<div className="rounded-xl bg-canvas border border-ink/10 h-[260px] animate-pulse" />}>
            <NearbyMap center={[SEED_LAT, SEED_LNG]} workers={workers} height="260px" radiusKm={5} />
          </Suspense>
          <p className="text-xs text-mute mt-2 text-center">
            {workers.length} pekerja online dalam radius 5 km
          </p>
        </section>

        {/* nearby list */}
        <section className="px-5 pt-6 pb-8 md:flex-1 md:bg-canvas-soft/50 md:border-t border-ink/5">
          <div className="flex items-baseline justify-between sticky top-0 bg-canvas-soft/80 backdrop-blur-md py-2 z-10 md:bg-transparent md:backdrop-blur-none md:static">
            <h2 className="font-display font-black text-xl">Pekerja terdekat</h2>
            <Link to="/consumer/services" className="text-sm font-semibold inline-flex items-center text-ink hover:text-ink-deep transition-colors">
              Lihat semua <ChevronRight size={14} />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {workers.length === 0 ? (
              <div className="card-content text-center text-body py-10 border border-ink/5">
                Tidak ada pekerja online di radius 5 km untuk kategori ini.
              </div>
            ) : (
              workers.map((w) => <WorkerCard key={w.id} worker={w} />)
            )}
          </div>
        </section>
      </div>

      {/* Right Column (Sticky Map on Desktop) */}
      <div className="hidden md:block flex-1 relative bg-canvas-soft">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-canvas-soft" />}>
          <NearbyMap center={[SEED_LAT, SEED_LNG]} workers={workers} height="100%" radiusKm={5} />
        </Suspense>
        
        {/* Map Overlay Stats */}
        <div className="absolute top-6 left-6 z-[400] bg-canvas/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-ink/10 shadow-sm flex items-center gap-3">
          <div className="size-8 rounded-full bg-positive-pale text-positive flex items-center justify-center">
            <MapPin size={16} />
          </div>
          <div>
            <div className="text-xs text-mute font-semibold uppercase tracking-wider">Radius 5 km</div>
            <div className="font-display font-black text-sm">{workers.length} pekerja online</div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-pill px-4 py-2 text-sm font-semibold border transition-colors ${
        active ? "bg-ink text-canvas border-ink" : "bg-canvas text-ink border-ink/15 hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}
