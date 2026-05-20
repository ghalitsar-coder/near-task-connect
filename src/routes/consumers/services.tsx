import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { getConsumerSkillCategoriesFn, getNearbyWorkersFn } from "@/lib/consumer.server";
import { skillEmoji } from "@/lib/orderLabels";
import { DEFAULT_LAT, DEFAULT_LNG, readUserPosition } from "@/lib/geo";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/consumers/services")({
  head: () => ({ meta: [{ title: "Kategori Jasa · KerjaDekat" }] }),
  component: ServicesPage,
});

function ServicesPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);
  const [center, setCenter] = useState<[number, number]>([DEFAULT_LAT, DEFAULT_LNG]);

  useEffect(() => {
    readUserPosition().then(({ lat, lng }) => setCenter([lat, lng]));
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["consumer-skill-categories", accessToken],
    queryFn: () => getConsumerSkillCategoriesFn({ data: { accessToken } }),
    enabled: authed && Boolean(accessToken),
    staleTime: 300_000,
  });

  const categories = data?.data.items ?? [];

  const nearbyQuery = useQuery({
    queryKey: ["workers-nearby-services", accessToken, center[0], center[1]],
    queryFn: () =>
      getNearbyWorkersFn({
        data: { accessToken, lat: center[0], lng: center[1], radius: 5000 },
      }),
    enabled: authed && Boolean(accessToken),
    staleTime: 30_000,
  });

  const onlineBySkill = useMemo(() => {
    const counts = new Map<number, number>();
    for (const w of nearbyQuery.data?.data.items ?? []) {
      for (const s of w.skills) {
        counts.set(s.id, (counts.get(s.id) ?? 0) + 1);
      }
    }
    return counts;
  }, [nearbyQuery.data]);

  return (
    <main className="px-5 pt-6 pb-20">
      <h1 className="display-md">Kategori jasa</h1>
      <p className="text-body mt-1">Pilih kategori untuk membuat pesanan.</p>

      {isError && (
        <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-4 py-3 text-sm text-[#054d28]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            Gagal memuat kategori.{" "}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">
              Coba lagi
            </button>
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-[24px] bg-[#ffffff] p-6 h-40 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="mt-8 rounded-[24px] bg-[#ffffff] px-6 py-16 text-center text-sm text-mute">
          Tidak ada kategori jasa tersedia.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {categories.map((s) => (
            <Link
              key={s.ID}
              id={`consumer-services-skill-${s.ID}`}
              to="/consumers/worker/$id"
              params={{ id: String(s.ID) }}
              className="rounded-[24px] bg-[#ffffff] p-6 flex flex-col gap-2 border border-ink/5 hover:shadow-sm transition-shadow"
            >
              <div className="text-4xl">{skillEmoji(s.Name)}</div>
              <div className="font-display font-black">{s.Name}</div>
              <div className="text-xs text-body line-clamp-2">{s.Description ?? "—"}</div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <span className="text-xs text-mute">Biaya admin Rp2.000</span>
                <span className="text-xs text-mute">
                  Pekerja online:{" "}
                  {nearbyQuery.isLoading
                    ? "…"
                    : (onlineBySkill.get(s.ID) ?? 0) > 0
                      ? onlineBySkill.get(s.ID)
                      : "0"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
