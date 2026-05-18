import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { requestOtpFn } from "@/lib/auth.server";
import { useSessionHydrated } from "@/lib/auth/hydration";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk · KerjaDekat" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const hydrated = useSessionHydrated();
  const { phone, setPhone, role, authed, accessToken } = useSessionStore();
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = /^8\d{8,11}$/.test(phone);

  useEffect(() => {
    if (!hydrated || !authed || !accessToken) return;
    if (role === "agent" || role === "admin") navigate({ to: "/agent" });
    else if (role === "worker") navigate({ to: "/worker" });
    else navigate({ to: "/consumer" });
  }, [hydrated, authed, accessToken, role, navigate]);

  const otpMutation = useMutation({
    mutationFn: () => requestOtpFn({ data: { phone_number: phone } }),
    onSuccess: (res) => {
      if (!res.ok) {
        setError(res.error ?? "Gagal mengirim OTP. Pastikan backend berjalan.");
        return;
      }
      setError(null);
      navigate({ to: "/otp" });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setTouched(true);
      return;
    }
    setError(null);
    otpMutation.mutate();
  };

  const roleLabel =
    role === "consumer" ? "konsumen" : role === "worker" ? "pekerja mitra" : "agen komunitas";

  return (
    <div className="min-h-screen bg-[#e8ebe6]">
      <TopNav backTo="/" />
      <main className="max-w-md mx-auto px-6 pt-6 pb-20">
        <h1 className="display-xl">Masuk</h1>
        <p className="text-body mt-2">
          Lanjutkan sebagai <strong>{roleLabel}</strong>. Kami akan kirim kode OTP via WhatsApp/SMS.
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-4 py-3 text-sm text-[#054d28]">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#d03238]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Nomor handphone</label>
            <div className="flex gap-2">
              <div className="text-input !w-20 text-center font-semibold bg-[#ffffff]">+62</div>
              <input
                id="login-phone-input"
                inputMode="numeric"
                autoFocus
                placeholder="8123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="text-input flex-1 bg-[#ffffff]"
              />
            </div>
            {touched && !valid && (
              <p className="text-sm text-[#d03238] mt-2">Format nomor belum benar. Contoh: 81234567890.</p>
            )}
          </div>

          <WiseButton id="login-send-otp-btn" type="submit" full disabled={otpMutation.isPending}>
            {otpMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Mengirim OTP…
              </span>
            ) : (
              "Kirim OTP"
            )}
          </WiseButton>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#e8ebe6] px-3 text-mute font-semibold uppercase tracking-wider">
                atau
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent("/auth/complete")}`}
              className="btn-tertiary text-center text-sm !py-3"
            >
              Google
            </a>
            <a
              href={`/api/auth/signin/github?callbackUrl=${encodeURIComponent("/auth/complete")}`}
              className="btn-tertiary text-center text-sm !py-3"
            >
              GitHub
            </a>
          </div>

          <p className="text-xs text-mute text-center">
            Dengan lanjut, kamu setuju dengan{" "}
            <span className="underline">Ketentuan</span> & <span className="underline">Privasi</span>.
          </p>
        </form>
      </main>
    </div>
  );
}
