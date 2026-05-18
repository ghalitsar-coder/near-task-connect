import { Link, useLocation } from "@tanstack/react-router";
import { Home, ClipboardList, Sparkles, User } from "lucide-react";

const items = [
  { to: "/consumer", label: "Beranda", icon: Home },
  { to: "/consumer/services", label: "Jasa", icon: Sparkles },
  { to: "/consumer/history", label: "Riwayat", icon: ClipboardList },
  { to: "/consumer/profile", label: "Akun", icon: User },
];

export function BottomTabBar() {
  const loc = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-ink/10 bg-canvas">
      <ul className="mx-auto max-w-md grid grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-semibold ${
                  active ? "text-ink" : "text-mute"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
