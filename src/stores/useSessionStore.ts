import { create } from "zustand";

export type Role = "consumer" | "worker" | "agent";

interface SessionState {
  phone: string;
  role: Role;
  name: string;
  authed: boolean;
  setPhone: (p: string) => void;
  setRole: (r: Role) => void;
  setName: (n: string) => void;
  authenticate: () => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  phone: "",
  role: "consumer",
  name: "Tamu",
  authed: false,
  setPhone: (p) => set({ phone: p }),
  setRole: (r) => set({ role: r }),
  setName: (n) => set({ name: n }),
  authenticate: () => set({ authed: true, name: "Mira Anggraini" }),
  signOut: () => set({ authed: false, phone: "", name: "Tamu" }),
}));
