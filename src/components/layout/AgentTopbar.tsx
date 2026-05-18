import { Bell, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAlertCount } from "@/hooks/useAlertCount";

export function AgentTopbar({ title }: { title: string }) {
  const alerts = useAlertCount();
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
          to="/alerts"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-card hover:bg-accent"
        >
          <Bell className="h-4 w-4" />
          {alerts > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {alerts}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
