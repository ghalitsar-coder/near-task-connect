import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useSessionHydrated } from "@/lib/auth/hydration";
import { refreshSessionIfNeeded } from "@/lib/auth/refreshSession";
import { useSessionStore } from "@/stores/useSessionStore";

type Props = {
  children: React.ReactNode;
  loginTo?: string;
};

/**
 * Waits for persisted session hydration before auth checks (fixes refresh → /login bug).
 */
export function RequireAuth({ children, loginTo = "/auth/login" }: Props) {
  const hydrated = useSessionHydrated();
  const navigate = useNavigate();
  const authed = useSessionStore((s) => s.authed);
  const accessToken = useSessionStore((s) => s.accessToken);
  const refreshToken = useSessionStore((s) => s.refreshToken);

  useEffect(() => {
    if (!hydrated) return;
    void refreshSessionIfNeeded().then((ok) => {
      if (!ok && (!authed || !accessToken)) {
        navigate({ to: loginTo });
      }
    });
  }, [hydrated, authed, accessToken, refreshToken, navigate, loginTo]);

  if (!hydrated) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-mute" size={32} />
      </div>
    );
  }

  if (!authed || !accessToken) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-mute" size={32} />
      </div>
    );
  }

  return <>{children}</>;
}
