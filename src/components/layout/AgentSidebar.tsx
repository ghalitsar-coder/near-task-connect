import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Map,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAlertCount } from "@/hooks/useAlertCount";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/workers", label: "Pekerja", icon: Users },
  { to: "/workers/new", label: "Daftar Pekerja", icon: UserPlus },
  { to: "/territory", label: "Peta Teritori", icon: Map },
  { to: "/reports", label: "Laporan", icon: BarChart3 },
  { to: "/alerts", label: "SLA Alerts", icon: AlertTriangle, badge: true },
] as const satisfies ReadonlyArray<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: boolean;
}>;

export function AgentSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const agent = useAuthStore((s) => s.agent);
  const alerts = useAlertCount();

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary grid place-items-center text-primary-foreground font-black">
            K
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">KerjaDekat</div>
            <div className="text-xs text-muted-foreground">Agen Komunitas</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => {
          const active =
            path === item.to ||
            (item.to !== "/dashboard" && path.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.badge && alerts > 0 && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    active
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "bg-destructive text-destructive-foreground",
                  )}
                >
                  {alerts}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl border bg-card p-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent grid place-items-center font-semibold">
            {agent?.name?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{agent?.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              Kel. {agent?.kelurahan}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
