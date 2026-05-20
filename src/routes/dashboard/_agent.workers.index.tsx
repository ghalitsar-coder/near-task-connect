import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, UserPlus, MapPin, Star } from "lucide-react";
import { useWorkersStore } from "@/stores/useWorkersStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkerStatusBadge } from "@/components/workers/WorkerStatusBadge";
import { SKILL_LABEL, STATUS_LABEL, type WorkerStatus } from "@/types/worker";
import { formatIDR, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_agent/workers/")({
  head: () => ({ meta: [{ title: "Pekerja — KerjaDekat Agen" }] }),
  component: WorkersPage,
});

const STATUSES: (WorkerStatus | "all")[] = [
  "all",
  "active",
  "pending_verification",
  "suspended",
  "rejected",
];

function WorkersPage() {
  const workers = useWorkersStore((s) => s.workers);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<WorkerStatus | "all">("all");

  const filtered = workers.filter((w) => {
    if (status !== "all" && w.status !== status) return false;
    if (q) {
      const s = q.toLowerCase();
      return (
        w.fullName.toLowerCase().includes(s) ||
        w.nik.includes(s) ||
        w.id.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex-1 flex items-center gap-2 rounded-xl border bg-background px-3 h-11">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, NIK, atau ID pekerja…"
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
              {s === "all" ? "Semua" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <Link to={"/workers/new" as string}>
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
                <th>NIK</th>
                <th>Skill</th>
                <th>Rating</th>
                <th>Order</th>
                <th>Pendapatan/Bln</th>
                <th>Daftar</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr
                  key={w.id}
                  className="border-t hover:bg-accent/40 transition"
                >
                  <td className="py-3 px-5">
                    <Link
                      to={"/workers/$workerId" as string}
                      params={{ workerId: w.id }}
                      className="flex items-center gap-3 group"
                    >
                      <div className="h-9 w-9 rounded-full bg-accent grid place-items-center font-semibold text-sm">
                        {w.fullName[0]}
                      </div>
                      <div>
                        <div className="font-semibold group-hover:underline">
                          {w.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> RT {w.rt}/RW {w.rw}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="text-xs font-mono">{w.nik}</td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {w.skills.map((s) => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className="rounded-full text-[10px]"
                        >
                          {SKILL_LABEL[s]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      {w.rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="font-semibold">{w.completedJobs}</td>
                  <td className="font-semibold">
                    {w.earningsThisMonth > 0
                      ? formatIDR(w.earningsThisMonth)
                      : "—"}
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {formatDate(w.registeredAt)}
                  </td>
                  <td>
                    <WorkerStatusBadge status={w.status} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Tidak ada pekerja sesuai filter.
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
