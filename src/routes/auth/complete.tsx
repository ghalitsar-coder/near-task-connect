import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { completeOAuthFn, getMeFn } from "@/lib/auth.server";
import { useSessionStore, type Role } from "@/stores/useSessionStore";

export const Route = createFileRoute("/auth/complete")({
  head: () => ({ meta: [{ title: "Masuk · KerjaDekat" }] }),
  component: AuthCompletePage,
});

function AuthCompletePage() {
  const navigate = useNavigate();
  const { role, setTokens, setProfile } = useSessionStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await completeOAuthFn({ data: { role } });
      if (cancelled) return;
      if (!res.ok || !res.data) {
        setError(res.error ?? "Gagal masuk dengan OAuth");
        return;
      }
      setTokens({
        accessToken: res.data.access_token,
        refreshToken: res.data.refresh_token,
      });
      const me = await getMeFn({ data: { accessToken: res.data.access_token } });
      if (me.ok && me.data) {
        const apiRole = me.data.Role as Role;
        setProfile({
          name: me.data.FullName,
          kelurahanId: me.data.KelurahanID ?? null,
          role: ["consumer", "worker", "agent", "admin"].includes(apiRole) ? apiRole : role,
        });
      }
      if (role === "agent" || role === "admin") navigate({ to: "/dashboard" });
      else if (role === "worker") navigate({ to: "/workers" });
      else navigate({ to: "/consumers" });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, role, setProfile, setTokens]);

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
