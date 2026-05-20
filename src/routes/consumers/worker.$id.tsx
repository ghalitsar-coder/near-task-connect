import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import { TopNav } from "@/components/shell/TopNav";
import { WiseButton } from "@/components/brand/WiseButton";
import { createConsumerOrderFn, getConsumerSkillCategoriesFn } from "@/lib/consumer.server";
import { skillEmoji } from "@/lib/orderLabels";
import { DEFAULT_LAT, DEFAULT_LNG, readUserPosition } from "@/lib/geo";
import { formatIDR } from "@/lib/formatCurrency";
import { useSessionStore } from "@/stores/useSessionStore";

export const Route = createFileRoute("/consumers/worker/$id")({
  head: () => ({ meta: [{ title: "Pesan Jasa · KerjaDekat" }] }),
  component: BookServicePage,
  notFoundComponent: () => <NotFound />,
});

function NotFound() {
  return (
    <div className="min-h-screen bg-[#e8ebe6]">
      <TopNav backTo="/consumer" />
      <div className="rounded-[24px] bg-[#ffffff] max-w-md mx-auto mt-10 p-6 text-center">
        Kategori jasa tidak ditemukan.
      </div>
    </div>
  );
}

function BookServicePage() {
  const { id } = useParams({ from: "/consumers/worker/$id" });
  const skillId = Number(id);
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const authed = useSessionStore((s) => s.authed);

  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("Jl. Tebet Barat Dalam VIII no. 12");
  const [method, setMethod] = useState("qris");
  const [position, setPosition] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    readUserPosition().then(setPosition);
  }, []);

  const categoriesQuery = useQuery({
    queryKey: ["consumer-skill-categories", accessToken],
    queryFn: () => getConsumerSkillCategoriesFn({ data: { accessToken } }),
    enabled: authed && Boolean(accessToken),
    staleTime: 300_000,
  });

  const skill = categoriesQuery.data?.data.items.find((s) => s.ID === skillId);

  const createMutation = useMutation({
    mutationFn: () =>
      createConsumerOrderFn({
        data: {
          accessToken,
          payload: {
            skill_id: skillId,
            description: notes.trim() || undefined,
            latitude: position.lat,
            longitude: position.lng,
            consumer_address: address.trim() || undefined,
            payment_method_fee: method,
          },
        },
      }),
    onSuccess: (res) => {
      if (!res.ok || !res.data) {
        setSubmitError(res.error ?? "Gagal membuat pesanan.");
        return;
      }
      navigate({ to: "/consumers/order/$id", params: { id: res.data.ID } });
    },
    onError: (err) => {
      setSubmitError(err instanceof Error ? err.message : "Gagal membuat pesanan.");
    },
  });

  if (!Number.isFinite(skillId) || skillId <= 0) return <NotFound />;

  if (categoriesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#e8ebe6] flex items-center justify-center">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  if (!skill) return <NotFound />;

  const platformFee = 2000;

  return (
    <main className="bg-[#e8ebe6] min-h-[calc(100vh-73px)]">
      <div className="md:hidden">
        <TopNav backTo="/consumer" />
      </div>

      <div className="max-w-6xl mx-auto md:px-8 pt-4 pb-24 md:py-8">
        <div className="hidden md:block mb-6">
          <Link to="/consumers" className="text-sm font-semibold text-mute hover:text-ink">
            ← Kembali ke beranda
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-6 lg:gap-10 items-start">
          <section className="px-5 md:px-0">
            <div className="rounded-[24px] bg-[#ffffff] p-6">
              <div className="flex items-start gap-4">
                <div className="size-20 rounded-full bg-[#e2f6d5] flex items-center justify-center text-4xl">
                  {skillEmoji(skill.Name)}
                </div>
                <div>
                  <h1 className="display-sm md:display-md">{skill.Name}</h1>
                  <p className="text-sm text-body mt-2">{skill.Description ?? "—"}</p>
                  <p className="text-xs text-mute mt-3 inline-flex items-center gap-1">
                    <MapPin size={14} /> Sistem mencarikan pekerja terdekat setelah pesanan dibuat
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="lg:sticky lg:top-28 space-y-6 px-5 md:px-0">
            <div className="rounded-[24px] bg-[#ffffff] p-6">
              <h2 className="font-display font-black text-xl">Detail pesanan</h2>

              <label className="block text-sm font-semibold mt-5 mb-2">Alamat lokasi jasa</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-input bg-[#ffffff] w-full"
                placeholder="Alamat lengkap"
              />

              <label className="block text-sm font-semibold mt-4 mb-2">Catatan untuk pekerja</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="mis: kran wastafel bocor…"
                className="text-input w-full"
              />

              <label className="block text-sm font-semibold mt-4 mb-2">Metode pembayaran admin</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "qris", label: "QRIS" },
                  { id: "gopay", label: "GoPay" },
                  { id: "ovo", label: "OVO" },
                  { id: "dana", label: "DANA" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`rounded-[12px] border px-3 py-2 text-sm font-semibold ${
                      method === m.id ? "border-ink bg-[#e2f6d5]" : "border-ink/15 bg-[#ffffff]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {submitError && (
                <div className="mt-4 flex items-start gap-2 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-3 py-2 text-sm text-[#054d28]">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="rounded-[24px] bg-[#e8ebe6] mt-6 p-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-body">Biaya admin (ditahan)</span>
                  <strong>{formatIDR(platformFee)}</strong>
                </div>
                <p className="text-xs text-mute mt-3">
                  Upah jasa dibayar tunai ke pekerja setelah selesai. Dana admin ditahan via Xendit saat pesanan
                  dibuat.
                </p>
              </div>
            </div>

            <div className="fixed bottom-0 inset-x-0 bg-[#ffffff] border-t border-ink/10 p-4 md:static md:border-none md:p-0 z-30">
              <WiseButton
                id="consumer-book-submit-btn"
                full
                disabled={createMutation.isPending || !authed}
                onClick={() => {
                  setSubmitError(null);
                  createMutation.mutate();
                }}
              >
                {createMutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Memproses…
                  </span>
                ) : (
                  `Pesan & tahan ${formatIDR(platformFee)}`
                )}
              </WiseButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
