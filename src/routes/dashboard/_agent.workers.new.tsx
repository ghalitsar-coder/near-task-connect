import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  CreditCard,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ocrSamples } from "@/mocks/ocrSamples";
import { useWorkersStore } from "@/stores/useWorkersStore";
import { SKILL_LABEL, type WorkerSkill } from "@/types/worker";
import { toast } from "sonner";

export const Route = createFileRoute("/_agent/workers/new")({
  head: () => ({ meta: [{ title: "Registrasi Pekerja — KerjaDekat" }] }),
  component: NewWorkerPage,
});

type OcrResult = (typeof ocrSamples)[number] | null;

function NewWorkerPage() {
  const navigate = useNavigate();
  const addWorker = useWorkersStore((s) => s.addWorker);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [ocr, setOcr] = useState<OcrResult>(null);
  const [scanning, setScanning] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);

  const form = useForm({
    defaultValues: {
      fullName: "",
      nik: "",
      phone: "",
      gender: "L" as "L" | "P",
      birthPlace: "",
      birthDate: "",
      address: "",
      rt: "",
      rw: "",
      skills: [] as WorkerSkill[],
    },
    onSubmit: async ({ value }) => {
      const id = `WRK-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      addWorker({
        id,
        ...value,
        kelurahan: "Tegalrejo",
        ktpImageUrl: "",
        faceImageUrl: "",
        ocr: {
          confidence: ocr?.confidence ?? 0.9,
          extracted: ocr?.extracted ?? {
            nik: value.nik,
            name: value.fullName.toUpperCase(),
            birthDate: value.birthDate,
            address: value.address.toUpperCase(),
          },
          mismatchFields: ocr?.mismatchFields ?? [],
        },
        liveness: { passed: true, score: 0.92 },
        status: "pending_verification",
        registeredAt: new Date().toISOString(),
        geo: {
          lat: -7.7705 + (Math.random() - 0.5) * 0.02,
          lng: 110.358 + (Math.random() - 0.5) * 0.02,
          lastSeenAt: new Date().toISOString(),
        },
        rating: 0,
        completedJobs: 0,
        earningsThisMonth: 0,
      });
      toast.success("Pekerja berhasil didaftarkan");
      navigate({ to: "/workers" });
    },
  });

  const simulateScan = (sample: OcrResult) => {
    setScanning(true);
    setTimeout(() => {
      setOcr(sample);
      if (sample) {
        form.setFieldValue("nik", sample.extracted.nik);
        form.setFieldValue("fullName", sample.extracted.name);
      }
      setScanning(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Stepper step={step} />

      {step === 1 && (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold">Upload KTP & Scan OCR</h2>
            <p className="text-sm text-muted-foreground">
              Pilih salah satu sampel untuk mensimulasikan hasil OCR dari
              backend.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {ocrSamples.map((s) => (
              <button
                key={s.label}
                onClick={() => simulateScan(s)}
                className="rounded-xl border bg-canvas-soft p-4 text-left hover:border-primary transition group"
              >
                <CreditCard className="h-5 w-5 mb-3 text-muted-foreground group-hover:text-primary" />
                <div className="font-semibold text-sm">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Confidence {Math.round(s.confidence * 100)}%
                </div>
              </button>
            ))}
          </div>

          {scanning && (
            <div className="rounded-xl border bg-canvas-soft p-6 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <div className="font-semibold text-sm">Memindai KTP…</div>
                <div className="text-xs text-muted-foreground">
                  Mengekstrak NIK, nama, dan alamat
                </div>
              </div>
            </div>
          )}

          {ocr && !scanning && (
            <div className="rounded-xl border bg-canvas-soft p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-primary" />
                  <span className="font-bold">Hasil OCR</span>
                </div>
                <Badge
                  variant="outline"
                  className={`rounded-full ${ocr.confidence >= 0.9 ? "border-success/40 text-success bg-success/10" : ocr.confidence >= 0.75 ? "border-warning/40 bg-warning/15" : "border-destructive/40 text-destructive bg-destructive/10"}`}
                >
                  {Math.round(ocr.confidence * 100)}%
                </Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <Field label="NIK" value={ocr.extracted.nik} />
                <Field label="Nama" value={ocr.extracted.name} />
                <Field label="Tgl Lahir" value={ocr.extracted.birthDate} />
                <Field
                  label="Alamat"
                  value={ocr.extracted.address}
                  warn={ocr.mismatchFields.includes("address")}
                />
              </div>
              {ocr.mismatchFields.length > 0 && (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-2.5 flex gap-2 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Verifikasi manual diperlukan: {ocr.mismatchFields.join(", ")}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!ocr}
              className="rounded-xl h-11 font-semibold"
            >
              Lanjut <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold">Foto Wajah (Liveness)</h2>
            <p className="text-sm text-muted-foreground">
              Ambil foto pekerja untuk dicocokkan dengan KTP.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setFaceCaptured(true);
                toast.success("Foto wajah berhasil diambil");
              }}
              className={`aspect-square rounded-2xl border-2 border-dashed grid place-items-center transition ${faceCaptured ? "border-success bg-success/5" : "border-border bg-canvas-soft hover:border-primary"}`}
            >
              {faceCaptured ? (
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
                  <div className="mt-2 font-semibold">Foto Tersimpan</div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-2" />
                  <div className="font-semibold">Ambil Foto</div>
                  <div className="text-xs">Tap untuk simulasi</div>
                </div>
              )}
            </button>
            <div className="rounded-2xl bg-canvas-soft p-5 text-sm space-y-2">
              <div className="font-semibold">Tips:</div>
              <ul className="space-y-1 text-muted-foreground list-disc pl-4">
                <li>Pastikan wajah terlihat jelas, tidak buram.</li>
                <li>Tidak memakai masker atau kacamata gelap.</li>
                <li>Cahaya cukup, hindari backlight.</li>
                <li>Liveness check akan otomatis dijalankan.</li>
              </ul>
              {faceCaptured && (
                <div className="rounded-lg bg-success/10 text-success p-2 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Liveness 92% — Lulus
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              className="rounded-xl"
            >
              Kembali
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!faceCaptured}
              className="rounded-xl h-11 font-semibold"
            >
              Lanjut <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="rounded-2xl border bg-card p-6 space-y-5"
        >
          <div>
            <h2 className="text-xl font-bold">Data Pekerja</h2>
            <p className="text-sm text-muted-foreground">
              Tinjau dan lengkapi data sebelum disimpan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <form.Field name="fullName">
              {(f) => (
                <FieldInput
                  label="Nama Lengkap"
                  value={f.state.value}
                  onChange={f.handleChange}
                />
              )}
            </form.Field>
            <form.Field name="nik">
              {(f) => (
                <FieldInput
                  label="NIK (16 digit)"
                  value={f.state.value}
                  onChange={f.handleChange}
                />
              )}
            </form.Field>
            <form.Field name="phone">
              {(f) => (
                <FieldInput
                  label="Nomor HP"
                  placeholder="+62 812-…"
                  value={f.state.value}
                  onChange={f.handleChange}
                />
              )}
            </form.Field>
            <form.Field name="birthPlace">
              {(f) => (
                <FieldInput
                  label="Tempat Lahir"
                  value={f.state.value}
                  onChange={f.handleChange}
                />
              )}
            </form.Field>
            <form.Field name="birthDate">
              {(f) => (
                <FieldInput
                  label="Tanggal Lahir"
                  type="date"
                  value={f.state.value}
                  onChange={f.handleChange}
                />
              )}
            </form.Field>
            <div>
              <Label className="mb-2 block">Jenis Kelamin</Label>
              <form.Field name="gender">
                {(f) => (
                  <div className="flex gap-2">
                    {(["L", "P"] as const).map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => f.handleChange(g)}
                        className={`flex-1 rounded-xl border h-11 font-semibold text-sm ${f.state.value === g ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
                      >
                        {g === "L" ? "Laki-laki" : "Perempuan"}
                      </button>
                    ))}
                  </div>
                )}
              </form.Field>
            </div>
            <form.Field name="address">
              {(f) => (
                <div className="sm:col-span-2">
                  <FieldInput
                    label="Alamat"
                    value={f.state.value}
                    onChange={f.handleChange}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="rt">
              {(f) => (
                <FieldInput
                  label="RT"
                  value={f.state.value}
                  onChange={f.handleChange}
                />
              )}
            </form.Field>
            <form.Field name="rw">
              {(f) => (
                <FieldInput
                  label="RW"
                  value={f.state.value}
                  onChange={f.handleChange}
                />
              )}
            </form.Field>
          </div>

          <div>
            <Label className="mb-2 block">Skill</Label>
            <form.Field name="skills">
              {(f) => (
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SKILL_LABEL) as WorkerSkill[]).map((s) => {
                    const checked = f.state.value.includes(s);
                    return (
                      <label
                        key={s}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm cursor-pointer transition ${checked ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const next = v
                              ? [...f.state.value, s]
                              : f.state.value.filter((x) => x !== s);
                            f.handleChange(next);
                          }}
                          className="h-3.5 w-3.5"
                        />
                        {SKILL_LABEL[s]}
                      </label>
                    );
                  })}
                </div>
              )}
            </form.Field>
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(2)}
              className="rounded-xl"
            >
              Kembali
            </Button>
            <Button type="submit" className="rounded-xl h-11 font-semibold">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Simpan Pekerja
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function ShieldCheck(props: { className?: string }) {
  // small inline to avoid extra import
  return <CheckCircle2 {...props} />;
}

function Stepper({ step }: { step: number }) {
  const items = [
    { n: 1, label: "Scan KTP" },
    { n: 2, label: "Foto Wajah" },
    { n: 3, label: "Data Pekerja" },
  ];
  return (
    <div className="flex items-center gap-2">
      {items.map((it, i) => (
        <div key={it.n} className="flex items-center gap-2 flex-1">
          <div
            className={`h-9 w-9 rounded-full grid place-items-center font-bold text-sm ${
              step >= it.n
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {it.n}
          </div>
          <div
            className={`text-sm font-semibold ${step >= it.n ? "text-foreground" : "text-muted-foreground"}`}
          >
            {it.label}
          </div>
          {i < items.length - 1 && (
            <div
              className={`flex-1 h-0.5 ${step > it.n ? "bg-primary" : "bg-border"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
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
      className={`rounded-lg p-2 ${warn ? "bg-warning/10 border border-warning/30" : "bg-background"}`}
    >
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-xs truncate">{value}</div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl"
      />
    </div>
  );
}
