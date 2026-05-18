export interface Worker {
  id: string;
  name: string;
  photo: string; // dicebear url
  skills: string[]; // service slugs
  primarySkill: string;
  rating: number;
  ratingCount: number;
  completedJobs: number;
  distanceKm: number;
  lat: number;
  lng: number;
  hourlyRate: number;
  online: boolean;
  verifiedRT: boolean;
  bio: string;
  responseMin: number;
}

// Seed location: Kelurahan Tebet, Jakarta Selatan
export const SEED_LAT = -6.2349;
export const SEED_LNG = 106.857;

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e2f6d5`;

export const mockWorkers: Worker[] = [
  { id: "w-001", name: "Pak Hendra", photo: avatar("Hendra"), skills: ["ledeng", "listrik"], primarySkill: "ledeng", rating: 4.9, ratingCount: 128, completedJobs: 312, distanceKm: 0.4, lat: -6.2342, lng: 106.8588, hourlyRate: 75000, online: true, verifiedRT: true, bio: "12 tahun pengalaman ledeng & instalasi air. Domisili Tebet Timur.", responseMin: 3 },
  { id: "w-002", name: "Bu Sari", photo: avatar("Sari"), skills: ["bersih"], primarySkill: "bersih", rating: 4.8, ratingCount: 96, completedJobs: 220, distanceKm: 0.7, lat: -6.236, lng: 106.855, hourlyRate: 55000, online: true, verifiedRT: true, bio: "Bersih-bersih rumah cepat & rapi. Bisa harian atau borongan.", responseMin: 5 },
  { id: "w-003", name: "Pak Yusuf", photo: avatar("Yusuf"), skills: ["listrik"], primarySkill: "listrik", rating: 4.7, ratingCount: 64, completedJobs: 145, distanceKm: 1.2, lat: -6.231, lng: 106.861, hourlyRate: 90000, online: true, verifiedRT: true, bio: "Spesialis instalasi listrik & MCB. Sertifikasi pelatihan PLN.", responseMin: 4 },
  { id: "w-004", name: "Pak Budi", photo: avatar("Budi"), skills: ["kuli", "ledeng"], primarySkill: "kuli", rating: 4.6, ratingCount: 42, completedJobs: 88, distanceKm: 1.6, lat: -6.2305, lng: 106.853, hourlyRate: 110000, online: true, verifiedRT: true, bio: "Kuli bangunan & bongkar pasang. Tenaga kuat, jujur.", responseMin: 6 },
  { id: "w-005", name: "Pak Andi", photo: avatar("Andi"), skills: ["taman", "bersih"], primarySkill: "taman", rating: 4.9, ratingCount: 51, completedJobs: 134, distanceKm: 2.1, lat: -6.239, lng: 106.864, hourlyRate: 70000, online: false, verifiedRT: true, bio: "Rawat taman, potong rumput, atur tanaman hias.", responseMin: 8 },
  { id: "w-006", name: "Bu Rina", photo: avatar("Rina"), skills: ["bersih"], primarySkill: "bersih", rating: 4.5, ratingCount: 22, completedJobs: 47, distanceKm: 2.4, lat: -6.241, lng: 106.852, hourlyRate: 50000, online: true, verifiedRT: false, bio: "Baru bergabung, sudah punya pengalaman 3 tahun cleaning service hotel.", responseMin: 7 },
  { id: "w-007", name: "Pak Joko", photo: avatar("Joko"), skills: ["listrik", "ledeng"], primarySkill: "listrik", rating: 4.8, ratingCount: 73, completedJobs: 180, distanceKm: 3.0, lat: -6.228, lng: 106.866, hourlyRate: 85000, online: true, verifiedRT: true, bio: "Listrik & ledeng kombo. Bisa panggilan malam.", responseMin: 5 },
  { id: "w-008", name: "Pak Dimas", photo: avatar("Dimas"), skills: ["kuli"], primarySkill: "kuli", rating: 4.4, ratingCount: 18, completedJobs: 34, distanceKm: 4.2, lat: -6.245, lng: 106.85, hourlyRate: 100000, online: true, verifiedRT: true, bio: "Bantu pindahan & angkat barang berat.", responseMin: 10 },
];
