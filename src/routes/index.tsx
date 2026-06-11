import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, MapPin, Zap } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KerjaDekat — Jasa harian andal dari tetangga sekitar" },
      {
        name: "description",
        content:
          "Panggil tukang ledeng, listrik, dan jasa harian langsung dari pekerja terverifikasi di sekitarmu. Bayar admin Rp2.000, sisanya tunai langsung ke pekerja.",
      },
      { property: "og:title", content: "KerjaDekat — Jasa harian andal dari tetangga sekitar" },
      {
        property: "og:description",
        content: "Platform jasa harian terpercaya. Harga jujur, pekerja verifikasi RT.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { setRole, authed, role } = useSessionStore();
  const dashboardUrl = role === "agent" || role === "admin" ? "/agent" : role === "worker" ? "/workers" : "/consumers";

  return (
    <main className="min-h-screen bg-canvas-soft">
      {/* nav */}
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="font-display font-black text-2xl text-ink">
          kerjadekat<span className="inline-block ml-1 size-2.5 rounded-full bg-primary align-middle" />
        </span>
        <Link to={authed ? dashboardUrl : "/auth/login"} className="btn-tertiary">
          {authed ? "Dashboard" : "Masuk"}
        </Link>
      </header>

      {/* hero */}
      <section className="hero-band max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <span className="badge-positive inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-positive" />
            Beta pilot · Tebet, Jakarta Selatan
          </span>
          <h1 className="display-mega mt-6 text-ink leading-relaxed">
            Jasa Harian,<br />
            <span className="bg-primary px-2 -mx-2 rounded-xl">dari tetangga.</span>
          </h1>
          <p className="mt-8 text-body text-xl max-w-lg leading-relaxed">
            Butuh tukang Ledeng, listrik, atau bersih-bersih dadakan? Panggil pekerja terverifikasi RT di sekitarmu. Datang dalam hitungan menit. Bayar admin Rp2.000, upah jasa tunai ke pekerja.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link to={authed && role === "consumer" ? "/consumers" : "/auth/login"} onClick={() => { if(!authed) setRole("consumer") }} className="btn-primary">
              Pesan jasa sekarang
            </Link>
            <Link to={authed && role === "worker" ? "/workers" : "/auth/login"} onClick={() => { if(!authed) setRole("worker") }} className="btn-tertiary">
              Daftar sebagai pekerja
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 max-w-md">
            {[
              { icon: MapPin, label: "Radius 5 km", desc: "Pekerja terdekat" },
              { icon: ShieldCheck, label: "Verifikasi RT", desc: "Aman & terpercaya" },
              { icon: Zap, label: "< 3 menit", desc: "Langsung respons" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="card-sage text-center">
                <Icon size={24} className="text-ink mx-auto" />
                <div className="mt-3 font-display font-black text-sm text-ink">{label}</div>
                <div className="mt-1 text-body text-xs">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* hero card — role selector */}
        <div className="currency-converter-card">
          <h2 className="display-md text-ink">Coba demo MVP</h2>
          <p className="text-body text-lg mt-3 mb-8">Pilih peran untuk memulai simulasi transaksi.</p>

          <div className="space-y-4">
            <RoleRow
              role="consumer"
              title="Sebagai Konsumen"
              desc="Cari pekerja terdekat, pesan jasa, & bayar admin."
              to={authed && role === "consumer" ? "/consumers" : "/auth/login"}
              onPick={() => { if (!authed) setRole("consumer"); }}
            />
            <RoleRow
              role="worker"
              title="Sebagai Pekerja Mitra"
              desc="Terima order masuk di sekitar lokasimu."
              to={authed && role === "worker" ? "/workers" : "/auth/login"}
              onPick={() => { if (!authed) setRole("worker"); }}
            />
            <RoleRow
              role="agent"
              title="Sebagai Agen Komunitas"
              desc="Daftarkan pekerja baru dari kelurahan setempat."
              to={authed && role === "agent" ? "/agent" : "/auth/login"}
              onPick={() => { if (!authed) setRole("agent"); }}
            />
          </div>

          <p className="typography-caption text-mute mt-8">
            OTP dikirim via SMS mock — cek log backend (<code className="bg-canvas-soft px-1.5 py-0.5 rounded">sms_mock: OTP</code>).
            Untuk agen, gunakan nomor yang sudah terdaftar di seed data.
          </p>
        </div>
      </section>

      {/* content band */}
      <section className="content-band">
        <div className="max-w-6xl mx-auto">
          <h2 className="display-xl text-ink text-center mb-16">
            Cara kerjanya sederhana
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "1", t: "Buka aplikasi", d: "Izinkan lokasi, lihat pekerja yang sedang online di radius 5 km sekitarmu." },
              { n: "2", t: "Pilih & pesan", d: "Lihat profil, rating, dan jarak pekerja. Tahan biaya admin Rp2.000." },
              { n: "3", t: "Pekerjaan selesai", d: "Pekerja datang, kerjakan tugas, lalu kamu bayar upah tunai langsung." },
            ].map((s) => (
              <div key={s.n} className="card-sage h-full flex flex-col relative overflow-hidden">
                <div className="display-mega text-primary/20 -mt-4 -ml-3 mb-2 select-none">0{s.n}</div>
                <div className="display-md text-ink mb-3">{s.t}</div>
                <p className="text-body text-base flex-1 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* dark footer band CTA */}
      <section className="hero-band-dark">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h2 className="display-xl text-primary mb-6">
            Gabung jadi tetangga baik
          </h2>
          <p className="text-canvas-soft/80 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Bantu hidupkan ekonomi lokal dengan saling memberdayakan keahlian tetangga sekitar.
          </p>
          <Link to={authed && role === "consumer" ? "/consumers" : "/auth/login"} onClick={() => { if(!authed) setRole("consumer") }} className="btn-primary mx-auto inline-flex">
            Mulai pakai KerjaDekat
          </Link>
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
  to: string;
  onPick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onPick}
      className="flex items-center justify-between gap-4 p-4 rounded-xl bg-canvas hover:bg-canvas-soft border border-ink/10 transition-all duration-200 group"
    >
      <div className="flex-1 min-w-0">
        <div className="font-display font-black text-lg text-ink">{title}</div>
        <div className="text-sm text-body mt-0.5">{desc}</div>
      </div>
      <div className="bg-canvas-soft p-3 rounded-full group-hover:bg-primary-pale transition-colors shrink-0">
        <ArrowRight size={20} className="text-ink group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}
