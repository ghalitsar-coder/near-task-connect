import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, AlertCircle } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { useSessionStore } from "@/stores/useSessionStore";
import { getMyWalletFn, getMyWalletTransactionsFn } from "@/lib/wallet.server";
import { formatIDR, formatRelative } from "@/lib/formatCurrency";

export const Route = createFileRoute("/workers/wallet")({
  head: () => ({ meta: [{ title: "Wallet · KerjaDekat" }] }),
  component: WalletPage,
});

function WalletPage() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet-me", accessToken],
    queryFn: () => getMyWalletFn({ data: { accessToken } }),
    enabled: authed && Boolean(accessToken),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["wallet-tx", accessToken],
    queryFn: () => getMyWalletTransactionsFn({ data: { accessToken } }),
    enabled: authed && Boolean(accessToken),
  });

  const wallet = walletData?.ok ? walletData.data : null;
  const transactions = txData?.ok ? (txData.data?.items ?? []) : [];

  return (
    <div className="min-h-screen bg-canvas-soft">
      <TopNav
        backTo="/workers"
        title="Wallet"
        right={
          <Link to="/workers/orders" className="text-xs font-semibold text-mute">Pesanan</Link>
        }
      />

      <main className="max-w-md mx-auto px-5 pt-4 pb-20">
        {walletLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-mute" />
          </div>
        ) : (
          <div className="card-dark text-center">
            <div className="text-canvas-soft/60 text-xs font-semibold uppercase tracking-wider">
              Saldo Tersedia
            </div>
            <div className="display-md mt-1">
              {wallet ? formatIDR(wallet.Balance) : "Rp0"}
            </div>
            <div className="mt-4 text-xs text-canvas-soft/50">
              Pembayaran masuk otomatis setelah pesanan selesai
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 mb-3">
          <h2 className="font-display font-black">Riwayat Transaksi</h2>
        </div>

        {txLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-mute" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="card-content text-center py-8">
            <WalletIcon className="h-8 w-8 mx-auto mb-2 text-mute" />
            <div className="text-sm text-body">Belum ada transaksi</div>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.ID} className="card-content flex items-center gap-3">
                <div className={`size-10 rounded-full flex items-center justify-center ${
                  tx.Type === "credit" ? "bg-primary-pale" : "bg-negative-bg/10"
                }`}>
                  {tx.Type === "credit"
                    ? <ArrowDownLeft size={18} className="text-positive" />
                    : <ArrowUpRight size={18} className="text-negative" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">
                    {tx.ReferenceType === "order_completion"
                      ? "Pembayaran pesanan"
                      : tx.Description ?? tx.Type === "credit" ? "Pemasukan" : "Penarikan"}
                  </div>
                  <div className="text-xs text-mute">{formatRelative(tx.CreatedAt)}</div>
                </div>
                <div className="text-right">
                  <div className={`font-display font-black text-sm ${
                    tx.Type === "credit" ? "text-positive" : "text-negative"
                  }`}>
                    {tx.Type === "credit" ? "+" : "-"}{formatIDR(tx.Amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!walletLoading && !wallet && walletData && !walletData.ok && (
          <div className="card-content mt-4 flex items-center gap-2 text-sm text-body">
            <AlertCircle size={16} className="text-mute" />
            {walletData.error}
          </div>
        )}
      </main>
    </div>
  );
}
