export type WorkerStatus =
  | "pending_verification"
  | "active"
  | "suspended"
  | "rejected";

export type WorkerSkill =
  | "bersih_rumah"
  | "cuci_motor"
  | "tukang"
  | "laundry"
  | "antar_jemput"
  | "kebun";

export type Worker = {
  id: string;
  fullName: string;
  nik: string;
  phone: string;
  gender: "L" | "P";
  birthPlace: string;
  birthDate: string;
  address: string;
  rt: string;
  rw: string;
  kelurahan: string;
  skills: WorkerSkill[];
  ktpImageUrl: string;
  faceImageUrl: string;
  ocr: {
    confidence: number;
    extracted: {
      nik: string;
      name: string;
      birthDate: string;
      address: string;
    };
    mismatchFields: string[];
  };
  liveness: { passed: boolean; score: number };
  status: WorkerStatus;
  registeredAt: string;
  verifiedAt?: string;
  geo: { lat: number; lng: number; lastSeenAt: string };
  rating: number;
  completedJobs: number;
  earningsThisMonth: number;
};

export const SKILL_LABEL: Record<WorkerSkill, string> = {
  bersih_rumah: "Bersih Rumah",
  cuci_motor: "Cuci Motor",
  tukang: "Tukang",
  laundry: "Laundry",
  antar_jemput: "Antar Jemput",
  kebun: "Kebun",
};

export const STATUS_LABEL: Record<WorkerStatus, string> = {
  pending_verification: "Menunggu Verifikasi",
  active: "Aktif",
  suspended: "Ditangguhkan",
  rejected: "Ditolak",
};
