import type { Worker, WorkerSkill, WorkerStatus } from "@/types/worker";

const SKILLS: WorkerSkill[] = [
  "bersih_rumah",
  "cuci_motor",
  "tukang",
  "laundry",
  "antar_jemput",
  "kebun",
];

const FIRST_NAMES = [
  "Slamet",
  "Bambang",
  "Siti",
  "Rina",
  "Agus",
  "Wahyu",
  "Tini",
  "Marni",
  "Dedi",
  "Joko",
  "Sri",
  "Endang",
  "Rudi",
  "Yanti",
  "Putri",
  "Iwan",
  "Hadi",
  "Lestari",
  "Suparman",
  "Tutik",
  "Bayu",
  "Nur",
  "Tono",
];
const LAST_NAMES = [
  "Riyadi",
  "Saputra",
  "Wulandari",
  "Pratama",
  "Kusuma",
  "Hartono",
  "Wibowo",
  "Sari",
  "Setiawan",
  "Nugroho",
];

const CENTER = { lat: -7.7705, lng: 110.358 };

function rand(seed: number) {
  // mulberry32
  let t = seed + 0x6d2b79f5;
  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

function pickSkills(r: () => number): WorkerSkill[] {
  const n = 1 + Math.floor(r() * 2);
  const pool = [...SKILLS].sort(() => r() - 0.5);
  return pool.slice(0, n);
}

function makeNik(r: () => number) {
  let s = "3471";
  for (let i = 0; i < 12; i++) s += Math.floor(r() * 10);
  return s;
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

function build(): Worker[] {
  const out: Worker[] = [];
  const r = rand(42);

  // distribute statuses: 14 active, 6 pending, 2 suspended, 1 rejected = 23
  const plan: { status: WorkerStatus; count: number }[] = [
    { status: "active", count: 14 },
    { status: "pending_verification", count: 6 },
    { status: "suspended", count: 2 },
    { status: "rejected", count: 1 },
  ];

  let id = 1;
  plan.forEach(({ status, count }) => {
    for (let i = 0; i < count; i++) {
      const first = pick(r, FIRST_NAMES);
      const last = pick(r, LAST_NAMES);
      const fullName = `${first} ${last}`;
      const gender = r() > 0.5 ? "L" : "P";
      const nik = makeNik(r);
      const lat = CENTER.lat + (r() - 0.5) * 0.04;
      const lng = CENTER.lng + (r() - 0.5) * 0.04;

      // OCR confidence: pending has lower / mismatches
      const confidence =
        status === "pending_verification"
          ? 0.6 + r() * 0.2
          : status === "active"
            ? 0.9 + r() * 0.09
            : 0.75 + r() * 0.2;

      const mismatch =
        status === "pending_verification" && r() > 0.55 ? ["address"] : [];

      const registeredDaysAgo =
        status === "pending_verification"
          ? r() > 0.5
            ? 1 + r() * 2
            : 0.3 + r() * 0.6
          : 30 + r() * 180;

      const rating = status === "suspended" ? 2.8 + r() * 0.6 : 4.2 + r() * 0.7;
      const completed =
        status === "active"
          ? 30 + Math.floor(r() * 200)
          : status === "suspended"
            ? Math.floor(r() * 10)
            : 0;
      const earnings =
        status === "active" ? 800_000 + Math.floor(r() * 2_500_000) : 0;

      out.push({
        id: `WRK-${String(id).padStart(4, "0")}`,
        fullName,
        nik,
        phone: `+62 81${Math.floor(r() * 9) + 1}-${Math.floor(
          1000 + r() * 8999,
        )}-${Math.floor(1000 + r() * 8999)}`,
        gender,
        birthPlace: pick(r, ["Yogyakarta", "Sleman", "Bantul", "Magelang", "Klaten"]),
        birthDate: `${1975 + Math.floor(r() * 25)}-${String(
          1 + Math.floor(r() * 12),
        ).padStart(2, "0")}-${String(1 + Math.floor(r() * 27)).padStart(2, "0")}`,
        address: `Jl. ${pick(r, ["Magelang", "Kaliurang", "Godean", "Wates", "Solo"])} Km ${Math.floor(r() * 8) + 1} No. ${Math.floor(r() * 200) + 1}`,
        rt: String(Math.floor(r() * 10) + 1).padStart(2, "0"),
        rw: String(Math.floor(r() * 12) + 1).padStart(2, "0"),
        kelurahan: "Tegalrejo",
        skills: pickSkills(r),
        ktpImageUrl: "",
        faceImageUrl: "",
        ocr: {
          confidence,
          extracted: {
            nik,
            name: fullName.toUpperCase(),
            birthDate: "01-01-1985",
            address: `JL ${pick(r, ["MAGELANG", "KALIURANG", "GODEAN"]).toUpperCase()} KM ${Math.floor(r() * 8) + 1}`,
          },
          mismatchFields: mismatch,
        },
        liveness: {
          passed: status !== "rejected",
          score: 0.7 + r() * 0.29,
        },
        status,
        registeredAt: isoDaysAgo(registeredDaysAgo),
        verifiedAt:
          status === "active" || status === "suspended"
            ? isoDaysAgo(registeredDaysAgo - 0.2)
            : undefined,
        geo: {
          lat,
          lng,
          lastSeenAt: isoDaysAgo(r() * 0.5),
        },
        rating: Math.round(rating * 10) / 10,
        completedJobs: completed,
        earningsThisMonth: earnings,
      });
      id++;
    }
  });

  return out;
}

export const mockWorkers: Worker[] = build();
