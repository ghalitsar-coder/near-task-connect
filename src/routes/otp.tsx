import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/otp")({
  head: () => ({ meta: [{ title: "Verifikasi OTP · KerjaDekat" }] }),
  component: OtpPage,
});

function OtpPage() {
  const navigate = useNavigate();
  const { phone, role, authenticate } = useSessionStore();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(45);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

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
    if (code !== "123456") {
      setError("Kode OTP salah. Gunakan 123456 untuk demo.");
      return;
    }
    authenticate();
    if (role === "agent") navigate({ to: "/agent" });
    else if (role === "worker") navigate({ to: "/worker" });
    else navigate({ to: "/consumer" });
  };

  return (
    <div className="min-h-screen bg-canvas-soft">
      <TopNav backTo="/login" />
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
              }}
              className="text-input !p-0 size-14 text-center font-display font-black text-2xl"
            />
          ))}
        </div>

        {error && <p className="text-negative text-sm mt-3">{error}</p>}

        <WiseButton onClick={verify} disabled={!valid} full className="mt-8">
          Verifikasi
        </WiseButton>

        <div className="text-center text-sm text-mute mt-6">
          {seconds > 0 ? (
            <>Kirim ulang dalam {seconds}d</>
          ) : (
            <button onClick={() => setSeconds(45)} className="underline font-semibold text-ink">
              Kirim ulang kode
            </button>
          )}
        </div>

        <div className="card-sage mt-8 text-sm">
          <strong>Demo:</strong> Gunakan kode <code className="bg-canvas px-1.5 rounded">123456</code> untuk lanjut.
        </div>
      </main>
    </div>
  );
}
