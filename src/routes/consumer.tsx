import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { BottomTabBar } from "@/components/shell/BottomTabBar";
import { RequireAuth } from "@/lib/auth/requireAuth";
import { Search, History, User } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/consumer")({
  component: ConsumerLayout,
});

function ConsumerLayout() {
  const loc = useLocation();
  const name = useSessionStore((s) => s.name);

  const nav = [
    { to: "/consumer", label: "Eksplor", icon: Search },
    { to: "/consumer/history", label: "Aktivitas", icon: History },
    { to: "/consumer/profile", label: "Profil", icon: User },
  ];

  return (
    <RequireAuth>
    <div className="min-h-screen bg-canvas-soft flex flex-col">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-4 bg-canvas border-b border-ink/10 sticky top-0 z-40">
        <div className="flex items-center gap-10">
          <Link to="/consumer" className="font-display font-black text-2xl tracking-tight">
            kerja<span className="text-ink">dekat</span>
            <span className="inline-block ml-1 size-2 rounded-full bg-primary align-middle" />
          </Link>
          <nav className="flex items-center gap-6">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = loc.pathname === to || (to === "/consumer" && loc.pathname === "/consumer/");
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                    active ? "text-ink" : "text-mute hover:text-ink"
                  }`}
                >
                  <Icon size={18} /> {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/consumer/profile" className="flex items-center gap-2 hover:bg-canvas-soft px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-ink/10">
            <div className="size-8 rounded-full bg-primary-pale text-primary-deep flex items-center justify-center font-display font-black text-sm">
              {name[0]}
            </div>
            <span className="text-sm font-semibold">{name.split(" ")[0]}</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 md:pb-0 pb-20">
        <Outlet />
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden">
        <BottomTabBar />
      </div>
    </div>
    </RequireAuth>
  );
}
