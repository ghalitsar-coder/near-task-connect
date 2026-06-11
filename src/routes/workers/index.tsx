import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Power, Star, ListOrdered } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { useSessionStore } from "@/stores/useSessionStore";
import { getWorkerOrdersFn } from "@/lib/worker.server";
import { formatIDR } from "@/lib/formatCurrency";
import { orderStatusLabel, skillEmoji } from "@/lib/orderLabels";

export const Route = createFileRoute("/workers/")({
  head: () => ({ meta: [{ title: "Dasbor Pekerja · KerjaDekat" }] }),
  component: WorkerDashboard,
});

function WorkerDashboard() {
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const { name, signOut } = useSessionStore();
  const authed = useSessionStore((s) => s.authed);
  const [online, setOnline] = useState(true);

  const { data } = useQuery({
    queryKey: ["worker-orders", accessToken],
    queryFn: () => getWorkerOrdersFn({ data: { accessToken } }),
    enabled: authed && Boolean(accessToken),
  });

  const orders = data?.ok ? (data.data?.items ?? []) : [];
  const completedOrders = orders.filter((o) => o.Status === "completed");
  const todayEarning = completedOrders.reduce((s, o) => s + (o.AgreedRate ?? 0), 0);
  const todayJobs = completedOrders.length;
  const activeOrders = orders.filter((o) =>
    ["pending_match", "offered", "accepted", "worker_departed", "in_progress"].includes(o.Status)
  );
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-canvas-soft">
      <TopNav
        backTo="/"
        title="Mitra"
        right={
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="text-xs font-semibold text-mute"
          >
            Keluar
          </button>
        }
      />

      <main className="max-w-md mx-auto px-5 pt-4 pb-20">
        {/* status card */}
        <div className={`card-content ${online ? "border border-positive/30" : ""}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-body">Halo,</div>
              <div className="font-display font-black text-lg">{name}</div>
            </div>
            <button
              onClick={() => setOnline((o) => !o)}
              className={`flex items-center gap-2 rounded-pill px-4 py-2 font-semibold text-sm border ${
                online ? "bg-primary border-ink" : "bg-canvas-soft border-ink/20"
              }`}
            >
              <Power size={14} /> {online ? "Online" : "Offline"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="card-sage !p-3">
              <div className="text-xs text-mute">Pendapatan selesai</div>
              <div className="font-display font-black text-lg">{formatIDR(todayEarning)}</div>
            </div>
            <div className="card-sage !p-3">
              <div className="text-xs text-mute">Order selesai</div>
              <div className="font-display font-black text-lg">{todayJobs}</div>
            </div>
          </div>
        </div>

        {/* active orders summary */}
        {activeOrders.length > 0 && (
          <div className="card-content mt-4 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-mute font-semibold uppercase tracking-wider">Pesanan Aktif</div>
                <div className="font-display font-black text-xl mt-1">{activeOrders.length}</div>
              </div>
              <Link
                to="/workers/orders"
                className="text-sm font-semibold text-primary underline"
              >
                Lihat Semua
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {activeOrders.slice(0, 3).map((o) => (
                <Link
                  key={o.ID}
                  to="/workers/orders/$id"
                  params={{ id: o.ID }}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <span>{skillEmoji(o.Skill?.Name ?? "")}</span>
                  <span className="flex-1 truncate">{o.Skill?.Name ?? "Jasa"}</span>
                  <span className="text-xs text-mute">{orderStatusLabel(o.Status)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* waiting */}
        {online && activeOrders.length === 0 && (
          <div className="card-content mt-4 text-center">
            <div className="size-14 rounded-full bg-primary-pale mx-auto flex items-center justify-center">
              <Bell size={24} className="animate-pulse" />
            </div>
            <div className="font-display font-black mt-3">Siap menerima tawaran</div>
            <p className="text-sm text-body mt-1">
              Kamu sedang online. Tawaran akan muncul di halaman pesanan.
            </p>
          </div>
        )}

        {!online && (
          <div className="card-sage mt-4 text-center text-sm">
            Kamu sedang offline. Konsumen tidak akan melihatmu di daftar pekerja terdekat.
          </div>
        )}

        {/* quick links */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Link to="/workers/orders" className="card-content flex items-center gap-3">
            <div className="size-12 rounded-full bg-secondary-pale flex items-center justify-center">
              <ListOrdered size={20} />
            </div>
            <div>
              <div className="font-semibold">Pesanan</div>
              <div className="text-xs text-mute">{orders.length} total</div>
            </div>
          </Link>
          <Link to="/workers/wallet" className="card-content flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary-pale flex items-center justify-center">
              <Star size={20} />
            </div>
            <div>
              <div className="font-semibold">Wallet</div>
              <div className="text-xs text-mute">Saldo & riwayat</div>
            </div>
          </Link>
        </div>

        {/* recent orders */}
        {recentOrders.length > 0 && (
          <>
            <h2 className="font-display font-black mt-6 mb-3">Riwayat terakhir</h2>
            {recentOrders.map((o) => (
              <Link
                key={o.ID}
                to="/workers/orders/$id"
                params={{ id: o.ID }}
                className="card-content flex items-center gap-3 mb-2"
              >
                <div className="text-2xl">{skillEmoji(o.Skill?.Name ?? "")}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{o.Skill?.Name ?? "Jasa"}</div>
                  <div className="text-xs text-mute">{orderStatusLabel(o.Status)}</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-black text-sm">
                    {o.AgreedRate != null ? formatIDR(o.AgreedRate) : "—"}
                  </div>
                  {o.PaymentStatus === "completed" && (
                    <div className="text-xs text-positive">Lunas</div>
                  )}
                </div>
              </Link>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
