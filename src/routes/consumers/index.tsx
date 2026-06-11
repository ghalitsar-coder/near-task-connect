import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ChevronRight, AlertCircle, Loader2, Users, LogOut, User as UserIcon, Sparkles, ArrowRight } from "lucide-react";
import { getConsumerSkillCategoriesFn, getNearbyWorkersFn } from "@/lib/consumer.server";
import { mapDescriptionToSkillFn } from "@/lib/nlp.server";
import { skillEmoji } from "@/lib/orderLabels";
import { DEFAULT_LAT, DEFAULT_LNG, readUserPosition } from "@/lib/geo";
import { nearbyToMapWorker } from "@/lib/workerMapUtils";
import type { SkillCategory } from "@/lib/api/types";
import { useSessionStore } from "@/stores/useSessionStore";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/use-auth";

const NearbyMap = lazy(() =>
  import("@/components/map/NearbyMap").then((m) => ({ default: m.NearbyMap }))
);
const MapcnNearbyMap = lazy(() =>
  import("@/components/map/MapcnNearbyMap").then((m) => ({ default: m.MapcnNearbyMap }))
);

export const Route = createFileRoute("/consumers/")({
  head: () => ({ meta: [{ title: "Beranda · KerjaDekat" }] }),
  component: ConsumerHome,
});

