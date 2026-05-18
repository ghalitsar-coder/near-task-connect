import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Award, Banknote, TrendingUp, Users } from "lucide-react";
import { mockRegionalReports } from "@/mocks/regionalReports";
import { mockAgentIncentives } from "@/mocks/incentives";
import { formatIDR, formatMonth } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_agent/reports")({
  head: () => ({ meta: [{ title: "Laporan & Insentif — KerjaDekat" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const months = mockRegionalReports.map((r) => r.month);
  const [month, setMonth] = useState(months[months.length - 1]);
  const report = mockRegionalReports.find((r) => r.month === month)!;
  const incentive = mockAgentIncentives.find((i) => i.month === month)!;

  const trend = mockRegionalReports.map((r) => ({
    month: formatMonth(r.month).split(" ")[0],
    orders: r.totalOrders,
    gmv: Math.round(r.gmv / 1_000_000),
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold mr-2">Periode:</div>
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setMonth(m)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${
              month === m
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent"
            }`}
          >
            {formatMonth(m)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={TrendingUp}
          label="Total Order"
          value={report.totalOrders.toString()}
          hint={`${report.completedOrders} selesai`}
        />
        <Kpi
          icon={Banknote}
          label="GMV Kelurahan"
          value={formatIDR(report.gmv)}
          hint="Bruto transaksi"
        />
        <Kpi
          icon={Users}
          label="Pekerja Aktif"
          value={report.activeWorkers.toString()}
          hint={`+${report.newWorkers} pekerja baru`}
        />
        <Kpi
          icon={Award}
          label="Insentif Agen"
          value={formatIDR(incentive.payoutIDR)}
          hint={`Tier ${incentive.tier}`}
          tone="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6">
          <h2 className="font-bold text-lg">Tren 6 Bulan</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Order & GMV (Rp juta) per bulan
          </p>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="orders" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="gmv" name="GMV (Rp jt)" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-bold text-lg">Breakdown Kategori</h2>
          <p className="text-xs text-muted-foreground mb-3">
            {formatMonth(report.month)}
          </p>
          <div className="space-y-3">
            {report.categoryBreakdown.map((c) => {
              const pct = Math.round(
                (c.orders / report.totalOrders) * 100,
              );
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.category}</span>
                    <span className="text-muted-foreground">
                      {c.orders} · {formatIDR(c.gmv)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-lg">Insentif Agen — {formatMonth(month)}</h2>
            <p className="text-xs text-muted-foreground">
              Rincian poin & payout untuk Kak Yuni
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-full font-semibold border-primary/40 bg-primary/10"
          >
            Tier {incentive.tier}
          </Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Pekerja Baru Diverifikasi" value={incentive.newWorkersVerified} />
          <Stat label="Pekerja Aktif Bertahan" value={incentive.retainedActiveWorkers} />
          <Stat label="Base Points" value={incentive.basePoints} />
          <Stat label="Bonus Points" value={incentive.bonusPoints} />
        </div>
        <div className="mt-5 rounded-xl bg-canvas-soft p-4 flex items-center justify-between">
          <span className="font-semibold">Total Payout</span>
          <span className="text-2xl font-black tracking-tight">
            {formatIDR(incentive.payoutIDR)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary";
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${tone === "primary" ? "bg-primary text-primary-foreground" : "bg-card"}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium opacity-80">{label}</div>
        <div className="h-9 w-9 rounded-xl bg-background/40 grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs opacity-70">{hint}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-canvas-soft p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-black tracking-tight mt-1">{value}</div>
    </div>
  );
}
