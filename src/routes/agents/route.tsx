import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, UserPlus, MapPin, LogOut } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/agents")({
  component: AgentLayout,
});

function AgentLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { name, kelurahanId, signOut } = useSessionStore();

  const nav = [
    { to: "/agents", label: "Dasbor", icon: LayoutDashboard },
    { to: "/agents/register", label: "Daftarkan pekerja", icon: UserPlus },
  ];

  const territoryLabel = kelurahanId ? `Kel. #${kelurahanId}` : "Agen Komunitas";

  return (
    <div className="min-h-screen bg-[#e8ebe6]">
      <div className="grid lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:flex flex-col bg-[#ffffff] border-r border-ink/10 min-h-screen p-6">
          <Link to="/" className="font-display font-black text-xl">
            kerjadekat<span className="inline-block ml-1 size-2 rounded-full bg-[#9fe870] align-middle" />
          </Link>
          <div className="text-xs text-mute mt-1">Agen Komunitas</div>

          <nav className="mt-8 space-y-1">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = loc.pathname === to || (to === "/agents" && loc.pathname === "/agents/");
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                    active ? "bg-[#e2f6d5] text-ink" : "text-body hover:bg-[#e8ebe6]"
                  }`}
                >
                  <Icon size={16} /> {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[24px] bg-[#e8ebe6] p-4 text-sm">
            <div className="font-semibold">{name}</div>
            <div className="text-xs text-body mt-1 inline-flex items-center gap-1">
              <MapPin size={12} /> {territoryLabel}
            </div>
            <button
              id="agent-sidebar-logout-btn"
              type="button"
              onClick={() => {
                signOut();
                navigate({ to: "/" });
              }}
              className="mt-3 text-xs inline-flex items-center gap-1 font-semibold text-[#054d28]"
            >
              <LogOut size={12} /> Keluar
            </button>
          </div>
        </aside>

        <div className="lg:hidden">
          <div className="bg-[#ffffff] px-5 py-4 border-b border-ink/10 flex items-center justify-between">
            <Link to="/" className="font-display font-black text-lg">
              kerjadekat<span className="inline-block ml-1 size-2 rounded-full bg-[#9fe870] align-middle" />
            </Link>
            <div className="text-xs text-mute">{territoryLabel}</div>
          </div>
          <div className="bg-[#ffffff] border-b border-ink/10 px-2 flex gap-1">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = loc.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold ${
                    active ? "border-b-2 border-ink text-ink" : "text-mute"
                  }`}
                >
                  <Icon size={14} /> {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="min-h-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
