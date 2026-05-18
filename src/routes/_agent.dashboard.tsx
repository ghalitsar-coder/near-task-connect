import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  CheckCircle2,
  Clock,
  Wallet,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useWorkersStore } from "@/stores/useWorkersStore";
import { mockOrders } from "@/mocks/orders";
import { formatIDR, formatDateTime, relativeHours } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { WorkerStatusBadge } from "@/components/workers/WorkerStatusBadge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_agent/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — KerjaDekat Agen" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const workers = useWorkersStore((s) => s.workers);
  const active = workers.filter((w) => w.status === "active").length;
  const pending = workers.filter((w) => w.status === "pending_verification").length;
  const suspended = workers.filter((w) => w.status === "suspended").length;
  const overdue = workers.filter((w) => {
    if (w.status !== "pending_verification") return false;
    return (Date.now() - new Date(w.registeredAt).getTime()) / 3_600_000 >= 24;
  }).length;

  const monthOrders = mockOrders.filter(
    (o) =>
      new Date(o.createdAt) > new Date(Date.now() - 30 * 86400_000) &&
      o.status === "done",
  );
  const gmv = monthOrders.reduce((s, o) => s + o.price, 0);

  // 14-day trend
  const trend = Array.from({ length: 14 }).map((_, i) => {
    const day = new Date(Date.now() - (13 - i) * 86400_000);
    const key = day.toISOString().slice(0, 10);
    const count = mockOrders.filter(
      (o) => o.createdAt.slice(0, 10) === key && o.status === "done",
    ).length;
    return {
      day: day.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      orders: count,
    };
  });

  const donut = [
    { name: "Aktif", value: active, color: "var(--color-chart-1)" },
    { name: "Pending", value: pending, color: "var(--color-chart-3)" },
    { name: "Suspend", value: suspended, color: "var(--color-chart-5)" },
  ];

  const recent = mockOrders.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Pekerja Aktif"
          value={active.toString()}
          hint={`${workers.length} total terdaftar`}
        />
        <KpiCard
          icon={Clock}
          label="Menunggu Verifikasi"
          value={pending.toString()}
          hint={overdue > 0 ? `${overdue} lewat SLA 24 jam` : "Semua dalam SLA"}
          tone={overdue > 0 ? "warning" : "default"}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Order Selesai (30 hari)"
          value={monthOrders.length.toString()}
          hint="Wilayah Tegalrejo"
        />
        <KpiCard
          icon={Wallet}
          label="GMV Bulan Berjalan"
          value={formatIDR(gmv)}
          hint="Total order selesai"
          tone="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Tren Order 14 Hari</h2>
              <p className="text-xs text-muted-foreground">
                Order selesai per hari di Kel. Tegalrejo
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full">
              <TrendingUp className="h-3 w-3 mr-1" /> +12%
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--color-chart-1)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-bold text-lg">Status Pekerja</h2>
          <p className="text-xs text-muted-foreground">Distribusi saat ini</p>
          <div className="h-48 mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={donut}
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {donut.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {donut.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: d.color }}
                  />
                  {d.name}
                </span>
                <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Order Terbaru</h2>
            <Link
              to="/workers"
              className="text-xs font-semibold inline-flex items-center gap-1 hover:underline"
            >
              Lihat semua <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr>
                  <th className="py-2">Order</th>
                  <th>Pelanggan</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{o.id}</td>
                    <td>{o.customerName}</td>
                    <td>
                      <Badge variant="secondary" className="rounded-full">
                        {o.category}
                      </Badge>
                    </td>
                    <td>{formatIDR(o.price)}</td>
                    <td className="text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">SLA Alerts</h2>
            <Link
              to="/alerts"
              className="text-xs font-semibold inline-flex items-center gap-1 hover:underline"
            >
              Semua <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Pekerja menunggu verifikasi lebih dari 24 jam.
          </p>
          <div className="space-y-3">
            {workers
              .filter((w) => w.status === "pending_verification")
              .slice(0, 5)
              .map((w) => {
                const hrs = Math.round(
                  (Date.now() - new Date(w.registeredAt).getTime()) / 3_600_000,
                );
                const overdue = hrs >= 24;
                return (
                  <Link
                    key={w.id}
                    to={"/workers/$workerId" as string}
                    params={{ workerId: w.id }}
                    className="flex items-start gap-3 rounded-xl border p-3 hover:bg-accent transition"
                  >
                    <div
                      className={`mt-0.5 rounded-full p-1.5 ${overdue ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning-foreground"}`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold truncate">
                          {w.fullName}
                        </div>
                        <WorkerStatusBadge status={w.status} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {w.id} · daftar {relativeHours(hrs)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            {workers.filter((w) => w.status === "pending_verification").length ===
              0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                Tidak ada alert. Mantap!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "warning";
}) {
  const toneCls =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "warning"
        ? "bg-warning/20 text-foreground"
        : "bg-card";
  return (
    <div className={`rounded-2xl border p-5 ${toneCls}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium opacity-80">{label}</div>
        <div className="h-9 w-9 rounded-xl bg-background/40 grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs opacity-70">{hint}</div>}
    </div>
  );
}
