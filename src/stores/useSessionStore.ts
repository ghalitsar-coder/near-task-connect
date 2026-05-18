import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "consumer" | "worker" | "agent" | "admin";

interface SessionState {
  phone: string;
  role: Role;
  name: string;
  authed: boolean;
  accessToken: string;
  refreshToken: string;
  kelurahanId: number | null;
  setPhone: (p: string) => void;
  setRole: (r: Role) => void;
  setName: (n: string) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setProfile: (profile: { name: string; kelurahanId?: number | null; role?: Role }) => void;
  authenticate: () => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      phone: "",
      role: "consumer",
      name: "Tamu",
      authed: false,
      accessToken: "",
      refreshToken: "",
      kelurahanId: null,
      setPhone: (p) => set({ phone: p }),
      setRole: (r) => set({ role: r }),
      setName: (n) => set({ name: n }),
      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken, authed: Boolean(accessToken) }),
      setProfile: ({ name, kelurahanId, role: apiRole }) =>
        set((state) => ({
          name,
          kelurahanId: kelurahanId ?? null,
          role: apiRole ?? state.role,
        })),
      authenticate: () => set({ authed: true }),
      signOut: () =>
        set({
          authed: false,
          phone: "",
          name: "Tamu",
          accessToken: "",
          refreshToken: "",
          kelurahanId: null,
        }),
    }),
    {
      name: "kerjadekat-session",
      partialize: (s) => ({
        phone: s.phone,
        role: s.role,
        name: s.name,
        authed: s.authed,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        kelurahanId: s.kelurahanId,
      }),
    },
  ),
);
