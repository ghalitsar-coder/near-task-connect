import { create } from "zustand";
import type { Agent } from "@/types/agent";
import { currentAgent } from "@/mocks/agents";

type AuthState = {
  agent: Agent | null;
  login: (phone: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  agent: currentAgent, // pre-logged-in for demo
  login: () => set({ agent: currentAgent }),
  logout: () => set({ agent: null }),
}));
