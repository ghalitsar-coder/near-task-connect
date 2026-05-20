import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useWorkersStore } from "@/stores/useWorkersStore";
import { WorkerStatusBadge } from "@/components/workers/WorkerStatusBadge";
import { Loader2, Users } from "lucide-react";

const TerritoryMap = lazy(() => import("@/components/territory/TerritoryMap"));

export const Route = createFileRoute("/_agent/territory")({
  head: () => ({ meta: [{ title: "Peta Teritori — KerjaDekat" }] }),
  component: TerritoryPage,
  ssr: false,
});

function TerritoryPage() {
  const workers = useWorkersStore((s) => s.workers);
  const active = workers.filter((w) => w.status === "active");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border bg-card overflow-hidden h-[70vh] min-h-[500px]">
        <Suspense
          fallback={
            <div className="h-full grid place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          }
        >
          <TerritoryMap workers={workers} />
        </Suspense>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-bold">Pekerja Online</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Simulasi Redis GEO — posisi terakhir dari device pekerja aktif.
          </p>
          <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {active.map((w) => (
              <div
                key={w.id}
                className="rounded-xl border bg-canvas-soft p-3 flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-full bg-accent grid place-items-center font-semibold text-sm">
                  {w.fullName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {w.fullName}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {w.geo.lat.toFixed(4)}, {w.geo.lng.toFixed(4)}
                  </div>
                </div>
                <WorkerStatusBadge status={w.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
