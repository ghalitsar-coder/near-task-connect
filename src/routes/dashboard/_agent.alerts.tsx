import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Clock } from "lucide-react";
import { useWorkersStore } from "@/stores/useWorkersStore";
import { relativeHours, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/_agent/alerts")({
  head: () => ({ meta: [{ title: "SLA Alerts — KerjaDekat" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const workers = useWorkersStore((s) => s.workers);
  const alerts = workers
    .filter((w) => w.status === "pending_verification")
    .map((w) => ({
      worker: w,
      ageHours: Math.round(
        (Date.now() - new Date(w.registeredAt).getTime()) / 3_600_000,
      ),
    }))
    .filter((a) => a.ageHours >= 8)
    .sort((a, b) => b.ageHours - a.ageHours);

  const critical = alerts.filter((a) => a.ageHours >= 24);
  const warning = alerts.filter((a) => a.ageHours < 24);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive grid place-items-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              {alerts.length} pekerja menunggu tindakan
            </h2>
            <p className="text-sm text-muted-foreground">
              {critical.length} kritis · {warning.length} peringatan. SLA
              verifikasi: 1×24 jam.
            </p>
          </div>
        </div>
      </div>

      {alerts.length === 0 && (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
          Tidak ada alert aktif. Bagus, semua dalam SLA.
        </div>
      )}

      <div className="space-y-3">
        {alerts.map(({ worker, ageHours }) => {
          const isCritical = ageHours >= 24;
          return (
            <div
              key={worker.id}
              className={`rounded-2xl border bg-card p-5 flex flex-wrap items-center gap-4 ${isCritical ? "border-destructive/40" : "border-warning/40"}`}
            >
              <div
                className={`h-11 w-11 rounded-xl grid place-items-center ${isCritical ? "bg-destructive/15 text-destructive" : "bg-warning/20"}`}
              >
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-bold">{worker.fullName}</div>
                  <span
                    className={`rounded-full text-[11px] font-semibold px-2 py-0.5 ${isCritical ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}
                  >
                    {isCritical ? "CRITICAL" : "WARNING"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {worker.id} · NIK {worker.nik} · daftar{" "}
                  {formatDateTime(worker.registeredAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black tracking-tight">
                  {ageHours}j
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {relativeHours(ageHours)}
                </div>
              </div>
              <Link to={"/dashboard/workers/$workerId" as string} params={{ workerId: worker.id }}>
                <Button className="rounded-xl font-semibold">Verifikasi</Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
