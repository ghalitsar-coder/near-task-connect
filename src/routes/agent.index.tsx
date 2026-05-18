import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, UserPlus, CheckCircle2, Clock } from "lucide-react";
import { mockAgentWorkers, AGENT_INFO } from "@/data/mockAgentWorkers";
import { mockServices } from "@/data/mockServices";
import { formatRelative } from "@/lib/formatCurrency";

export const Route = createFileRoute("/agent/")({
  head: () => ({ meta: [{ title: "Dasbor Agen · KerjaDekat" }] }),
  component: AgentHome,
});

function AgentHome() {
  const [q, setQ] = useState("");
  const filtered = mockAgentWorkers.filter((w) =>
    [w.name, w.nik, w.kelurahan].some((f) => f.toLowerCase().includes(q.toLowerCase()))
  );

  const verified = mockAgentWorkers.filter((w) => w.verificationStatus === "verified").length;
  const pending = mockAgentWorkers.filter((w) => w.verificationStatus === "pending").length;
  const online = mockAgentWorkers.filter((w) => w.online).length;

  return (
    <main className="p-5 lg:p-10 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="display-md">Selamat pagi, {AGENT_INFO.name.split(" ")[1]}.</h1>
          <p className="text-body mt-1">
            Wilayah binaan: {AGENT_INFO.kelurahan}, {AGENT_INFO.kecamatan}, {AGENT_INFO.kota}.
          </p>
        </div>
        <Link to="/agent/register" className="btn-primary">
          <UserPlus size={16} /> Daftarkan pekerja
        </Link>
      </div>

      {/* stats */}
      <div className="grid sm:grid-cols-3 gap-3 mt-6">
        <Stat label="Total pekerja" value={mockAgentWorkers.length.toString()} />
        <Stat label="Online sekarang" value={online.toString()} accent="primary" />
        <Stat label="Menunggu verifikasi" value={pending.toString()} accent="warning" />
      </div>

      <div className="mt-4 card-green flex items-center justify-between">
        <div>
          <div className="font-display font-black">{verified} pekerja terverifikasi RT</div>
          <div className="text-sm text-body">Sumber legitimasi platform di kelurahan kamu.</div>
        </div>
        <CheckCircle2 size={36} className="text-positive-deep" />
      </div>

      {/* search */}
      <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display font-black text-xl">Daftar pekerja</h2>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / NIK / kelurahan"
            className="text-input !pl-10 !py-2.5"
          />
        </div>
      </div>

      {/* table */}
      <div className="card-content mt-4 !p-0 overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 text-xs uppercase tracking-wide text-mute border-b border-ink/10 font-semibold">
          <span>Pekerja</span>
          <span>NIK</span>
          <span>Keahlian</span>
          <span>Kelurahan</span>
          <span>Status</span>
          <span>Terdaftar</span>
        </div>
        <ul className="divide-y divide-ink/10">
          {filtered.map((w) => {
            const svc = mockServices.find((s) => s.slug === w.primarySkill);
            return (
              <li
                key={w.id}
                className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-4 text-sm items-center"
              >
                <div>
                  <div className="font-semibold inline-flex items-center gap-2">
                    {w.name}
                    {w.online && <span className="size-2 rounded-full bg-positive" />}
                  </div>
                  <div className="md:hidden text-xs text-mute mt-0.5">{w.nik}</div>
                </div>
                <div className="hidden md:block text-body">{w.nik}</div>
                <div className="text-body">
                  {svc?.icon} {svc?.name}
                </div>
                <div className="text-body">{w.kelurahan}</div>
                <div>
                  {w.verificationStatus === "verified" ? (
                    <span className="badge-positive">
                      <CheckCircle2 size={10} /> Terverifikasi
                    </span>
                  ) : w.verificationStatus === "pending" ? (
                    <span className="badge-warning">
                      <Clock size={10} className="inline" /> Pending
                    </span>
                  ) : (
                    <span className="badge-negative">Ditolak</span>
                  )}
                </div>
                <div className="text-mute text-xs">{formatRelative(w.registeredAt)}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "primary" | "warning" }) {
  return (
    <div className={`card-content`}>
      <div className="text-xs text-mute">{label}</div>
      <div
        className={`font-display font-black text-3xl mt-1 ${
          accent === "primary" ? "text-ink-deep" : accent === "warning" ? "text-warning-deep" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
