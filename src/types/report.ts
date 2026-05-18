export type RegionalReport = {
  month: string;
  kelurahan: string;
  totalOrders: number;
  completedOrders: number;
  gmv: number;
  activeWorkers: number;
  newWorkers: number;
  avgCompletionMinutes: number;
  categoryBreakdown: { category: string; orders: number; gmv: number }[];
};

export type AgentIncentive = {
  month: string;
  agentId: string;
  newWorkersVerified: number;
  retainedActiveWorkers: number;
  basePoints: number;
  bonusPoints: number;
  payoutIDR: number;
  tier: "Bronze" | "Silver" | "Gold";
};
