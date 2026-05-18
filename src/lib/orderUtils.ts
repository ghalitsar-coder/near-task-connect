import type { ApiNullPoint, ApiOrder } from "@/lib/api/types";

export function orderCoordinates(order: ApiOrder): [number, number] | null {
  const loc: ApiNullPoint | undefined = order.ConsumerLocation;
  if (loc?.Valid) return [loc.Lat, loc.Lng];
  return null;
}

export function orderMapCenter(order: ApiOrder, fallback: [number, number]): [number, number] {
  return orderCoordinates(order) ?? fallback;
}

export function canCancelOrder(status: string): boolean {
  return status === "pending_match" || status === "offered";
}
