import { Bell, LogOut, Search, User } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAlertCount } from "@/hooks/useAlertCount";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSessionStore } from "@/stores/useSessionStore";
import { useLogout } from "@/hooks/use-auth";

export function AgentTopbar({ title }: { title: string }) {
  const alerts = useAlertCount();
  const navigate = useNavigate();
  const signOut = useSessionStore((s) => s.signOut);
  const name = useSessionStore((s) => s.name);
  const logoutMutation = useLogout();
  const handleLogout = () => {
    signOut();
    logoutMutation.mutate();
    navigate({ to: "/dashboard/login" });
  };

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-4 md:px-8">
        <h1 className="text-lg md:text-xl font-bold tracking-tight flex-1 truncate">
          {title}
        </h1>
        <div className="hidden md:flex items-center gap-2 rounded-xl border bg-card px-3 py-2 w-72">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Cari pekerja, order, NIK…"
            className="bg-transparent text-sm outline-none flex-1"
          />
        </div>
        <Link
          to="/dashboard/alerts"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-card hover:bg-accent"
        >
          <Bell className="h-4 w-4" />
          {alerts > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {alerts}
            </span>
          )}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold hover:bg-accent"
            >
              <span className="h-7 w-7 rounded-full bg-accent grid place-items-center text-xs font-bold">
                {name?.[0] ?? "A"}
              </span>
              <span className="hidden md:inline-block max-w-[140px] truncate">{name ?? "Agen"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" /> Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
