import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { AgentTopbar } from "@/components/layout/AgentTopbar";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/workers": "Manajemen Pekerja",
  "/workers/new": "Registrasi Pekerja Baru",
  "/territory": "Peta Teritori",
  "/reports": "Laporan & Insentif",
  "/alerts": "SLA Alerts",
};

export const Route = createFileRoute("/_agent")({
  component: AgentLayout,
});

function AgentLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const title =
    TITLES[path] ??
    (path.startsWith("/workers/") ? "Detail Pekerja" : "Dashboard");

  return (
    <div className="flex min-h-screen bg-canvas-soft">
      <AgentSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AgentTopbar title={title} />
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
