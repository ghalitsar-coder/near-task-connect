export type OrderStatus =
  | "searching"
  | "broadcasting"
  | "matched"
  | "enroute"
  | "arrived"
  | "in_progress"
  | "awaiting_payment"
  | "completed"
  | "cancelled";

export interface OrderTimelineEvent {
  status: OrderStatus;
  label: string;
  at: string; // ISO
}

export interface Order {
  id: string;
  serviceId: string;
  workerId: string | null;
  status: OrderStatus;
  createdAt: string;
  addressLabel: string;
  lat: number;
  lng: number;
  notes: string;
  adminFee: number;
  estimatedPrice: number;
  paymentStatus: "pending" | "authorized" | "captured" | "voided";
  timeline: OrderTimelineEvent[];
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  searching: "Mencari pekerja",
  broadcasting: "Menawarkan ke pekerja terdekat",
  matched: "Pekerja diterima",
  enroute: "Pekerja menuju lokasi",
  arrived: "Pekerja tiba",
  in_progress: "Pekerjaan sedang berlangsung",
  awaiting_payment: "Menunggu konfirmasi pembayaran",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const mockOrders: Order[] = [
  {
    id: "ord-LIVE",
    serviceId: "svc-ledeng",
    workerId: "w-001",
    status: "enroute",
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    addressLabel: "Jl. Tebet Barat Dalam VIII no. 12, RT 03/RW 05",
    lat: -6.2349,
    lng: 106.857,
    notes: "Kran wastafel dapur bocor, sudah lapis tisu tapi masih netes.",
    adminFee: 2000,
    estimatedPrice: 95000,
    paymentStatus: "authorized",
    timeline: [
      { status: "searching", label: "Order dibuat", at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { status: "broadcasting", label: "Tawaran dikirim ke 6 pekerja terdekat", at: new Date(Date.now() - 1000 * 60 * 4.5).toISOString() },
      { status: "matched", label: "Pak Hendra menerima order", at: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
      { status: "enroute", label: "Pekerja dalam perjalanan", at: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
    ],
  },
  {
    id: "ord-HIST-1",
    serviceId: "svc-bersih",
    workerId: "w-002",
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    addressLabel: "Jl. Tebet Barat Dalam VIII no. 12",
    lat: -6.2349,
    lng: 106.857,
    notes: "Bersih-bersih general 2 kamar.",
    adminFee: 2000,
    estimatedPrice: 150000,
    paymentStatus: "captured",
    timeline: [],
  },
  {
    id: "ord-HIST-2",
    serviceId: "svc-listrik",
    workerId: "w-003",
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    addressLabel: "Jl. Tebet Barat Dalam VIII no. 12",
    lat: -6.2349,
    lng: 106.857,
    notes: "Pasang stop kontak baru di ruang tamu.",
    adminFee: 2000,
    estimatedPrice: 120000,
    paymentStatus: "captured",
    timeline: [],
  },
];
