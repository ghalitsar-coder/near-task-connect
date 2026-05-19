import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { requestOtpFn, loginEmailFn, registerEmailFn } from "@/lib/auth.server";
import { useSessionHydrated } from "@/lib/auth/hydration";
import { useSessionStore } from "@/stores/useSessionStore";
import { startOAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk · KerjaDekat" }] }),
  component: LoginPage,
});

function getAuthErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }
  return "Authentication failed";
}

function LoginPage() {
  const navigate = useNavigate();
  const hydrated = useSessionHydrated();
  const { setPhone, role, authed, accessToken } = useSessionStore();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  const [error, setError] = useState<string | null>(null);

  const startOAuthFlow = async (provider: "google" | "github") => {
    setError(null);
    try {
      await startOAuth(provider);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  useEffect(() => {
    if (!hydrated || !authed || !accessToken) return;
    if (role === "agent" || role === "admin") navigate({ to: "/agent" });
    else if (role === "worker") navigate({ to: "/worker" });
    else navigate({ to: "/consumer" });
  }, [hydrated, authed, accessToken, role, navigate]);

  const otpMutation = useMutation({
    mutationFn: (phone: string) => requestOtpFn({ data: { phone_number: phone } }),
    onSuccess: (res, phone) => {
      if (!res.ok) {
        setError(res.error ?? "Gagal mengirim OTP.");
        return;
      }
      setError(null);
      setPhone(phone);
      navigate({ to: "/otp" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      registerEmailFn({
        data: { email, password, name, phone_number: phoneInput, role },
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        if (res.error === "conflict") {
          setError("Akun dengan email atau nomor HP tersebut sudah terdaftar.");
        } else {
          setError(res.error ?? "Gagal mendaftar.");
        }
        return;
      }
      otpMutation.mutate(phoneInput);
    },
  });

  const loginMutation = useMutation({
    mutationFn: () => loginEmailFn({ data: { email, password } }),
    onSuccess: (res) => {
      if (!res.ok || !res.data) {
        if (res.error === "unauthorized" || res.error === "not found") {
          setError("Email atau password salah, atau akun tidak ditemukan.");
        } else {
          setError(res.error ?? "Gagal masuk.");
        }
        return;
      }
      otpMutation.mutate(res.data.phone_number);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isRegistering) {
      if (!email || !password || !name || !phoneInput) {
        setError("Semua kolom harus diisi.");
        return;
      }
      registerMutation.mutate();
    } else {
      if (!email || !password) {
        setError("Email dan password harus diisi.");
        return;
      }
      loginMutation.mutate();
    }
  };

  const roleLabel =
    role === "consumer" ? "konsumen" : role === "worker" ? "pekerja mitra" : "agen komunitas";
  
  const isPending = registerMutation.isPending || loginMutation.isPending || otpMutation.isPending;

  return (
    <div className="min-h-screen bg-[#e8ebe6]">
      <TopNav backTo="/" />
      <main className="max-w-md mx-auto px-6 pt-6 pb-20">
        <h1 className="display-xl">{isRegistering ? "Daftar" : "Masuk"}</h1>
        <p className="text-body mt-2">
          Lanjutkan sebagai <strong>{roleLabel}</strong>.
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-4 py-3 text-sm text-[#054d28]">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#d03238]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-8 space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-input w-full bg-[#ffffff]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Nomor WhatsApp / HP</label>
                <div className="flex gap-2">
                  <div className="text-input !w-20 text-center font-semibold bg-[#ffffff]">+62</div>
                  <input
                    inputMode="numeric"
                    placeholder="8123456789"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                    className="text-input flex-1 bg-[#ffffff]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              autoFocus
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-input w-full bg-[#ffffff]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-input w-full bg-[#ffffff]"
            />
          </div>

          <WiseButton id="login-submit-btn" type="submit" full disabled={isPending}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Memproses…
              </span>
            ) : isRegistering ? (
              "Daftar & Kirim OTP"
            ) : (
              "Masuk & Kirim OTP"
            )}
          </WiseButton>
          
          <div className="text-center text-sm font-medium mt-4">
            {isRegistering ? (
              <p>
                Sudah punya akun?{" "}
                <button type="button" onClick={() => setIsRegistering(false)} className="text-primary hover:underline">
                  Masuk di sini
                </button>
              </p>
            ) : (
              <p>
                Belum punya akun?{" "}
                <button type="button" onClick={() => setIsRegistering(true)} className="text-primary hover:underline">
                  Daftar di sini
                </button>
              </p>
            )}
          </div>

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

          <div className="grid gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-center border-hairline-strong bg-canvas shadow-none hover:bg-surface"
              disabled={false}
              onClick={() => {
                void startOAuthFlow("google");
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-2">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Lanjutkan dengan Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-center border-hairline-strong bg-canvas shadow-none hover:bg-surface"
              disabled={false}
              onClick={() => {
                void startOAuthFlow("github");
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-2">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Lanjutkan dengan GitHub
            </Button>
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
