import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, MapPin, Zap } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KerjaDekat — Jasa terpercaya di sekitarmu" },
      {
        name: "description",
        content:
          "Pesan tukang ledeng, listrik, kebersihan dan jasa harian dari pekerja terverifikasi di radius 5 km. Bayar admin Rp2.000, upah jasa tunai langsung.",
      },
      { property: "og:title", content: "KerjaDekat — Jasa terpercaya di sekitarmu" },
      {
        property: "og:description",
        content: "Platform micro-tasking berbasis komunitas untuk kelurahan padat penduduk.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const setRole = useSessionStore((s) => s.setRole);

  return (
    <main className="min-h-screen bg-canvas-soft">
      {/* nav */}
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="font-display font-black text-2xl">
          kerjadekat<span className="inline-block ml-1 size-2.5 rounded-full bg-primary align-middle" />
        </span>
        <Link to="/login" className="btn-tertiary !py-2 !px-4 text-sm">
          Masuk
        </Link>
      </header>

      {/* hero */}
      <section className="px-6 pt-6 pb-16 max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <span className="badge-positive">
            <span className="size-1.5 rounded-full bg-positive" />
            Beta pilot · Tebet, Jakarta Selatan
          </span>
          <h1 className="display-mega mt-4">
            Jasa harian,<br />
            <span className="bg-primary px-2 -mx-2 rounded-lg">dari tetangga.</span>
          </h1>
          <p className="mt-6 text-body text-lg max-w-md">
            Tukang ledeng, listrik, kebersihan, dan jasa harian lainnya — terverifikasi RT,
            datang dalam hitungan menit. Bayar admin Rp2.000, upah jasa tunai langsung.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/login" onClick={() => setRole("consumer")} className="btn-primary">
              Pesan jasa sekarang <ArrowRight size={18} />
            </Link>
            <Link to="/login" onClick={() => setRole("worker")} className="btn-tertiary">
              Saya pekerja
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
            {[
              { icon: MapPin, label: "Radius 5 km" },
              { icon: ShieldCheck, label: "Verifikasi RT" },
              { icon: Zap, label: "< 3 menit match" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="text-sm">
                <Icon size={18} className="text-ink-deep" />
                <div className="mt-1 font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* hero card — role selector */}
        <div className="card-content border border-ink/90 lg:p-8">
          <h2 className="font-display font-black text-xl">Coba demo MVP</h2>
          <p className="text-sm text-body mt-1">Pilih peran untuk masuk ke alur yang sesuai.</p>

          <div className="mt-6 space-y-3">
            <RoleRow
              role="consumer"
              title="Konsumen"
              desc="Cari pekerja terdekat, pesan & bayar admin."
              to="/login"
              onPick={() => setRole("consumer")}
            />
            <RoleRow
              role="worker"
              title="Pekerja Mitra"
              desc="Terima tawaran order di sekitar lokasi."
              to="/login"
              onPick={() => setRole("worker")}
            />
            <RoleRow
              role="agent"
              title="Agen Komunitas"
              desc="Daftarkan pekerja baru dari kelurahan."
              to="/login"
              onPick={() => setRole("agent")}
            />
          </div>

          <p className="text-xs text-mute mt-6">
            Demo — semua data dummy. OTP yang valid: <code className="bg-canvas-soft px-1.5 py-0.5 rounded">123456</code>.
          </p>
        </div>
      </section>

      {/* dark band */}
      <section className="bg-ink text-canvas-soft py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { n: "1", t: "Buka aplikasi", d: "Izinkan lokasi, lihat pekerja online di radius 5 km." },
            { n: "2", t: "Pilih & pesan", d: "Lihat profil, rating, dan jarak. Tahan admin Rp2.000." },
            { n: "3", t: "Selesaikan", d: "Pekerja datang, kerjakan, bayar upah tunai. Konfirmasi di app." },
          ].map((s) => (
            <div key={s.n} className="card-dark">
              <div className="text-primary font-display font-black text-5xl">0{s.n}</div>
              <div className="font-display font-black text-xl mt-4 text-canvas">{s.t}</div>
              <p className="text-canvas-soft/80 mt-2 text-sm">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function RoleRow({
  title,
  desc,
  to,
  onPick,
}: {
  role: string;
  title: string;
  desc: string;
  to: "/login";
  onPick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onPick}
      className="flex items-center justify-between gap-3 card-sage hover:bg-primary-pale transition-colors !py-4"
    >
      <div>
        <div className="font-display font-black">{title}</div>
        <div className="text-sm text-body">{desc}</div>
      </div>
      <ArrowRight size={18} />
    </Link>
  );
}
