import { create } from "zustand";
import type { Worker, WorkerStatus } from "@/types/worker";
import { mockWorkers } from "@/mocks/workers";

type Filters = {
  q: string;
  status: WorkerStatus | "all";
};

type WorkersState = {
  workers: Worker[];
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, val: Filters[K]) => void;
  setStatus: (id: string, status: WorkerStatus) => void;
  addWorker: (w: Worker) => void;
  getById: (id: string) => Worker | undefined;
};

export const useWorkersStore = create<WorkersState>((set, get) => ({
  workers: mockWorkers,
  filters: { q: "", status: "all" },
  setFilter: (key, val) =>
    set((s) => ({ filters: { ...s.filters, [key]: val } })),
  setStatus: (id, status) =>
    set((s) => ({
      workers: s.workers.map((w) =>
        w.id === id
          ? {
              ...w,
              status,
              verifiedAt:
                status === "active" && !w.verifiedAt
                  ? new Date().toISOString()
                  : w.verifiedAt,
            }
          : w,
      ),
    })),
  addWorker: (w) => set((s) => ({ workers: [w, ...s.workers] })),
  getById: (id) => get().workers.find((w) => w.id === id),
}));
