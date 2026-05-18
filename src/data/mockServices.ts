export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string; // emoji as lightweight icon
  basePrice: number; // IDR per visit
}

export const mockServices: ServiceCategory[] = [
  { id: "svc-ledeng", slug: "ledeng", name: "Tukang Ledeng", description: "Perbaikan pipa & kran bocor", icon: "🔧", basePrice: 75000 },
  { id: "svc-listrik", slug: "listrik", name: "Tukang Listrik", description: "Instalasi & perbaikan listrik rumah", icon: "💡", basePrice: 85000 },
  { id: "svc-bersih", slug: "bersih", name: "Jasa Kebersihan", description: "Bersih-bersih rumah & kantor", icon: "🧹", basePrice: 60000 },
  { id: "svc-kuli", slug: "kuli", name: "Kuli Bangunan", description: "Bantu angkat, bongkar, renovasi ringan", icon: "🧱", basePrice: 100000 },
  { id: "svc-taman", slug: "taman", name: "Tukang Kebun", description: "Potong rumput & rawat tanaman", icon: "🌿", basePrice: 70000 },
];
