import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/agent/")({
  head: () => ({ meta: [{ title: "Dasbor Agen · KerjaDekat" }] }),
  component: AgentHome,
});

function AgentHome() {
  const [q, setQ] = useState("");
  const { name, kelurahanId, authed } = useSessionStore();

  const territoryLabel = kelurahanId ? `Kelurahan ID ${kelurahanId}` : "Wilayah binaan";

  return (
    <main className="p-5 lg:p-10 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="display-md">
            Selamat datang{authed && name !== "Tamu" ? `, ${name.split(" ")[0]}` : ""}.
          </h1>
          <p className="text-body mt-1">Wilayah binaan: {territoryLabel}.</p>
        </div>
        <Link to="/agent/register" className="btn-primary" id="agent-dashboard-register-btn">
          <UserPlus size={16} /> Daftarkan pekerja
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-6">
        <Stat label="Total pekerja" value="—" hint="API daftar pekerja belum tersedia di MVP" />
        <Stat label="Online sekarang" value="—" />
        <Stat label="Menunggu verifikasi" value="—" />
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display font-black text-xl">Daftar pekerja</h2>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
          <input
            id="agent-dashboard-search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / NIK / kelurahan"
            className="text-input !pl-10 !py-2.5 bg-[#ffffff]"
            disabled
          />
        </div>
      </div>

      <div className="rounded-[24px] bg-[#ffffff] mt-4 overflow-hidden">
        <div className="flex flex-col items-center justify-center px-5 py-16 text-sm text-mute">
          <Users className="mb-3 h-10 w-10 opacity-30" />
          <p className="font-semibold text-body text-center">
            Daftar pekerja wilayah akan tampil di sini setelah endpoint{" "}
            <code className="text-xs bg-[#e8ebe6] px-1 rounded">GET /agent/workers</code> tersedia.
          </p>
          <p className="mt-2 text-center max-w-md">
            Gunakan tombol <strong>Daftarkan pekerja</strong> untuk mendaftarkan mitra baru via API.
          </p>
          {q && (
            <p className="mt-3 text-xs">Pencarian &quot;{q}&quot; — belum terhubung ke backend.</p>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[24px] bg-[#ffffff] p-6">
      <div className="text-xs text-mute">{label}</div>
      <div className="font-display font-black text-3xl mt-1">{value}</div>
      {hint && <p className="text-xs text-mute mt-2">{hint}</p>}
    </div>
  );
}
