export type Order = {
  id: string;
  workerId: string;
  customerName: string;
  category: string;
  price: number;
  adminFee: number;
  status: "created" | "accepted" | "on_the_way" | "done" | "cancelled";
  createdAt: string;
  completedAt?: string;
  distanceKm: number;
};
