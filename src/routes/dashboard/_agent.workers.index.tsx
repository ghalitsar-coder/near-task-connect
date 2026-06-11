import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, UserPlus, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkerStatusBadge } from "@/components/workers/WorkerStatusBadge";
import { STATUS_LABEL } from "@/types/worker";
import { formatDate } from "@/lib/format";
import { useSessionStore } from "@/stores/useSessionStore";
import { getAgentWorkersFn } from "@/lib/agent.server";
import { serviceBase } from "@/lib/api/config";
import type { AgentWorkerSummary } from "@/lib/api/types";

export const Route = createFileRoute("/dashboard/_agent/workers/")({
  head: () => ({ meta: [{ title: "Pekerja — KerjaDekat Agen" }] }),
  component: WorkersPage,
});

const STATUSES = ["all", "active", "pending_verification", "suspended", "rejected"] as const;

type WorkerStatus = (typeof STATUSES)[number];



type WorkerRow = {
  id: string;
  fullName: string;
  profilePhoto?: string | null;
  status: string;
  availability: string;
  kelurahan: string;
  rtRw?: string | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  verifiedAt?: string | null;
  skills: string[];
};

function workerPhotoUrl(key?: string | null): string {
  if (!key) return "";
  return `${serviceBase()}/files/photo?key=${encodeURIComponent(key)}`;
}

function mapWorkers(items: AgentWorkerSummary[]): WorkerRow[] {
  return items.map((w) => ({
    id: w.user_id,
    fullName: w.full_name,
    profilePhoto: w.profile_photo,
    status: w.status,
    availability: w.availability,
    kelurahan: w.kelurahan,
    rtRw: w.rt_rw ?? null,
    ratingAvg: w.rating_avg,
    ratingCount: w.rating_count,
    createdAt: w.created_at,
    verifiedAt: w.verified_at ?? null,
    skills: w.skills ?? [],
  }));
}

function WorkersPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<WorkerStatus>("all");

  const workersQuery = useQuery({
    queryKey: ["agent-workers", accessToken],
    queryFn: () => getAgentWorkersFn({ data: { accessToken } }),
    enabled: authed && Boolean(accessToken),
    staleTime: 60_000,
  });

  const workers = useMemo(() => mapWorkers(workersQuery.data?.data?.items ?? []), [workersQuery.data]);

  const filtered = workers.filter((w) => {
    if (status !== "all" && w.status !== status) return false;
    if (q) {
      const s = q.toLowerCase();
      return w.fullName.toLowerCase().includes(s) || w.id.toLowerCase().includes(s);
    }
    return true;
  });

  const loading = workersQuery.isLoading;
  const errorMsg = workersQuery.data?.ok === false ? workersQuery.data?.error : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex-1 flex items-center gap-2 rounded-xl border bg-background px-3 h-11">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau ID pekerja…"
            className="bg-transparent flex-1 outline-none text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
                status === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent"
              }`}
            >
              {s === "all" ? "Semua" : STATUS_LABEL[s as keyof typeof STATUS_LABEL]}
            </button>
          ))}
        </div>
        <Link to={"/dashboard/workers/new" as string}>
          <Button className="rounded-xl h-11 font-semibold">
            <UserPlus className="h-4 w-4 mr-2" />
            Pekerja Baru
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-bold">
            {filtered.length}{" "}
            <span className="text-muted-foreground font-normal">pekerja</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground bg-muted/50">
              <tr>
                <th className="py-3 px-5">Pekerja</th>
                <th>Kelurahan</th>
                <th>Skill</th>
                <th>Rating</th>
                <th>Terdaftar</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="border-t">
                    <td className="py-3 px-5">
                      <div className="h-9 w-40 rounded-full bg-muted animate-pulse" />
                    </td>
                    <td>
                      <div className="h-4 w-24 rounded-full bg-muted animate-pulse" />
                    </td>
                    <td>
                      <div className="h-4 w-28 rounded-full bg-muted animate-pulse" />
                    </td>
                    <td>
                      <div className="h-4 w-12 rounded-full bg-muted animate-pulse" />
                    </td>
                    <td>
                      <div className="h-4 w-16 rounded-full bg-muted animate-pulse" />
                    </td>
                    <td>
                      <div className="h-4 w-20 rounded-full bg-muted animate-pulse" />
                    </td>
                  </tr>
                ))}
              {!loading && errorMsg && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-destructive">
                    {errorMsg}
                  </td>
                </tr>
              )}
              {!loading && !errorMsg && filtered.map((w) => (
                <tr key={w.id} className="border-t hover:bg-accent/40 transition">
                  <td className="py-3 px-5">
                    <Link
                      to={"/dashboard/workers/$workerId" as string}
                      params={{ workerId: w.id }}
                      className="flex items-center gap-3 group"
                    >
                      {w.profilePhoto ? (
                        <img src={workerPhotoUrl(w.profilePhoto)} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-accent grid place-items-center font-semibold text-sm shrink-0">
                          {w.fullName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold group-hover:underline">
                          {w.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {w.rtRw ?? "-"}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="text-xs text-muted-foreground">{w.kelurahan}</td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {w.skills.length === 0 && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      {w.skills.map((s) => (
                        <Badge key={s} variant="secondary" className="rounded-full text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      {w.ratingAvg.toFixed(1)} ({w.ratingCount})
                    </span>
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {formatDate(w.createdAt)}
                  </td>
                  <td>
                    <WorkerStatusBadge status={w.status as any} />
                  </td>
                </tr>
              ))}
              {!loading && !errorMsg && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Belum ada pekerja di wilayah Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
