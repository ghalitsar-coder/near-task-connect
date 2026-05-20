import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { getMeFn, requestOtpFn, verifyOtpFn } from "@/lib/auth.server";
import { useSessionStore, type Role } from "@/stores/useSessionStore";

export const Route = createFileRoute("/auth/otp")({
  head: () => ({ meta: [{ title: "Verifikasi OTP · KerjaDekat" }] }),
  component: OtpPage,
});

function OtpPage() {
  const navigate = useNavigate();
  const { phone, role, setTokens, setProfile } = useSessionStore();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(45);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await verifyOtpFn({
        data: { phone_number: phone, code, role },
      });
      if (!res.ok || !res.data) {
        throw new Error(res.error ?? "Verifikasi gagal");
      }
      setTokens({
        accessToken: res.data.access_token,
        refreshToken: res.data.refresh_token,
      });
      const me = await getMeFn({ data: { accessToken: res.data.access_token } });
      if (me.ok && me.data) {
        const apiRole = me.data.Role as Role;
        setProfile({
          name: me.data.FullName,
          kelurahanId: me.data.KelurahanID ?? null,
          role: ["consumer", "worker", "agent", "admin"].includes(apiRole) ? apiRole : role,
        });
      }
      return res.data;
    },
    onSuccess: () => {
      if (role === "agent" || role === "admin") navigate({ to: "/agents" });
      else if (role === "worker") navigate({ to: "/workers" });
      else navigate({ to: "/consumers" });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Verifikasi gagal");
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => requestOtpFn({ data: { phone_number: phone } }),
    onSuccess: (res) => {
      if (!res.ok) {
        setError(res.error ?? "Gagal mengirim ulang OTP");
        return;
      }
      setError(null);
      setSeconds(45);
    },
  });

  const code = digits.join("");
  const valid = code.length === 6;

  const onChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    setError(null);
    if (d && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length) {
      e.preventDefault();
      const next = text.split("").concat(Array(6 - text.length).fill(""));
      setDigits(next.slice(0, 6));
      inputsRef.current[Math.min(text.length, 5)]?.focus();
    }
  };

  const verify = () => {
    if (!valid || verifyMutation.isPending) return;
    verifyMutation.mutate(code);
  };

  return (
    <div className="min-h-screen bg-[#e8ebe6]">
      <TopNav backTo="/auth/login" />
      <main className="max-w-md mx-auto px-6 pt-6 pb-20">
        <h1 className="display-xl">Cek WhatsApp</h1>
        <p className="text-body mt-2">
          Kami kirim 6-digit kode ke <strong>+62 {phone || "•••• •••• ••"}</strong>.
        </p>

        <div className="mt-8 flex justify-between gap-2" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
                if (e.key === "Enter" && valid) verify();
              }}
              className="text-input !p-0 size-14 text-center font-display font-black text-2xl bg-[#ffffff]"
            />
          ))}
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 text-sm text-[#d03238]">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <WiseButton
          id="otp-verify-btn"
          onClick={verify}
          disabled={!valid || verifyMutation.isPending}
          full
          className="mt-8"
        >
          {verifyMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Memverifikasi…
            </span>
          ) : (
            "Verifikasi"
          )}
        </WiseButton>

        <div className="text-center text-sm text-mute mt-6">
          {seconds > 0 ? (
            <>Kirim ulang dalam {seconds}d</>
          ) : (
            <button
              id="otp-resend-btn"
              type="button"
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              className="underline font-semibold text-ink"
            >
              {resendMutation.isPending ? "Mengirim…" : "Kirim ulang kode"}
            </button>
          )}
        </div>

        <div className="card-sage mt-8 text-sm">
          <strong>Dev:</strong> Cek log backend (<code className="bg-[#ffffff] px-1.5 rounded">sms_mock: OTP</code>) untuk
          kode OTP yang dikirim.
        </div>
      </main>

    </div>
  );
}
