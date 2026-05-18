import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ChevronRight, AlertCircle, Loader2, Users } from "lucide-react";
import { getConsumerSkillCategoriesFn, getNearbyWorkersFn } from "@/lib/consumer.server";
import { skillEmoji } from "@/lib/orderLabels";
import { DEFAULT_LAT, DEFAULT_LNG, readUserPosition } from "@/lib/geo";
import { nearbyToMapWorker } from "@/lib/workerMapUtils";
import type { SkillCategory } from "@/lib/api/types";
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
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);
  const [activeSkillId, setActiveSkillId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState<[number, number]>([DEFAULT_LAT, DEFAULT_LNG]);

  useEffect(() => {
    readUserPosition().then(({ lat, lng }) => setCenter([lat, lng]));
  }, []);

  const categoriesQuery = useQuery({
    queryKey: ["consumer-skill-categories", accessToken],
    queryFn: () => getConsumerSkillCategoriesFn({ data: { accessToken } }),
    enabled: authed && Boolean(accessToken),
    staleTime: 300_000,
  });

  const nearbyQuery = useQuery({
    queryKey: ["workers-nearby", accessToken, center[0], center[1], activeSkillId],
    queryFn: () =>
      getNearbyWorkersFn({
        data: {
          accessToken,
          lat: center[0],
          lng: center[1],
          skill: activeSkillId ?? undefined,
          radius: 5000,
        },
      }),
    enabled: authed && Boolean(accessToken),
    staleTime: 30_000,
  });

  const categories: SkillCategory[] = categoriesQuery.data?.data.items ?? [];
  const mapWorkers = useMemo(
    () => (nearbyQuery.data?.data.items ?? []).map(nearbyToMapWorker),
    [nearbyQuery.data],
  );
  const nearbyCount = nearbyQuery.data?.data.items.length ?? 0;
  const filteredCategories = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories.filter(
      (c) =>
        c.Name.toLowerCase().includes(q) ||
        (c.Description ?? "").toLowerCase().includes(q),
    );
  }, [categories, query]);

  return (
    <main className="md:h-[calc(100vh-73px)] md:flex md:overflow-hidden bg-[#ffffff]">
      <div className="md:w-[420px] lg:w-[480px] md:shrink-0 md:border-r border-ink/10 md:overflow-y-auto bg-[#e8ebe6] md:bg-[#ffffff] md:flex md:flex-col">
        <section className="bg-[#e8ebe6] px-5 pt-6 pb-4 md:bg-transparent md:pt-8">
          <div className="flex items-center justify-between md:hidden">
            <div>
              <p className="text-sm text-body">Halo, {name.split(" ")[0] || "kamu"} 👋</p>
              <p className="font-semibold flex items-center gap-1 mt-0.5">
                <MapPin size={14} /> Lokasi GPS aktif
              </p>
            </div>
            <Link
              to="/consumer/profile"
              className="size-10 rounded-full bg-[#ffffff] border border-ink/10 flex items-center justify-center font-display font-black"
            >
              {name[0] ?? "?"}
            </Link>
          </div>

          <h1 className="display-md mt-5 leading-tight md:mt-0">
            Cari jasa <span className="bg-[#9fe870] px-1.5 -mx-0.5 rounded-md">di sekitarmu.</span>
          </h1>

          <div className="mt-5 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
            <input
              id="consumer-home-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kategori jasa, mis: ledeng"
              className="text-input !pl-11 bg-[#ffffff] shadow-sm"
            />
          </div>
        </section>

        <section className="px-5 pt-2 pb-4">
          {categoriesQuery.isError && (
            <div className="mb-3 flex items-start gap-2 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-3 py-2 text-xs text-[#054d28]">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>
                Gagal memuat kategori.{" "}
                <button type="button" onClick={() => categoriesQuery.refetch()} className="underline font-semibold">
                  Coba lagi
                </button>
              </span>
            </div>
          )}
          {categoriesQuery.isLoading ? (
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 w-24 rounded-full bg-[#e8ebe6] animate-pulse shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 hide-scrollbar">
              <Chip active={activeSkillId === null} onClick={() => setActiveSkillId(null)} label="Semua" />
              {categories.map((s) => (
                <Chip
                  key={s.ID}
                  active={activeSkillId === s.ID}
                  onClick={() => setActiveSkillId((cur) => (cur === s.ID ? null : s.ID))}
                  label={`${skillEmoji(s.Name)} ${s.Name}`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="px-5 pt-2 md:hidden">
          <Suspense fallback={<div className="rounded-[24px] bg-[#ffffff] border border-ink/10 h-[260px] animate-pulse" />}>
            <NearbyMap center={center} workers={mapWorkers} height="260px" radiusKm={5} />
          </Suspense>
          <p className="text-xs text-mute mt-2 text-center">
            {nearbyQuery.isLoading
              ? "Memuat pekerja terdekat…"
              : nearbyCount > 0
                ? `${nearbyCount} pekerja online dalam radius 5 km`
                : "Belum ada pekerja online di sekitar — pilih kategori untuk memesan"}
          </p>
        </section>

        <section className="px-5 pt-6 pb-8 md:flex-1 md:bg-[#e8ebe6]/50 md:border-t border-ink/5">
          <div className="flex items-baseline justify-between sticky top-0 bg-[#e8ebe6]/80 backdrop-blur-md py-2 z-10 md:bg-transparent md:backdrop-blur-none md:static">
            <h2 className="font-display font-black text-xl">Pesan jasa</h2>
            <Link
              to="/consumer/services"
              className="text-sm font-semibold inline-flex items-center text-ink hover:text-ink-deep transition-colors"
            >
              Lihat semua <ChevronRight size={14} />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {categoriesQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-[24px] bg-[#ffffff] p-6 h-24 animate-pulse" />
              ))
            ) : filteredCategories.length === 0 ? (
              <div className="rounded-[24px] bg-[#ffffff] px-6 py-12 text-center text-sm text-mute border border-ink/5">
                <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                {categories.length === 0
                  ? "Belum ada kategori jasa dari server."
                  : "Tidak ada kategori cocok dengan pencarian."}
              </div>
            ) : (
              filteredCategories
                .filter((s) => activeSkillId === null || s.ID === activeSkillId)
                .map((s) => (
                  <Link
                    key={s.ID}
                    id={`consumer-home-skill-${s.ID}`}
                    to="/consumer/worker/$id"
                    params={{ id: String(s.ID) }}
                    className="rounded-[24px] bg-[#ffffff] p-5 flex items-center gap-4 hover:shadow-sm transition-shadow border border-ink/5"
                  >
                    <div className="size-14 rounded-full bg-[#e2f6d5] flex items-center justify-center text-2xl shrink-0">
                      {skillEmoji(s.Name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-black text-base">{s.Name}</h3>
                      <p className="text-sm text-body mt-0.5 line-clamp-2">{s.Description ?? "—"}</p>
                    </div>
                    <ChevronRight size={18} className="text-mute shrink-0" />
                  </Link>
                ))
            )}
          </div>

          {nearbyQuery.isError && (
            <div className="mt-6 flex items-start gap-2 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-3 py-2 text-xs text-[#054d28]">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>
                Gagal memuat pekerja di peta.{" "}
                <button type="button" onClick={() => nearbyQuery.refetch()} className="underline font-semibold">
                  Coba lagi
                </button>
              </span>
            </div>
          )}
        </section>
      </div>

      <div className="hidden md:block flex-1 relative bg-[#e8ebe6]">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-[#e8ebe6]" />}>
          <NearbyMap center={center} workers={mapWorkers} height="100%" radiusKm={5} />
        </Suspense>
        <div className="absolute top-6 left-6 z-[400] bg-[#ffffff]/90 backdrop-blur-md px-4 py-3 rounded-[24px] border border-ink/10 shadow-sm flex items-center gap-3">
          <div className="size-8 rounded-full bg-[#e2f6d5] text-[#163300] flex items-center justify-center">
            <MapPin size={16} />
          </div>
          <div>
            <div className="text-xs text-mute font-semibold uppercase tracking-wider">Radius 5 km</div>
            <div className="font-display font-black text-sm">
              {nearbyQuery.isLoading
                ? "Memuat pekerja…"
                : nearbyCount > 0
                  ? `${nearbyCount} pekerja online`
                  : "Pilih kategori untuk memesan"}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
        active ? "bg-ink text-[#ffffff] border-ink" : "bg-[#ffffff] text-ink border-ink/15 hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}
