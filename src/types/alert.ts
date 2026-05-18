export type SlaAlert = {
  id: string;
  workerId: string;
  type: "verification_overdue";
  ageHours: number;
  severity: "warning" | "critical";
  createdAt: string;
};
