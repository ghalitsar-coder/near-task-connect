import type { Order } from "@/types/order";
import { mockWorkers } from "./workers";

const CATEGORIES = ["Bersih Rumah", "Cuci Motor", "Laundry", "Tukang", "Antar Jemput"];
const NAMES = [
  "Pak Budi",
  "Bu Wati",
  "Mas Andi",
  "Mbak Rini",
  "Pak Hendra",
  "Bu Sinta",
  "Mas Eko",
  "Bu Maya",
];

function r(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export const mockOrders: Order[] = (() => {
  const rng = r(7);
  const activeWorkers = mockWorkers.filter((w) => w.status === "active");
  const out: Order[] = [];
  for (let i = 0; i < 180; i++) {
    const daysAgo = Math.floor(rng() * 60);
    const w = activeWorkers[Math.floor(rng() * activeWorkers.length)];
    const cat = CATEGORIES[Math.floor(rng() * CATEGORIES.length)];
    const price = 20_000 + Math.floor(rng() * 80_000);
    const created = new Date(Date.now() - daysAgo * 86400_000 - rng() * 86400_000);
    const status =
      rng() > 0.92 ? "cancelled" : rng() > 0.9 ? "on_the_way" : "done";
    out.push({
      id: `ORD-${String(i + 1).padStart(4, "0")}`,
      workerId: w.id,
      customerName: NAMES[Math.floor(rng() * NAMES.length)],
      category: cat,
      price,
      adminFee: 2_000,
      status,
      createdAt: created.toISOString(),
      completedAt:
        status === "done"
          ? new Date(created.getTime() + 30 * 60_000).toISOString()
          : undefined,
      distanceKm: Math.round(rng() * 4 * 10) / 10,
    });
  }
  return out.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
})();