function ConsumerHome() {
  const name = useSessionStore((s) => s.name);
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);
  const [activeSkillId, setActiveSkillId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [showAiSearch, setShowAiSearch] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ skill_id: number | null; reasoning: string } | null>(null);
  const [center, setCenter] = useState<[number, number]>([DEFAULT_LAT, DEFAULT_LNG]);
  const [mapMode, setMapMode] = useState<"leaflet" | "mapcn">("leaflet");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const signOut = useSessionStore((s) => s.signOut);
  const logoutMutation = useLogout();
  
  const handleLogout = () => {
    signOut();
    logoutMutation.mutate();
  };

  const handleAiAnalyze = async () => {
    if (!aiDescription.trim()) return;
    setIsAiLoading(true);
    setAiResult(null);
    try {
      const categoriesForAi = categories.map(c => ({ id: c.ID, name: c.Name }));
      const res = await mapDescriptionToSkillFn({
        data: { description: aiDescription, categories: categoriesForAi }
      });
      if (res.ok && res.data) {
        setAiResult(res.data);
        if (res.data.skill_id) {
          setActiveSkillId(res.data.skill_id);
          // Scroll to the categories section
          document.getElementById(`consumer-home-skill-${res.data.skill_id}`)?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setIsAiLoading(false);
    }
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="size-10 rounded-full bg-[#ffffff] border border-ink/10 flex items-center justify-center font-display font-black hover:bg-ink/5 transition-colors"
                >
                  {name[0] ?? "?"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#ffffff]">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/consumers/profile" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-[#d03238] cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <button
              onClick={() => setShowAiSearch(!showAiSearch)}
              className={cn("absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-colors border shadow-[0_1px_2px_rgba(0,0,0,0.01)]", showAiSearch ? "bg-[#d6b6f6] text-[#391c57] border-[#d6b6f6]" : "bg-[#ffffff] text-[#31302e] border-[#e6e6e6] hover:bg-[#f6f5f4]")}
            >
              <Sparkles size={14} />
              Tanya AI
            </button>
          </div>

          {showAiSearch && (
            <div className="mt-4 bg-[#ffffff] rounded-[12px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.01),0_2px_8px_rgba(0,0,0,0.02)] border border-[#e6e6e6] animate-in slide-in-from-top-2 fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-8 rounded-full bg-[#d6b6f6] flex items-center justify-center text-[#391c57] shrink-0">
                  <Sparkles size={16} />
                </div>
                <span className="text-[20px] font-semibold text-[#000000] tracking-[-0.125px]">Pencarian Pintar</span>
              </div>
              <textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="Ceritakan kebutuhanmu, misal: 'Keran air di dapur bocor parah'"
                className="w-full bg-[#ffffff] border border-[#e6e6e6] rounded-[4px] p-3 text-[15px] text-[#000000] placeholder:text-[#a39e98] focus:outline-none focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] resize-none h-20 transition-shadow"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleAiAnalyze}
                  disabled={isAiLoading || !aiDescription.trim()}
                  className="bg-[#0075de] text-[#ffffff] px-5 py-2 rounded-full text-[16px] font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-[#005bab] transition-colors shadow-sm"
                >
                  {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Cari Jasa
                </button>
              </div>
              
              {aiResult && (
                <div className="mt-5 p-4 rounded-[12px] border border-[#e6e6e6] bg-[#ffffff] shadow-[0_1px_2px_rgba(0,0,0,0.01),0_4px_18px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5 size-5 rounded-full flex items-center justify-center text-[#ffffff] shrink-0", aiResult.skill_id ? "bg-[#1aae39]" : "bg-[#dd5b00]")}>
                      <Sparkles size={12} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] text-[#31302e] leading-[1.5]">
                        {aiResult.reasoning}
                      </p>
                      {aiResult.skill_id ? (
                        <div className="mt-4 flex items-center justify-between border-t border-[#e6e6e6] pt-3">
                          <span className="text-[14px] font-semibold text-[#000000]">
                            Kategori: {categories.find(c => c.ID === aiResult.skill_id)?.Name}
                          </span>
                          <Link
                            to="/consumers/worker/$id"
                            params={{ id: String(aiResult.skill_id) }}
                            className="bg-[#ffffff] text-[#000000] border border-[#e6e6e6] px-[14px] py-[4px] rounded-[8px] text-[16px] font-medium hover:bg-[#f6f5f4] transition-colors flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                          >
                            Pilih <ArrowRight size={14} />
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-3 text-[14px] text-[#615d59]">
                          Maaf, kami tidak dapat menemukan kategori yang cocok.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
          <div className="flex items-center justify-center">
            <div className="inline-flex rounded-full border border-ink/10 bg-[#ffffff] p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMapMode("leaflet")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  mapMode === "leaflet"
                    ? "bg-ink text-[#ffffff]"
                    : "text-ink hover:bg-ink/5"
                }`}
              >
                OpenStreet
              </button>
              <button
                type="button"
                onClick={() => setMapMode("mapcn")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  mapMode === "mapcn"
                    ? "bg-ink text-[#ffffff]"
                    : "text-ink hover:bg-ink/5"
                }`}
              >
                MapCN
              </button>
            </div>
          </div>
          <Suspense fallback={<div className="rounded-[24px] bg-[#ffffff] border border-ink/10 h-[260px] animate-pulse" />}>
            {mapMode === "mapcn" ? (
              <MapcnNearbyMap
                center={center}
                workers={mapWorkers}
                height="260px"
                selectedWorkerId={selectedWorkerId}
                onSelectWorker={setSelectedWorkerId}
              />
            ) : (
              <NearbyMap
                center={center}
                workers={mapWorkers}
                height="260px"
                radiusKm={5}
                selectedWorkerId={selectedWorkerId}
                onSelectWorker={setSelectedWorkerId}
                //  center={tegalrejoCenter}
     
              />
            )}
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
              to="/consumers/services"
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
                    to="/consumers/worker/$id"
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
        <div className="absolute top-6 right-6 z-[420] inline-flex rounded-full border border-ink/10 bg-[#ffffff] p-1 text-xs font-semibold shadow-sm">
          <button
            type="button"
            onClick={() => setMapMode("leaflet")}
            className={`px-3 py-1 rounded-full transition-colors ${
              mapMode === "leaflet" ? "bg-ink text-[#ffffff]" : "text-ink hover:bg-ink/5"
            }`}
          >
            OpenStreet
          </button>
          <button
            type="button"
            onClick={() => setMapMode("mapcn")}
            className={`px-3 py-1 rounded-full transition-colors ${
              mapMode === "mapcn" ? "bg-ink text-[#ffffff]" : "text-ink hover:bg-ink/5"
            }`}
          >
            MapCN
          </button>
        </div>
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-[#e8ebe6]" />}>
          {mapMode === "mapcn" ? (
            <MapcnNearbyMap
              center={center}
              workers={mapWorkers}
              height="100%"
              selectedWorkerId={selectedWorkerId}
              onSelectWorker={setSelectedWorkerId}
            />
          ) : (
            <NearbyMap
              center={center}
              workers={mapWorkers}
              height="100%"
              radiusKm={5}
              selectedWorkerId={selectedWorkerId}
              onSelectWorker={setSelectedWorkerId}
            />
          )}
        </Suspense>
        <div className={cn("absolute z-[400] bg-[#ffffff]/90 backdrop-blur-md px-4 py-3 rounded-[24px] border border-ink/10 shadow-sm flex items-center gap-3",mapMode === "mapcn" ? "right-6 bottom-10" : "top-6 left-6")}>
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
