import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, LogOut, Shield, HelpCircle, MapPin } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";
import type { ApiUser } from "@/lib/api/types";

export const Route = createFileRoute("/agents/profile")({
  head: () => ({ meta: [{ title: "Akun · KerjaDekat" }] }),
  component: AgentProfilePage,
});

async function getMe(accessToken: string): Promise<ApiUser | null> {
  try {
    const res = await fetch("/api/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as ApiUser;
  } catch {
    return null;
  }
}

function AgentProfilePage() {
  const { name, phone, accessToken, authed, kelurahanId, signOut } = useSessionStore();
  const navigate = useNavigate();

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ["agent-me", accessToken],
    queryFn: () => getMe(accessToken),
    enabled: authed && Boolean(accessToken),
    staleTime: 60_000,
  });

  const displayName = profile?.FullName ?? name;
  const displayPhone = profile?.PhoneNumber ?? phone;
  const displayPhoto = profile?.ProfilePhoto ?? null;

  return (
    <main className="px-5 pt-6 pb-20 max-w-lg mx-auto">
      {isError && (
        <div className="mb-4 flex items-start gap-3 rounded-[24px] border border-[#d03238]/30 bg-[#d03238]/10 px-4 py-3 text-sm text-[#054d28]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            Gagal memuat profil.{" "}
            <button type="button" onClick={() => refetch()} className="font-semibold underline">
              Coba lagi
            </button>
          </span>
        </div>
      )}

      <div className="rounded-[24px] bg-[#ffffff] p-6 flex items-center gap-4">
        {isLoading ? (
          <div className="size-16 rounded-full bg-[#e8ebe6] animate-pulse" />
        ) : displayPhoto ? (
          <img src={displayPhoto} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <div className="size-16 rounded-full bg-[#9fe870] flex items-center justify-center font-display font-black text-2xl shrink-0">
            {displayName[0] ?? "?"}
          </div>
        )}
        <div>
          <div className="font-display font-black text-lg">{isLoading ? "…" : displayName}</div>
          <div className="text-sm text-body">+62 {displayPhone || "—"}</div>
          {kelurahanId && (
            <div className="text-xs text-body mt-1 inline-flex items-center gap-1">
              <MapPin size={12} /> Kel. #{kelurahanId}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[24px] bg-[#ffffff] mt-3 divide-y divide-ink/10">
        {[
          { icon: Shield, label: "Privasi & keamanan" },
          { icon: HelpCircle, label: "Bantuan" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} type="button" className="w-full flex items-center gap-3 py-3 px-6 text-left">
            <Icon size={18} />
            <span className="flex-1 font-semibold">{label}</span>
            <span className="text-mute">›</span>
          </button>
        ))}
      </div>

      <button
        id="agent-profile-logout-btn"
        type="button"
        onClick={() => {
          signOut();
          navigate({ to: "/" });
        }}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 py-4 rounded-[24px] bg-[#ffffff] font-semibold text-[#054d28]"
      >
        <LogOut size={16} /> Keluar
      </button>
    </main>
  );
}
