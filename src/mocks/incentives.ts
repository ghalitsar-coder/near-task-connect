import type { AgentIncentive } from "@/types/report";

const MONTHS = ["2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04"];

export const mockAgentIncentives: AgentIncentive[] = MONTHS.map((m, i) => {
  const newW = 3 + (i % 4);
  const retained = 12 + i;
  const base = newW * 20;
  const bonus = retained * 5;
  return {
    month: m,
    agentId: "AGT-YUNI",
    newWorkersVerified: newW,
    retainedActiveWorkers: retained,
    basePoints: base,
    bonusPoints: bonus,
    payoutIDR: (base + bonus) * 2_000,
    tier: i < 2 ? "Bronze" : i < 5 ? "Silver" : "Gold",
  };
});
