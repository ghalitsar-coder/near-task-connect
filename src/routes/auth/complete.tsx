import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useSessionStore, type Role } from "@/stores/useSessionStore";
import type { ApiUser } from "@/lib/api/types";

export const Route = createFileRoute("/auth/complete")({
  validateSearch: (search: Record<string, string | undefined>) => ({
    access_token: search.access_token as string | undefined,
    refresh_token: search.refresh_token as string | undefined,
    error: search.error as string | undefined,
  }),
  head: () => ({ meta: [{ title: "Masuk · KerjaDekat" }] }),
  component: AuthCompletePage,
});

async function getMe(accessToken: string): Promise<{ ok: boolean; data?: ApiUser }> {
  try {
    const res = await fetch("/api/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as ApiUser;
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

function AuthCompletePage() {
  const navigate = useNavigate();
  const { role, setTokens, setProfile } = useSessionStore();
  const { access_token, refresh_token, error: oauthError } = useSearch({ from: Route.id });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      return;
    }
    if (!access_token || !refresh_token) {
      setError("Tidak ada token OAuth.");
      return;
    }
    let cancelled = false;
    (async () => {
      setTokens({
        accessToken: access_token,
        refreshToken: refresh_token,
      });
      const me = await getMe(access_token);
      if (cancelled) return;
      const currentRole = me.ok && me.data
        ? (["consumer", "worker", "agent", "admin"].includes(me.data.Role) ? me.data.Role as Role : role)
        : role;
      if (me.ok && me.data) {
        setProfile({
          name: me.data.FullName,
          kelurahanId: me.data.KelurahanID ?? null,
          role: currentRole,
        });
      }
      if (currentRole === "agent" || currentRole === "admin") navigate({ to: "/dashboard" });
      else if (currentRole === "worker") navigate({ to: "/workers" });
      else navigate({ to: "/consumers" });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, role, setProfile, setTokens, access_token, refresh_token, oauthError]);

  return (
    <div className="min-h-screen bg-[#e8ebe6] flex items-center justify-center px-6">
      <div className="rounded-[24px] bg-[#ffffff] p-8 max-w-sm w-full text-center">
        {error ? (
          <>
            <AlertCircle className="mx-auto text-[#d03238] mb-3" size={32} />
            <p className="text-sm text-body">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto animate-spin text-mute mb-3" size={32} />
            <p className="font-display font-black">Menyelesaikan masuk…</p>
            <p className="text-sm text-mute mt-1">OAuth berhasil, menyinkronkan akun.</p>
          </>
        )}
      </div>
    </div>
  );
}
