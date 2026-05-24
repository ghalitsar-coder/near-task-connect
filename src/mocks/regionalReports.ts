import type { RegionalReport } from "@/types/report";

const MONTHS = ["2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04"];

export const mockRegionalReports: RegionalReport[] = MONTHS.map((month, i) => {
  const base = 380 + i * 45;
  return {
    month,
    kelurahan: "Tegalrejo",
    totalOrders: base + 30,
    completedOrders: base,
    gmv: (base + 30) * 38_000,
    activeWorkers: 12 + i,
    newWorkers: 3 + (i % 4),
    avgCompletionMinutes: 52 - i,
    categoryBreakdown: [
      { category: "Bersih Rumah", orders: Math.round(base * 0.35), gmv: Math.round(base * 0.35 * 50_000) },
      { category: "Cuci Motor", orders: Math.round(base * 0.28), gmv: Math.round(base * 0.28 * 25_000) },
      { category: "Laundry", orders: Math.round(base * 0.2), gmv: Math.round(base * 0.2 * 30_000) },
      { category: "Tukang", orders: Math.round(base * 0.1), gmv: Math.round(base * 0.1 * 70_000) },
      { category: "Antar Jemput", orders: Math.round(base * 0.07), gmv: Math.round(base * 0.07 * 35_000) },
    ],
  };
});
