import { refreshTokensFn } from "@/lib/auth.server";
import { useSessionStore } from "@/stores/useSessionStore";

/** Refreshes access token when refresh token exists; returns whether session is usable. */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  const { accessToken, refreshToken, setTokens, signOut } = useSessionStore.getState();
  if (accessToken) return true;
  if (!refreshToken) return false;

  const res = await refreshTokensFn({ data: { refresh_token: refreshToken } });
  if (!res.ok || !res.data?.access_token) {
    signOut();
    return false;
  }
  setTokens({
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
  });
  return true;
}
