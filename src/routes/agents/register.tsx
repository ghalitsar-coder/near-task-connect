import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Upload, Loader2, CheckCircle2, Camera, IdCard, AlertCircle } from "lucide-react";
import { WiseButton } from "@/components/brand/WiseButton";
import { getAgentTerritoriesFn, getSkillCategoriesFn, registerWorkerFn } from "@/lib/agent.server";
import type { Kelurahan, SkillCategory } from "@/lib/api/types";
import { fileToPayload } from "@/lib/uploads";
import { serviceBase } from "@/lib/api/config";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/agents/register")({
  head: () => ({ meta: [{ title: "Daftarkan Pekerja · KerjaDekat" }] }),
  component: RegisterWorker,
});

type Step = "upload" | "scanning" | "review" | "skills" | "done";

function RegisterWorker() {
  const navigate = useNavigate();
  const { accessToken, authed, kelurahanId, name: agentName, role } = useSessionStore();
  const isAgent = role === "agent";
  const isAdmin = role === "admin";
  const [step, setStep] = useState<Step>("upload");
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [rtRw, setRtRw] = useState("");
  const [kelurahanIdInput, setKelurahanIdInput] = useState(
    kelurahanId ? String(kelurahanId) : "1",
  );
  const [skills, setSkills] = useState<number[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registerResult, setRegisterResult] = useState<{
    nik: string;
    fullName: string;
    phone: string;
    ktpPhotoUrl?: string;
    profilePhotoUrl?: string;
  } | null>(null);

  const territoriesQuery = useQuery({
    queryKey: ["agent-territories", accessToken],
    queryFn: () => getAgentTerritoriesFn({ data: { accessToken } }),
    enabled: Boolean(accessToken) && authed && isAgent,
    staleTime: 300_000,
  });

  const territories: Kelurahan[] = territoriesQuery.data?.data.items ?? [];
  const territoriesLoading = territoriesQuery.isLoading;
  const territoriesError = territoriesQuery.isError || territoriesQuery.data?.ok === false;
  const hasNoTerritory = isAgent && !territoriesLoading && !territoriesError && territories.length === 0;

  useEffect(() => {
    if (!isAgent || territories.length === 0) return;
    const allowed = territories.some((t) => String(t.ID) === kelurahanIdInput);
    if (!allowed) {
      setKelurahanIdInput(String(territories[0].ID));
    }
  }, [isAgent, territories, kelurahanIdInput]);

  const skillsQuery = useQuery({
    queryKey: ["agent-skill-categories", accessToken],
    queryFn: () => getSkillCategoriesFn({ data: { accessToken } }),
    enabled: Boolean(accessToken) && authed && step === "skills",
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ktpFile || !profileFile) {
        throw new Error("Foto KTP dan foto wajah wajib diunggah.");
      }
      const kelurahanNum = Number(kelurahanIdInput);
      if (!Number.isFinite(kelurahanNum) || kelurahanNum <= 0) {
        throw new Error("Kelurahan ID tidak valid.");
      }
      const [ktp_photo, profile_photo] = await Promise.all([
        fileToPayload(ktpFile),
        fileToPayload(profileFile),
      ]);
      return registerWorkerFn({
        data: {
          accessToken,
          payload: {
            phone_number: phone.trim(),
            full_name: fullName.trim(),
            rt_rw: rtRw.trim() || undefined,
            kelurahan_id: kelurahanNum,
            skill_ids: skills,
            ktp_photo,
            profile_photo,
          },
        },
      });
    },
    onSuccess: (res) => {
      if (!res.ok || !res.data) {
        setSubmitError(res.error ?? "Gagal mendaftarkan pekerja.");
        setStep("skills");
        return;
      }
      const photoUrl = (key?: string | null) =>
        key ? `${serviceBase()}/files/photo?key=${encodeURIComponent(key)}` : undefined;
      setRegisterResult({
        nik: res.data.ocr_preview.nik,
        fullName: res.data.ocr_preview.full_name,
        phone: res.data.user.PhoneNumber,
        ktpPhotoUrl: photoUrl(res.data.user.KtpPhotoRef),
        profilePhotoUrl: photoUrl(res.data.user.ProfilePhoto),
      });
      setStep("done");
    },
    onError: (err) => {
      setSubmitError(err instanceof Error ? err.message : "Gagal mendaftarkan pekerja.");
      setStep("skills");
    },
  });

  const toggleSkill = (id: number) =>
    setSkills((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submitRegister = async () => {
    setSubmitError(null);
    if (!authed || !accessToken) {
      setSubmitError("Sesi agen tidak valid. Silakan masuk ulang.");
      return;
    }
    if (!fullName.trim() || !phone.trim()) {
      setSubmitError("Nama lengkap dan nomor handphone wajib diisi.");
      return;
    }
    if (skills.length === 0) {
      setSubmitError("Pilih minimal satu keahlian.");
      return;
    }
    if (isAgent && hasNoTerritory) {
      setSubmitError("Akun agen belum memiliki wilayah binaan. Hubungi admin atau gunakan nomor agen dari seed data.");
      return;
    }
    if (isAgent && !territories.some((t) => String(t.ID) === kelurahanIdInput)) {
      setSubmitError("Pilih kelurahan dari daftar wilayah binaan Anda.");
      return;
    }
    setStep("scanning");
    await mutation.mutateAsync();
  };

  const skillItems: SkillCategory[] = skillsQuery.data?.data.items ?? [];
  const skillsLoading = skillsQuery.isLoading;
  const skillsError = skillsQuery.isError || skillsQuery.data?.ok === false;

  if (!authed) {
    return (
      <main className="p-5 lg:p-10 max-w-3xl">
        <Link to="/agents" className="text-sm font-semibold text-body inline-block">
          ← Kembali ke dasbor
        </Link>
        <div className="mt-6 rounded-[24px] bg-[#ffffff] p-6">
          <h1 className="display-md">Masuk sebagai agen</h1>
          <p className="text-body mt-2">Anda perlu login agen terlebih dahulu untuk mendaftarkan pekerja.</p>
          <Link to="/auth/login" className="btn-primary inline-flex mt-4">
            Masuk sekarang
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-5 lg:p-10 max-w-3xl">
      <Link to="/agents" className="text-sm font-semibold text-body inline-block">
        ← Kembali ke dasbor
      </Link>
      <h1 className="display-md mt-2">Daftarkan pekerja baru</h1>
      <p className="text-body mt-1">
        Agen: <strong>{agentName}</strong> · Lengkapi 3 langkah: unggah dokumen → isi data → pilih keahlian.
      </p>

      <ol className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold">
        {["Unggah KTP", "Data pekerja", "Keahlian", "Selesai"].map((label, i) => {
          const order: Step[] = ["upload", "review", "skills", "done"];
          const idx = order.indexOf(step === "scanning" ? "upload" : step);
          const active = i === idx;
          const done = i < idx;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`size-7 rounded-full inline-flex items-center justify-center text-xs ${
                  done ? "bg-positive text-[#ffffff]" : active ? "bg-ink text-[#ffffff]" : "bg-[#e8ebe6] text-mute"
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

      {step === "upload" && (
        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <UploadTile
            icon={<IdCard size={28} />}
            title="Foto KTP"
            desc="Pastikan terbaca jelas, tidak silau."
            file={ktpFile}
            inputId="agent-register-ktp-file"
            accept="image/*"
            onFile={setKtpFile}
          />
          <UploadTile
            icon={<Camera size={28} />}
            title="Foto wajah pekerja"
            desc="Selfie pekerja, latar polos."
            file={profileFile}
            inputId="agent-register-profile-file"
            accept="image/*"
            onFile={setProfileFile}
          />
          <div className="sm:col-span-2">
            <WiseButton
              id="agent-register-next-btn"
              full
              disabled={!ktpFile || !profileFile}
              onClick={() => setStep("review")}
            >
              <Upload size={16} /> Lanjut isi data
            </WiseButton>
          </div>
        </section>
      )}

      {step === "scanning" && (
        <div className="rounded-[24px] bg-[#ffffff] p-6 mt-6 text-center">
          <Loader2 size={42} className="mx-auto animate-spin" />
          <div className="font-display font-black mt-3">Mendaftarkan pekerja…</div>
          <p className="text-sm text-body">Mengunggah data dan memproses OCR KTP.</p>
        </div>
      )}

      {step === "review" && (
        <section className="mt-6 grid lg:grid-cols-2 gap-4">
          <div className="rounded-[24px] bg-[#ffffff] p-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-ink">
              <CheckCircle2 size={14} /> Data pekerja
            </div>
            {hasNoTerritory && (
              <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-4 py-3 text-sm text-[#054d28]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  Akun agen belum punya wilayah binaan. Gunakan nomor agen seed (mis.{" "}
                  <code className="text-xs bg-[#ffffff] px-1 rounded">083456789002</code> untuk kelurahan 4).
                </div>
              </div>
            )}

            {territoriesError && isAgent && (
              <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-4 py-3 text-sm text-[#054d28]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  Gagal memuat wilayah binaan.{" "}
                  <button type="button" onClick={() => territoriesQuery.refetch()} className="font-semibold underline">
                    Coba lagi
                  </button>
                </div>
              </div>
            )}

            <div className="mt-3 space-y-3">
              <Field label="Nama lengkap" value={fullName} onChange={setFullName} placeholder="Nama sesuai KTP" />
              <Field label="No. handphone" value={phone} onChange={setPhone} placeholder="8123456789" />
              <Field label="RT/RW" value={rtRw} onChange={setRtRw} placeholder="001/002" />
              {isAgent ? (
                <KelurahanSelect
                  label="Kelurahan (wilayah binaan)"
                  value={kelurahanIdInput}
                  onChange={setKelurahanIdInput}
                  items={territories}
                  loading={territoriesLoading}
                  disabled={hasNoTerritory}
                />
              ) : (
                <Field
                  label={isAdmin ? "Kelurahan ID (admin)" : "Kelurahan ID"}
                  value={kelurahanIdInput}
                  onChange={setKelurahanIdInput}
                  type="number"
                />
              )}
            </div>
          </div>

          <div className="rounded-[24px] bg-[#e8ebe6] p-6 text-sm">
            <div className="text-xs uppercase tracking-wide text-mute font-semibold">Catatan</div>
            <ul className="mt-2 space-y-2 text-sm text-body">
              <li>Nama akan divalidasi dengan hasil OCR KTP saat pendaftaran.</li>
              <li>
                {isAgent
                  ? "Hanya kelurahan di wilayah binaan Anda yang dapat dipilih."
                  : "Admin dapat mendaftarkan pekerja di kelurahan mana pun."}
              </li>
              <li>Foto KTP dan wajah akan diunggah ke server saat submit.</li>
            </ul>
          </div>

          <div className="lg:col-span-2 flex justify-end gap-2">
            <button id="agent-register-back-upload-btn" type="button" onClick={() => setStep("upload")} className="btn-tertiary">
              Kembali
            </button>
            <WiseButton
              id="agent-register-next-skills-btn"
              onClick={() => setStep("skills")}
              disabled={!fullName || !phone || hasNoTerritory || (isAgent && !kelurahanIdInput)}
            >
              Lanjut ke keahlian
            </WiseButton>
          </div>
        </section>
      )}

      {step === "skills" && (
        <section className="mt-6">
          <div className="rounded-[24px] bg-[#ffffff] p-6">
            <h2 className="font-display font-black">Pilih keahlian</h2>
            <p className="text-sm text-body">Pilih satu atau lebih kategori yang dikuasai.</p>

            {skillsError && (
              <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-4 py-3 text-sm text-[#054d28]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  Gagal memuat daftar keahlian.{" "}
                  <button
                    id="agent-register-skills-retry-btn"
                    type="button"
                    onClick={() => skillsQuery.refetch()}
                    className="font-semibold underline"
                  >
                    Coba lagi
                  </button>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-4 py-3 text-sm text-[#054d28]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>{submitError}</div>
              </div>
            )}

            {skillsLoading ? (
              <SkillsSkeleton />
            ) : skillItems.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-[24px] border border-ink/10 bg-[#e8ebe6] px-6 py-10 text-sm text-mute">
                <IdCard className="mb-2 h-8 w-8 opacity-30" />
                Tidak ada kategori keahlian tersedia.
              </div>
            ) : (
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {skillItems.map((s) => {
                  const active = skills.includes(s.ID);
                  return (
                    <button
                      key={s.ID}
                      id={`agent-register-skill-${s.ID}`}
                      type="button"
                      onClick={() => toggleSkill(s.ID)}
                      className={`text-left rounded-[24px] bg-[#e8ebe6] p-3 border ${
                        active ? "border-ink bg-[#e2f6d5]" : "border-transparent"
                      }`}
                    >
                      <div className="size-9 rounded-full bg-[#ffffff] flex items-center justify-center text-sm font-semibold text-ink">
                        {s.Name?.[0] ?? "K"}
                      </div>
                      <div className="font-semibold text-sm mt-2">{s.Name}</div>
                      <div className="text-xs text-body">{s.Description ?? "—"}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button id="agent-register-back-review-btn" type="button" onClick={() => setStep("review")} className="btn-tertiary">
              Kembali
            </button>
            <WiseButton
              id="agent-register-submit-btn"
              onClick={submitRegister}
              disabled={skills.length === 0 || mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Mendaftarkan…
                </span>
              ) : (
                "Daftarkan pekerja"
              )}
            </WiseButton>
          </div>
        </section>
      )}

      {step === "done" && (
        <section className="mt-8">
          <div className="rounded-[24px] bg-[#e2f6d5] p-6 text-center">
            <CheckCircle2 size={56} className="mx-auto text-positive-deep" />
            <h2 className="display-md mt-3">{registerResult?.fullName ?? "Pekerja"} berhasil didaftarkan!</h2>
            <p className="text-body mt-2">
              OCR berhasil membaca NIK: <strong>{registerResult?.nik ?? "—"}</strong>.
              <br />
              No. HP: <strong>{registerResult?.phone ?? "—"}</strong>
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {registerResult?.ktpPhotoUrl && (
              <div className="rounded-[24px] bg-[#ffffff] p-4">
                <p className="text-xs text-muted-foreground mb-2">Foto KTP</p>
                <img src={registerResult.ktpPhotoUrl} alt="KTP" className="w-full rounded-xl object-cover aspect-[4/3]" />
              </div>
            )}
            {registerResult?.profilePhotoUrl && (
              <div className="rounded-[24px] bg-[#ffffff] p-4">
                <p className="text-xs text-muted-foreground mb-2">Foto Wajah</p>
                <img src={registerResult.profilePhotoUrl} alt="Face" className="w-full rounded-xl object-cover aspect-[4/3]" />
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2 justify-center flex-wrap">
            <button
              id="agent-register-another-btn"
              type="button"
              onClick={() => {
                setStep("upload");
                setKtpFile(null);
                setProfileFile(null);
                setSkills([]);
                setPhone("");
                setFullName("");
                setRtRw("");
                setKelurahanIdInput(kelurahanId ? String(kelurahanId) : "1");
                setRegisterResult(null);
                setSubmitError(null);
              }}
              className="btn-tertiary"
            >
              Daftarkan lagi
            </button>
            <WiseButton id="agent-register-dashboard-btn" onClick={() => navigate({ to: "/agents" })}>
              Kembali ke dasbor
            </WiseButton>
          </div>
        </section>
      )}
    </main>
  );
}

function SkillsSkeleton() {
  return (
    <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[24px] bg-[#e8ebe6] p-3">
          <div className="size-9 rounded-full bg-[#ffffff] animate-pulse" />
          <div className="h-4 w-24 bg-[#ffffff] mt-3 rounded animate-pulse" />
          <div className="h-3 w-full bg-[#ffffff] mt-2 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function UploadTile({
  icon,
  title,
  desc,
  file,
  inputId,
  accept,
  onFile,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  file: File | null;
  inputId: string;
  accept?: string;
  onFile: (file: File) => void;
}) {
  const done = Boolean(file);
  return (
    <label
      htmlFor={inputId}
      className={`rounded-[24px] bg-[#ffffff] p-6 border-2 border-dashed text-left cursor-pointer ${
        done ? "border-positive bg-[#e2f6d5]" : "border-ink/20 hover:border-ink"
      }`}
    >
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onFile(picked);
        }}
      />
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-xl bg-[#e8ebe6] flex items-center justify-center">{icon}</div>
        <div className="flex-1">
          <div className="font-display font-black">{title}</div>
          <div className="text-xs text-body">{desc}</div>
        </div>
        {done && <CheckCircle2 className="text-positive" />}
      </div>
      <div className="text-xs text-mute mt-3">
        {done ? `Terupload: ${file?.name ?? ""}` : "Klik untuk upload file."}
      </div>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-input bg-[#ffffff]"
      />
    </div>
  );
}

function KelurahanSelect({
  label,
  value,
  onChange,
  items,
  loading,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: Kelurahan[];
  loading: boolean;
  disabled?: boolean;
}) {
  if (loading) {
    return (
      <div>
        <label className="block text-sm font-semibold mb-1">{label}</label>
        <div className="h-12 rounded-[12px] bg-[#e8ebe6] animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <select
        value={value}
        disabled={disabled || items.length === 0}
        onChange={(e) => onChange(e.target.value)}
        className="text-input bg-[#ffffff] w-full"
      >
        {items.length === 0 ? (
          <option value="">Tidak ada wilayah</option>
        ) : (
          items.map((k) => (
            <option key={k.ID} value={String(k.ID)}>
              {k.Name}
              {k.Kecamatan ? ` · ${k.Kecamatan}` : ""}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
