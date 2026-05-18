import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSessionStore } from "@/stores/useSessionStore";
import { LogOut, Shield, Wallet, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/consumer/profile")({
  head: () => ({ meta: [{ title: "Akun · KerjaDekat" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { name, phone, signOut } = useSessionStore();
  const navigate = useNavigate();

  return (
    <main className="px-5 pt-6">
      <div className="card-content flex items-center gap-4">
        <div className="size-16 rounded-full bg-primary flex items-center justify-center font-display font-black text-2xl">
          {name[0]}
        </div>
        <div>
          <div className="font-display font-black text-lg">{name}</div>
          <div className="text-sm text-body">+62 {phone || "—"}</div>
        </div>
      </div>

      <div className="card-content mt-3 divide-y divide-ink/10">
        {[
          { icon: Wallet, label: "Metode pembayaran" },
          { icon: Shield, label: "Privasi & keamanan" },
          { icon: HelpCircle, label: "Bantuan" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="w-full flex items-center gap-3 py-3 text-left">
            <Icon size={18} />
            <span className="flex-1 font-semibold">{label}</span>
            <span className="text-mute">›</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          signOut();
          navigate({ to: "/" });
        }}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl bg-canvas font-semibold text-negative-deep"
      >
        <LogOut size={16} /> Keluar
      </button>
    </main>
  );
}
