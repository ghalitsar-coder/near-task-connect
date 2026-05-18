export type Agent = {
  id: string;
  name: string;
  phone: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  avatarUrl?: string;
  joinedAt: string;
  incentiveTier: "Bronze" | "Silver" | "Gold";
};
