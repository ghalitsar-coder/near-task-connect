import type { SlaAlert } from "@/types/alert";
import { mockWorkers } from "./workers";

export const mockSlaAlerts: SlaAlert[] = mockWorkers
  .filter((w) => w.status === "pending_verification")
  .map((w, i) => {
    const ageHours = Math.round(
      (Date.now() - new Date(w.registeredAt).getTime()) / 3_600_000,
    );
    return {
      id: `SLA-${String(i + 1).padStart(2, "0")}`,
      workerId: w.id,
      type: "verification_overdue" as const,
      ageHours,
      severity: ageHours >= 24 ? "critical" : "warning",
      createdAt: w.registeredAt,
    };
  })
  .filter((a) => a.ageHours >= 8);
