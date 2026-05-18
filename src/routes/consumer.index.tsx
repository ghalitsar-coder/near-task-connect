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
    <main>
      {/* Greeting + address */}
      <section className="bg-canvas-soft px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
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

        <h1 className="display-md mt-5 leading-tight">
          Cari jasa <span className="bg-primary px-1.5 -mx-0.5 rounded-md">di sekitarmu.</span>
        </h1>

        {/* search */}
        <div className="mt-5 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pekerja, mis: 'Hendra' atau 'ledeng'"
            className="text-input !pl-11"
          />
        </div>
      </section>

      {/* categories */}
      <section className="px-5 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
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

      {/* map */}
      <section className="px-5 pt-2">
        <Suspense
          fallback={<div className="rounded-xl bg-canvas h-[260px] animate-pulse" />}
        >
          <NearbyMap
            center={[SEED_LAT, SEED_LNG]}
            workers={workers}
            height="260px"
            radiusKm={5}
          />
        </Suspense>
        <p className="text-xs text-mute mt-2 text-center">
          {workers.length} pekerja online dalam radius 5 km
        </p>
      </section>

      {/* nearby list */}
      <section className="px-5 pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display font-black text-xl">Pekerja terdekat</h2>
          <Link to="/consumer/services" className="text-sm font-semibold inline-flex items-center">
            Lihat semua <ChevronRight size={14} />
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {workers.length === 0 ? (
            <div className="card-content text-center text-body">
              Tidak ada pekerja online di radius 5 km untuk kategori ini.
            </div>
          ) : (
            workers.map((w) => <WorkerCard key={w.id} worker={w} />)
          )}
        </div>
      </section>
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
