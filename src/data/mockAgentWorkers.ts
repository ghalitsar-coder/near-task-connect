import { mockWorkers } from "./mockWorkers";

export interface AgentWorker {
  id: string;
  name: string;
  nik: string;
  primarySkill: string;
  kelurahan: string;
  registeredAt: string;
  verificationStatus: "pending" | "verified" | "rejected";
  online: boolean;
}

export const mockAgentWorkers: AgentWorker[] = mockWorkers.map((w, i) => ({
  id: w.id,
  name: w.name,
  nik: `3174${String(1000000000 + i * 12345).slice(0, 12)}`,
  primarySkill: w.primarySkill,
  kelurahan: i % 2 === 0 ? "Tebet Barat" : "Tebet Timur",
  registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 1) * 3).toISOString(),
  verificationStatus: w.verifiedRT ? "verified" : "pending",
  online: w.online,
}));

export const AGENT_INFO = {
  name: "Pak Slamet",
  role: "Agen Komunitas",
  kelurahan: "Tebet Barat",
  kecamatan: "Tebet",
  kota: "Jakarta Selatan",
};
