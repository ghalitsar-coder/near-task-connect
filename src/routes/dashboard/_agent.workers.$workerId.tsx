import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Ban,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useWorkersStore } from "@/stores/useWorkersStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkerStatusBadge } from "@/components/workers/WorkerStatusBadge";
import { SKILL_LABEL } from "@/types/worker";
import { formatIDR, formatDate, formatDateTime } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_agent/workers/$workerId")({
  head: () => ({ meta: [{ title: "Detail Pekerja — KerjaDekat" }] }),
  component: WorkerDetailPage,
});

function WorkerDetailPage() {
  const { workerId } = useParams({ from: "/_agent/workers/$workerId" });
  const worker = useWorkersStore((s) =>
    s.workers.find((w) => w.id === workerId),
  );
  const setStatus = useWorkersStore((s) => s.setStatus);

  if (!worker) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Pekerja tidak ditemukan.</p>
        <Link to={"/workers" as string}>
          <Button variant="outline" className="mt-4 rounded-xl">
            Kembali
          </Button>
        </Link>
      </div>
    );
  }

  const confidence = Math.round(worker.ocr.confidence * 100);
  const confTone =
    confidence >= 90 ? "success" : confidence >= 75 ? "warning" : "destructive";

  const act = (s: typeof worker.status, msg: string) => {
    setStatus(worker.id, s);
    toast.success(msg);
  };

  return (
    <div className="space-y-6">
      <Link
        to={"/workers" as string}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-start gap-5">
              <div className="h-20 w-20 rounded-2xl bg-accent grid place-items-center text-3xl font-black">
                {worker.fullName[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">
                      {worker.fullName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {worker.id} ·{" "}
                      {worker.gender === "L" ? "Laki-laki" : "Perempuan"}
                    </p>
                  </div>
                  <WorkerStatusBadge status={worker.status} />
                </div>
                <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                  <InfoRow icon={Fingerprint} label="NIK" value={worker.nik} />
                  <InfoRow icon={Phone} label="Telepon" value={worker.phone} />
                  <InfoRow
                    icon={Calendar}
                    label="TTL"
                    value={`${worker.birthPlace}, ${formatDate(worker.birthDate)}`}
                  />
                  <InfoRow
                    icon={MapPin}
                    label="Alamat"
                    value={`${worker.address}, RT ${worker.rt}/RW ${worker.rw}, Kel. ${worker.kelurahan}`}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {worker.skills.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="rounded-full"
                    >
                      {SKILL_LABEL[s]}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-bold text-lg">Hasil OCR KTP</h2>
            <p className="text-xs text-muted-foreground">
              Simulasi backend OCR + face match
            </p>

            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-canvas-soft p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Confidence OCR
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{confidence}%</span>
                  <Badge
                    variant="outline"
                    className={`rounded-full ${
                      confTone === "success"
                        ? "border-success/40 text-success bg-success/10"
                        : confTone === "warning"
                          ? "border-warning/40 bg-warning/15"
                          : "border-destructive/40 text-destructive bg-destructive/10"
                    }`}
                  >
                    {confTone === "success"
                      ? "Tinggi"
                      : confTone === "warning"
                        ? "Sedang"
                        : "Rendah"}
                  </Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-background overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-canvas-soft p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Liveness Face Match
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">
                    {Math.round(worker.liveness.score * 100)}%
                  </span>
                  {worker.liveness.passed ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-success/40 text-success bg-success/10"
                    >
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Lulus
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full border-destructive/40 text-destructive bg-destructive/10"
                    >
                      Gagal
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {worker.ocr.mismatchFields.length > 0 && (
              <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-3 flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Perlu verifikasi manual.</strong> Field tidak cocok:{" "}
                  {worker.ocr.mismatchFields.join(", ")}.
                </div>
              </div>
            )}

            <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
              <ExtractedRow label="NIK" value={worker.ocr.extracted.nik} />
              <ExtractedRow label="Nama" value={worker.ocr.extracted.name} />
              <ExtractedRow
                label="Tgl Lahir"
                value={worker.ocr.extracted.birthDate}
              />
              <ExtractedRow
                label="Alamat"
                value={worker.ocr.extracted.address}
                warn={worker.ocr.mismatchFields.includes("address")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-bold mb-3">Aksi Verifikasi</h3>
            <div className="space-y-2">
              <Button
                className="w-full rounded-xl h-11 font-semibold"
                disabled={worker.status === "active"}
                onClick={() => act("active", "Pekerja diaktifkan")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Aktifkan
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl h-11 font-semibold"
                disabled={worker.status === "suspended"}
                onClick={() => act("suspended", "Pekerja ditangguhkan")}
              >
                <Ban className="h-4 w-4 mr-2" /> Tangguhkan
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-xl h-11 font-semibold"
                onClick={() =>
                  act("pending_verification", "Status direset ke pending")
                }
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Reset ke Pending
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 space-y-3 text-sm">
            <h3 className="font-bold">Statistik</h3>
            <Stat label="Total Order Selesai" value={worker.completedJobs} />
            <Stat
              label="Rating Pelanggan"
              value={`${worker.rating.toFixed(1)} / 5.0`}
            />
            <Stat
              label="Pendapatan Bulan Ini"
              value={formatIDR(worker.earningsThisMonth)}
            />
            <Stat label="Tanggal Daftar" value={formatDate(worker.registeredAt)} />
            {worker.verifiedAt && (
              <Stat
                label="Diverifikasi"
                value={formatDateTime(worker.verifiedAt)}
              />
            )}
            <Stat
              label="Lokasi Terakhir"
              value={formatDateTime(worker.geo.lastSeenAt)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function ExtractedRow({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-2 ${warn ? "bg-warning/10 border border-warning/30" : "bg-canvas-soft"}`}
    >
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-xs">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
