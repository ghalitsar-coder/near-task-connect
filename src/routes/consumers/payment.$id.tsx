import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { getConsumerOrderFn } from "@/lib/consumer.server";
import { paymentStatusLabel } from "@/lib/orderLabels";
import { formatIDR } from "@/lib/formatCurrency";
import { useSessionStore } from "@/stores/useSessionStore";

const METHOD_LABEL: Record<string, string> = {
  qris: "QRIS",
  gopay: "GoPay",
  ovo: "OVO",
  dana: "DANA",
};

export const Route = createFileRoute("/consumers/payment/$id")({
  head: () => ({ meta: [{ title: "Pembayaran · KerjaDekat" }] }),
  component: PaymentPage,
});

function PaymentPage() {
  const { id } = useParams({ from: "/consumers/payment/$id" });
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["consumer-order", id, accessToken],
    queryFn: () => getConsumerOrderFn({ data: { accessToken, orderId: id } }),
    enabled: authed && Boolean(accessToken),
  });

  const order = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e8ebe6] flex items-center justify-center">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (isError || !order || !data?.ok) {
    return (
      <main className="min-h-screen bg-[#e8ebe6]">
        <TopNav backTo="/consumer" title="Pembayaran" />
        <div className="px-5 pt-10">
          <div className="rounded-[24px] bg-[#ffffff] p-6 text-center">
            <AlertCircle className="mx-auto text-[#d03238] mb-2" />
            <p className="text-body">Data pembayaran tidak tersedia.</p>
            <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold underline">
              Coba lagi
            </button>
          </div>
        </div>
      </main>
    );
  }

  const authorized = order.PaymentStatus === "authorized" || order.PaymentStatus === "captured";
  const method = order.PaymentMethodFee ?? "";
  const methodLabel = METHOD_LABEL[method] ?? method.toUpperCase();
  const payURL = order.PaymentURL;

  return (
    <main className="min-h-screen bg-[#e8ebe6]">
      <TopNav backTo="/consumer" title="Pembayaran" />

      <section className="px-5 pt-4">
        <div className="rounded-[24px] bg-[#ffffff] p-6">
          <div className="flex items-center justify-between text-xs text-mute">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={14} /> Dijamin <strong className="text-ink">Xendit</strong>
            </span>
            <span>Order #{order.ID.slice(0, 8)}</span>
          </div>
          <div className="mt-4">
            <div className="text-sm text-body">
              {methodLabel ? `Pembayaran via ${methodLabel}` : "Status pembayaran admin"}
            </div>
            <div className="display-xl mt-1">{formatIDR(order.PlatformFee)}</div>
            <p className="text-xs text-body mt-2">{paymentStatusLabel(order.PaymentStatus)}</p>
          </div>
        </div>
      </section>

      {payURL && (
        <section className="px-5 pt-6">
          <div className="rounded-[24px] bg-[#ffffff] p-6 text-center">
            <p className="text-sm font-semibold mb-3">Scan QR code untuk membayar</p>
            <img
              src={payURL}
              alt="QR Code Pembayaran"
              className="mx-auto w-56 h-56 object-contain"
            />
            <p className="text-xs text-mute mt-4 break-all">{payURL}</p>
          </div>
        </section>
      )}

      <section className="px-5 pt-6 pb-10">
        <div className="rounded-[24px] bg-[#ffffff] p-6 text-center">
          {authorized ? (
            <>
              <CheckCircle2 size={56} className="mx-auto text-positive" />
              <h2 className="display-md mt-3">Dana ditahan</h2>
              <p className="text-body text-sm mt-2">
                {formatIDR(order.PlatformFee)} berhasil ditahan. Sistem sedang mencarikan pekerja terdekat.
              </p>
            </>
          ) : (
            <>
              <Loader2 size={48} className="mx-auto animate-spin" />
              <h2 className="display-sm mt-4">Menunggu pembayaran…</h2>
              <p className="text-body text-sm mt-2">
                Lakukan pembayaran melalui {methodLabel} untuk melanjutkan.
              </p>
            </>
          )}
          <WiseButton
            id="consumer-payment-goto-order-btn"
            full
            className="mt-6"
            onClick={() => navigate({ to: "/consumers/order/$id", params: { id: order.ID } })}
          >
            Lihat status pesanan
          </WiseButton>
        </div>
      </section>
    </main>
  );
}
