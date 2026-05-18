import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk · KerjaDekat" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { phone, setPhone, role } = useSessionStore();
  const [touched, setTouched] = useState(false);
  const valid = /^8\d{8,11}$/.test(phone);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setTouched(true);
      return;
    }
    navigate({ to: "/otp" });
  };

  const roleLabel = role === "consumer" ? "konsumen" : role === "worker" ? "pekerja mitra" : "agen komunitas";

  return (
    <div className="min-h-screen bg-canvas-soft">
      <TopNav backTo="/" />
      <main className="max-w-md mx-auto px-6 pt-6 pb-20">
        <h1 className="display-xl">Masuk</h1>
        <p className="text-body mt-2">
          Lanjutkan sebagai <strong>{roleLabel}</strong>. Kami akan kirim kode OTP via WhatsApp/SMS.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Nomor handphone</label>
            <div className="flex gap-2">
              <div className="text-input !w-20 text-center font-semibold">+62</div>
              <input
                inputMode="numeric"
                autoFocus
                placeholder="8123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="text-input flex-1"
              />
            </div>
            {touched && !valid && (
              <p className="text-sm text-negative mt-2">Format nomor belum benar. Contoh: 81234567890.</p>
            )}
          </div>

          <WiseButton type="submit" full>
            Kirim OTP
          </WiseButton>

          <p className="text-xs text-mute text-center">
            Dengan lanjut, kamu setuju dengan{" "}
            <span className="underline">Ketentuan</span> & <span className="underline">Privasi</span>.
          </p>
        </form>
      </main>
    </div>
  );
}
