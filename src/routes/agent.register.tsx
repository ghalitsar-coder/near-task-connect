import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Loader2, CheckCircle2, Camera, IdCard } from "lucide-react";
import { WiseButton } from "@/components/brand/WiseButton";
import { mockServices } from "@/data/mockServices";
import { mockOcrResult } from "@/data/mockOcrResult";

export const Route = createFileRoute("/agent/register")({
  head: () => ({ meta: [{ title: "Daftarkan Pekerja · KerjaDekat" }] }),
  component: RegisterWorker,
});

type Step = "upload" | "scanning" | "review" | "skills" | "done";

function RegisterWorker() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("upload");
  const [hasKtp, setHasKtp] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [ocr, setOcr] = useState<typeof mockOcrResult | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedNik, setEditedNik] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [phone, setPhone] = useState("");

  const runOcr = () => {
    setStep("scanning");
    setTimeout(() => {
      setOcr(mockOcrResult);
      setEditedName(mockOcrResult.nama);
      setEditedNik(mockOcrResult.nik);
      setStep("review");
    }, 1800);
  };

  const toggleSkill = (slug: string) =>
    setSkills((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));

  return (
    <main className="p-5 lg:p-10 max-w-3xl">
      <Link to="/agent" className="text-sm font-semibold text-body inline-block">
        ← Kembali ke dasbor
      </Link>
      <h1 className="display-md mt-2">Daftarkan pekerja baru</h1>
      <p className="text-body mt-1">Lengkapi 3 langkah: scan KTP → review data → pilih keahlian.</p>

      {/* stepper */}
      <ol className="mt-6 flex items-center gap-2 text-xs font-semibold">
        {["Unggah KTP", "Review OCR", "Keahlian", "Selesai"].map((label, i) => {
          const order: Step[] = ["upload", "review", "skills", "done"];
          const idx = order.indexOf(step === "scanning" ? "upload" : step);
          const active = i === idx;
          const done = i < idx;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`size-7 rounded-full inline-flex items-center justify-center text-xs ${
                  done ? "bg-positive text-canvas" : active ? "bg-ink text-canvas" : "bg-canvas-soft text-mute"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={active ? "text-ink" : done ? "text-body" : "text-mute"}>{label}</span>
              {i < 3 && <span className="w-6 h-px bg-ink/10 mx-1" />}
            </li>
          );
        })}
      </ol>

      {/* Step 1 — upload */}
      {step === "upload" && (
        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <UploadTile
            icon={<IdCard size={28} />}
            title="Foto KTP"
            desc="Pastikan terbaca jelas, tidak silau."
            done={hasKtp}
            onPick={() => setHasKtp(true)}
          />
          <UploadTile
            icon={<Camera size={28} />}
            title="Foto wajah pekerja"
            desc="Selfie pekerja, latar polos."
            done={hasFace}
            onPick={() => setHasFace(true)}
          />
          <div className="sm:col-span-2">
            <WiseButton full disabled={!hasKtp || !hasFace} onClick={runOcr}>
              <Upload size={16} /> Jalankan OCR KTP
            </WiseButton>
          </div>
        </section>
      )}

      {/* Step 2 — scanning */}
      {step === "scanning" && (
        <div className="card-content mt-6 text-center">
          <Loader2 size={42} className="mx-auto animate-spin" />
          <div className="font-display font-black mt-3">Membaca KTP…</div>
          <p className="text-sm text-body">Mengekstrak NIK & nama dari foto.</p>
        </div>
      )}

      {/* Step 3 — review */}
      {step === "review" && ocr && (
        <section className="mt-6 grid lg:grid-cols-2 gap-4">
          <div className="card-content">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-positive-deep">
              <CheckCircle2 size={14} /> Hasil OCR — periksa & koreksi bila perlu
            </div>
            <div className="mt-3 space-y-3">
              <Field label="Nama lengkap" value={editedName} onChange={setEditedName} />
              <Field label="NIK" value={editedNik} onChange={setEditedNik} mono />
              <Field label="No. handphone" value={phone} onChange={setPhone} placeholder="8123456789" />
            </div>
          </div>

          <div className="card-sage text-sm">
            <div className="text-xs uppercase tracking-wide text-mute font-semibold">Field tidak diedit</div>
            <ul className="mt-2 divide-y divide-ink/10">
              {[
                ["Tempat / Tgl lahir", `${ocr.tempatLahir}, ${ocr.tanggalLahir}`],
                ["Jenis kelamin", ocr.jenisKelamin],
                ["Alamat", `${ocr.alamat} RT ${ocr.rtRw}`],
                ["Kelurahan", ocr.kelurahan],
                ["Kecamatan", ocr.kecamatan],
                ["Kota", ocr.kota],
                ["Agama", ocr.agama],
                ["Status", ocr.statusPerkawinan],
                ["Pekerjaan", ocr.pekerjaan],
              ].map(([k, v]) => (
                <li key={k} className="py-2 flex justify-between gap-3 text-sm">
                  <span className="text-mute">{k}</span>
                  <span className="font-semibold text-right">{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 flex justify-end gap-2">
            <button onClick={() => setStep("upload")} className="btn-tertiary">Kembali</button>
            <WiseButton onClick={() => setStep("skills")} disabled={!editedName || editedNik.length < 16}>
              Lanjut ke keahlian
            </WiseButton>
          </div>
        </section>
      )}

      {/* Step 4 — skills */}
      {step === "skills" && (
        <section className="mt-6">
          <div className="card-content">
            <h2 className="font-display font-black">Pilih keahlian</h2>
            <p className="text-sm text-body">Pilih satu atau lebih kategori yang dikuasai.</p>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {mockServices.map((s) => {
                const active = skills.includes(s.slug);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSkill(s.slug)}
                    className={`text-left card-sage !p-3 border ${
                      active ? "border-ink bg-primary-pale" : "border-transparent"
                    }`}
                  >
                    <div className="text-2xl">{s.icon}</div>
                    <div className="font-semibold text-sm mt-1">{s.name}</div>
                    <div className="text-xs text-body">{s.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setStep("review")} className="btn-tertiary">Kembali</button>
            <WiseButton onClick={() => setStep("done")} disabled={skills.length === 0}>
              Daftarkan pekerja
            </WiseButton>
          </div>
        </section>
      )}

      {/* Step 5 — done */}
      {step === "done" && (
        <section className="mt-8">
          <div className="card-green text-center">
            <CheckCircle2 size={56} className="mx-auto text-positive-deep" />
            <h2 className="display-md mt-3">{editedName} berhasil didaftarkan!</h2>
            <p className="text-body mt-2">
              Pekerja akan menunggu verifikasi RT sebelum tampil di radius konsumen.
            </p>
          </div>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={() => {
                setStep("upload");
                setHasKtp(false);
                setHasFace(false);
                setOcr(null);
                setSkills([]);
                setPhone("");
              }}
              className="btn-tertiary"
            >
              Daftarkan lagi
            </button>
            <WiseButton onClick={() => navigate({ to: "/agent" })}>Kembali ke dasbor</WiseButton>
          </div>
        </section>
      )}
    </main>
  );
}

function UploadTile({
  icon,
  title,
  desc,
  done,
  onPick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  done: boolean;
  onPick: () => void;
}) {
  return (
    <button
      onClick={onPick}
      className={`card-content border-2 border-dashed text-left ${
        done ? "border-positive bg-primary-pale" : "border-ink/20 hover:border-ink"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-xl bg-canvas-soft flex items-center justify-center">{icon}</div>
        <div className="flex-1">
          <div className="font-display font-black">{title}</div>
          <div className="text-xs text-body">{desc}</div>
        </div>
        {done && <CheckCircle2 className="text-positive" />}
      </div>
      <div className="text-xs text-mute mt-3">
        {done ? "Foto terupload (mock)." : "Klik untuk simulasi upload."}
      </div>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`text-input ${mono ? "font-mono tracking-wider" : ""}`}
      />
    </div>
  );
}
