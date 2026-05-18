import { useWorkersStore } from "@/stores/useWorkersStore";

export function useAlertCount() {
  return useWorkersStore((s) =>
    s.workers.filter((w) => {
      if (w.status !== "pending_verification") return false;
      const hrs = (Date.now() - new Date(w.registeredAt).getTime()) / 3_600_000;
      return hrs >= 24;
    }).length,
  );
}
