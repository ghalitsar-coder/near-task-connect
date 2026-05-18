import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Loader2, CheckCircle2, CreditCard } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { useOrderStore } from "@/stores/useOrderStore";
import { formatIDR } from "@/lib/formatCurrency";

export const Route = createFileRoute("/consumer/payment/$id")({
  head: () => ({ meta: [{ title: "Pembayaran · KerjaDekat" }] }),
  component: PaymentPage,
});

type Step = "select" | "processing" | "success";

const METHODS = [
  { id: "qris", label: "QRIS", desc: "Scan dari semua bank/e-wallet", icon: "📱" },
  { id: "gopay", label: "GoPay", desc: "Saldo Rp 245.000", icon: "🟢" },
  { id: "ovo", label: "OVO", desc: "Saldo Rp 132.500", icon: "🟣" },
  { id: "dana", label: "DANA", desc: "Saldo Rp 88.200", icon: "🔵" },
];

function PaymentPage() {
  const { id } = useParams({ from: "/consumer/payment/$id" });
  const navigate = useNavigate();
  const order = useOrderStore((s) => s.orders.find((o) => o.id === id));
  const [method, setMethod] = useState("qris");
  const [step, setStep] = useState<Step>("select");

  if (!order) return null;

  const authorize = () => {
    setStep("processing");
    setTimeout(() => setStep("success"), 1800);
    setTimeout(() => navigate({ to: "/consumer/order/$id", params: { id } }), 3200);
  };

  return (
    <main className="min-h-screen bg-canvas-soft">
      <TopNav backTo="/consumer" title="Pembayaran" />

      {/* Xendit-style header */}
      <section className="px-5 pt-4">
        <div className="card-content">
          <div className="flex items-center justify-between text-xs text-mute">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={14} /> Dijamin <strong className="text-ink">Xendit</strong>
            </span>
            <span>Order #{order.id}</span>
          </div>
          <div className="mt-4">
            <div className="text-sm text-body">Otorisasi pembayaran</div>
            <div className="display-xl mt-1">{formatIDR(order.adminFee)}</div>
            <p className="text-xs text-body mt-2">
              Dana ditahan, bukan ditarik. Akan dicapture saat pesanan selesai, atau divoid otomatis jika dibatalkan.
            </p>
          </div>
        </div>
      </section>

      {step === "select" && (
        <>
          <section className="px-5 pt-4">
            <h2 className="font-display font-black text-lg mb-3">Pilih metode pembayaran</h2>
            <div className="space-y-2">
              {METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center gap-3 card-content !py-4 border transition-colors ${
                      active ? "border-ink bg-primary-pale" : "border-ink/10"
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{m.label}</div>
                      <div className="text-xs text-body">{m.desc}</div>
                    </div>
                    <span
                      className={`size-5 rounded-full border-2 ${
                        active ? "border-ink bg-ink" : "border-ink/30"
                      } flex items-center justify-center`}
                    >
                      {active && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="px-5 pt-4">
            <div className="card-sage text-sm space-y-1">
              <Row label="Biaya admin (ditahan)" value={formatIDR(order.adminFee)} />
              <Row label="Estimasi upah (tunai)" value={formatIDR(order.estimatedPrice)} muted />
              <div className="border-t border-ink/10 my-2" />
              <Row label="Total ditahan sekarang" value={formatIDR(order.adminFee)} strong />
            </div>
          </section>

          <div className="px-5 pt-6 pb-10">
            <WiseButton onClick={authorize} full leftIcon={<CreditCard size={18} />}>
              Otorisasi {formatIDR(order.adminFee)}
            </WiseButton>
            <p className="text-xs text-mute text-center mt-3">
              Mock screen — tidak ada transaksi nyata.
            </p>
          </div>
        </>
      )}

      {step === "processing" && (
        <section className="px-5 pt-10">
          <div className="card-content text-center">
            <Loader2 size={48} className="mx-auto animate-spin" />
            <h2 className="display-sm mt-4">Memproses otorisasi…</h2>
            <p className="text-body text-sm mt-2">Menghubungi {METHODS.find((m) => m.id === method)?.label}.</p>
          </div>
        </section>
      )}

      {step === "success" && (
        <section className="px-5 pt-10">
          <div className="card-content text-center">
            <CheckCircle2 size={56} className="mx-auto text-positive" />
            <h2 className="display-md mt-3">Berhasil ditahan</h2>
            <p className="text-body text-sm mt-2">
              {formatIDR(order.adminFee)} ditahan via {METHODS.find((m) => m.id === method)?.label}. Mengarahkan ke status order…
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-mute" : ""}`}>
      <span>{label}</span>
      <span className={strong ? "font-display font-black" : "font-semibold"}>{value}</span>
    </div>
  );
}
