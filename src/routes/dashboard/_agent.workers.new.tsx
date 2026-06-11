import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import {
  CreditCard,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ScanLine,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  getAgentTerritoriesFn,
  getSkillCategoriesFn,
  getKelurahansFn,
  registerWorkerFn,
} from "@/lib/agent.server";
import { fileToPayload } from "@/lib/uploads";
import type { Kelurahan, SkillCategory } from "@/lib/api/types";
import { lazy, Suspense } from "react";

const MapcnNearbyMap = lazy(() =>
  import("@/components/map/MapcnNearbyMap").then((m) => ({ default: m.MapcnNearbyMap }))
);

export const Route = createFileRoute("/dashboard/_agent/workers/new")({
  head: () => ({ meta: [{ title: "Registrasi Pekerja — KerjaDekat" }] }),
  component: NewWorkerPage,
});

type UploadedFile = {
  file: File;
  preview: string;
};

function NewWorkerPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [ktpFile, setKtpFile] = useState<UploadedFile | null>(null);
  const [faceFile, setFaceFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workerLocation, setWorkerLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Fetch territories and skills
  const [territories, setTerritories] = useState<Kelurahan[]>([]);
  const [skills, setSkills] = useState<SkillCategory[]>([]);
  const [kelurahans, setKelurahans] = useState<Kelurahan[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.9175, 107.6191]); // Default Bandung

  useEffect(() => {
    async function loadData() {
      try {
        const [terrResult, skillResult, kelResult] = await Promise.all([
          getAgentTerritoriesFn(),
          getSkillCategoriesFn(),
          getKelurahansFn(),
        ]);
        
        if (terrResult.ok && terrResult.data.items) {
          setTerritories(terrResult.data.items);
        }
        if (skillResult.ok && skillResult.data.items) {
          setSkills(skillResult.data.items);
        }
        if (kelResult.ok && kelResult.data.items) {
          setKelurahans(kelResult.data.items);
          // Auto-select first kelurahan if none selected
          if (kelResult.data.items.length > 0 && !form.state.values.kelurahanId) {
            const firstKel = kelResult.data.items[0];
            form.setFieldValue('kelurahanId', firstKel.ID);
            // Center map on first kelurahan
            if (firstKel.Centroid?.Valid) {
              const center: [number, number] = [firstKel.Centroid.Lat, firstKel.Centroid.Lng];
              setMapCenter(center);
              setWorkerLocation({ lat: firstKel.Centroid.Lat, lng: firstKel.Centroid.Lng });
            }
          }
        }
      } catch (error) {
        toast.error("Gagal memuat data");
        console.error(error);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const form = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
      rt: "",
      rw: "",
      kelurahanId: territories[0]?.ID ?? 0,
      skillIds: [] as number[],
    },
    onSubmit: async ({ value }) => {
      if (!ktpFile || !faceFile) {
        toast.error("KTP dan foto wajah harus diupload");
        return;
      }

      if (value.skillIds.length === 0) {
        toast.error("Pilih minimal satu skill");
        return;
      }

      setSubmitting(true);
      try {
        const ktpPayload = await fileToPayload(ktpFile.file);
        const facePayload = await fileToPayload(faceFile.file);

        const rtRw = value.rt && value.rw ? `${value.rt}/${value.rw}` : undefined;

        const result = await registerWorkerFn({
          data: {
            payload: {
              phone_number: value.phone,
              full_name: value.fullName,
              rt_rw: rtRw,
              kelurahan_id: value.kelurahanId,
              skill_ids: value.skillIds,
              ktp_photo: ktpPayload,
              profile_photo: facePayload,
              latitude: workerLocation?.lat,
              longitude: workerLocation?.lng,
            },
          },
        });

        if (!result.ok) {
          toast.error(result.error || "Gagal mendaftarkan pekerja");
          return;
        }

        toast.success("Pekerja berhasil didaftarkan");
        navigate({ to: "/dashboard/workers" });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    setUploading(true);
    try {
      const preview = URL.createObjectURL(file);
      setKtpFile({ file, preview });
      toast.success("KTP berhasil diupload");
    } catch (error) {
      toast.error("Gagal mengupload KTP");
    } finally {
      setUploading(false);
    }
  };

  const handleFaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    setUploading(true);
    try {
      const preview = URL.createObjectURL(file);
      setFaceFile({ file, preview });
      toast.success("Foto wajah berhasil diambil");
    } catch (error) {
      toast.error("Gagal mengupload foto");
    } finally {
      setUploading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Stepper step={step} />

      {step === 1 && (
        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold">Upload KTP</h2>
            <p className="text-sm text-muted-foreground">
              Upload foto KTP pekerja untuk verifikasi identitas.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ktp-upload" className="cursor-pointer">
                <div className="rounded-xl border-2 border-dashed p-8 text-center hover:border-primary transition bg-canvas-soft">
                  {ktpFile ? (
                    <div className="space-y-3">
                      <img
                        src={ktpFile.preview}
                        alt="KTP Preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <div className="flex items-center justify-center gap-2 text-success">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">KTP Tersimpan</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-2" />
                      <div className="font-semibold">Upload KTP</div>
                      <div className="text-xs mt-1">
                        Klik untuk memilih file (max 5MB)
                      </div>
                    </div>
                  )}
                </div>
              </Label>
              <input
                id="ktp-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleKtpUpload}
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="rounded-xl border bg-canvas-soft p-6 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div>
                  <div className="font-semibold text-sm">Mengupload…</div>
                  <div className="text-xs text-muted-foreground">
                    Mohon tunggu sebentar
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!ktpFile}
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
            <h2 className="text-xl font-bold">Foto Wajah</h2>
            <p className="text-sm text-muted-foreground">
              Ambil foto pekerja untuk verifikasi identitas.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="face-upload" className="cursor-pointer">
                <div
                  className={`aspect-square rounded-2xl border-2 border-dashed grid place-items-center transition ${
                    faceFile
                      ? "border-success bg-success/5"
                      : "border-border bg-canvas-soft hover:border-primary"
                  }`}
                >
                  {faceFile ? (
                    <div className="text-center p-4">
                      <img
                        src={faceFile.preview}
                        alt="Face Preview"
                        className="max-h-full max-w-full rounded-lg mb-2"
                      />
                      <CheckCircle2 className="h-8 w-8 mx-auto text-success" />
                      <div className="mt-2 font-semibold">Foto Tersimpan</div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Camera className="h-12 w-12 mx-auto mb-2" />
                      <div className="font-semibold">Ambil Foto</div>
                      <div className="text-xs">Klik untuk upload</div>
                    </div>
                  )}
                </div>
              </Label>
              <input
                id="face-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFaceUpload}
                disabled={uploading}
              />
            </div>
            <div className="rounded-2xl bg-canvas-soft p-5 text-sm space-y-2">
              <div className="font-semibold">Tips:</div>
              <ul className="space-y-1 text-muted-foreground list-disc pl-4">
                <li>Pastikan wajah terlihat jelas, tidak buram.</li>
                <li>Tidak memakai masker atau kacamata gelap.</li>
                <li>Cahaya cukup, hindari backlight.</li>
              </ul>
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
              disabled={!faceFile}
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
            void form.handleSubmit();
          }}
          className="rounded-2xl border bg-card p-6 space-y-5"
        >
          <div>
            <h2 className="text-xl font-bold">Data Pekerja</h2>
            <p className="text-sm text-muted-foreground">
              Lengkapi data pekerja sebelum disimpan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <form.Field name="fullName">
              {(f) => (
                <FieldInput
                  label="Nama Lengkap"
                  value={f.state.value}
                  onChange={f.handleChange}
                  required
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
                  required
                />
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
            <form.Field name="kelurahanId">
              {(f) => {
                const selectedKel = kelurahans.find((k) => k.ID === f.state.value);
                const isInTerritory = territories.some((t) => t.ID === f.state.value);
                
                // Update map center when kelurahan changes
                if (selectedKel?.Centroid?.Valid) {
                  const newCenter: [number, number] = [
                    selectedKel.Centroid.Lat,
                    selectedKel.Centroid.Lng,
                  ];
                  if (mapCenter[0] !== newCenter[0] || mapCenter[1] !== newCenter[1]) {
                    setMapCenter(newCenter);
                    setWorkerLocation({ lat: selectedKel.Centroid.Lat, lng: selectedKel.Centroid.Lng });
                  }
                }

                return (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Kelurahan</Label>
                    <select
                      value={f.state.value}
                      onChange={(e) => f.handleChange(Number(e.target.value))}
                      className="w-full h-11 rounded-xl border bg-background px-3"
                      required
                    >
                      {kelurahans.length === 0 && (
                        <option value={0}>Tidak ada kelurahan</option>
                      )}
                      {kelurahans.map((k) => (
                        <option key={k.ID} value={k.ID}>
                          {k.Name}
                          {k.Kecamatan && `, ${k.Kecamatan}`}
                        </option>
                      ))}
                    </select>
                    {!isInTerritory && f.state.value > 0 && (
                      <div className="text-xs text-warning flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        Kelurahan ini di luar wilayah binaan Anda
                      </div>
                    )}
                  </div>
                );
              }}
            </form.Field>
          </div>

          {/* Map Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Lokasi Kelurahan — Geser pin hijau untuk pinpoint rumah pekerja
            </Label>
            <div className="rounded-xl border overflow-hidden">
              <Suspense
                fallback={
                  <div className="h-[300px] bg-muted flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                }
              >
                <MapcnNearbyMap
                  center={mapCenter}
                  workers={[]}
                  height="300px"
                  showUser={false}
                  zoom={14}
                  kelurahans={kelurahans}
                  selectedKelurahanId={form.state.values.kelurahanId}
                  onKelurahanSelect={(id) => {
                    form.setFieldValue('kelurahanId', id);
                    const selectedKel = kelurahans.find((k) => k.ID === id);
                    if (selectedKel?.Centroid?.Valid) {
                      const center: [number, number] = [selectedKel.Centroid.Lat, selectedKel.Centroid.Lng];
                      setMapCenter(center);
                      setWorkerLocation({ lat: selectedKel.Centroid.Lat, lng: selectedKel.Centroid.Lng });
                    }
                  }}
                  locationPin={workerLocation ?? undefined}
                  onLocationPinChange={(lat, lng) => setWorkerLocation({ lat, lng })}
                />
              </Suspense>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Skill</Label>
            <form.Field name="skillIds">
              {(f) => (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => {
                    const checked = f.state.value.includes(skill.ID);
                    return (
                      <label
                        key={skill.ID}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm cursor-pointer transition ${
                          checked
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-accent"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const next = v
                              ? [...f.state.value, skill.ID]
                              : f.state.value.filter((x) => x !== skill.ID);
                            f.handleChange(next);
                          }}
                          className="h-3.5 w-3.5"
                        />
                        {skill.Name}
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
              disabled={submitting}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-11 font-semibold"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Simpan Pekerja
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const items = [
    { n: 1, label: "Upload KTP" },
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

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        required={required}
      />
    </div>
  );
}
