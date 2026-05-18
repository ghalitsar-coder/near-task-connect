export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_match: "Mencari pekerja",
  offered: "Menunggu respons",
  accepted: "Diterima pekerja",
  in_progress: "Sedang dikerjakan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

/** Timeline steps shown on order detail (MVP backend statuses). */
export const ORDER_STATUS_FLOW = [
  "pending_match",
  "offered",
  "accepted",
  "in_progress",
  "completed",
] as const;

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status;
}

export function paymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Menunggu pembayaran",
    authorized: "Dana ditahan",
    captured: "Dana dicapture",
    voided: "Dana dikembalikan",
    failed: "Pembayaran gagal",
  };
  return map[status] ?? status;
}

export function skillEmoji(name: string): string {
  const key = name.toLowerCase();
  if (key.includes("ledeng")) return "🔧";
  if (key.includes("listrik")) return "⚡";
  if (key.includes("bersih")) return "🧹";
  if (key.includes("tukang") || key.includes("bangun")) return "🧱";
  if (key.includes("kebun")) return "🌿";
  return "🛠️";
}
