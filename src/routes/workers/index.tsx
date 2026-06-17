import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell, Power, Star, ListOrdered, Sparkles, MapPin, Grip,
  CheckCircle2, Loader2, Navigation, Clock, TrendingUp,
  Users, Award,
} from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";
import { formatIDR } from "@/lib/formatCurrency";
import { orderStatusLabel, skillEmoji } from "@/lib/orderLabels";
import { Map, MapMarker, MarkerContent, MarkerLabel } from "@/components/ui/map";
import type { ApiOrder, ApiNullPoint } from "@/lib/api/types";

export const Route = createFileRoute("/workers/")({
  head: () => ({ meta: [{ title: "Dasbor Pekerja · KerjaDekat" }] }),
  component: WorkerDashboard,
});

type WorkerProfileData = {
  ID: string;
  UserID: string;
  Bio?: string | null;
  BaseRate?: number | null;
  Availability: string;
  LastLocation?: ApiNullPoint | null;
  RatingAvg: number;
  RatingCount: number;
  TotalJobsDone: number;
  CreditScore: number;
};

const DEFAULT_LAT = -6.9175;
const DEFAULT_LNG = 107.6191;

async function fetchJson<T>(url: string, accessToken: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function readUserPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG }),
      { timeout: 5000, enableHighAccuracy: false },
    );
  });
}

function WorkerDashboard() {
  const navigate = useNavigate();
  const accessToken = useSessionStore((s) => s.accessToken);
  const name = useSessionStore((s) => s.name);
  const authed = useSessionStore((s) => s.authed);
  const signOut = useSessionStore((s) => s.signOut);

  const [mapCenter, setMapCenter] = useState<[number, number]>([DEFAULT_LNG, DEFAULT_LAT]);
  const [locationPin, setLocationPin] = useState<{ lat: number; lng: number }>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [geoLoaded, setGeoLoaded] = useState(false);
  const geoInit = useRef(false);

  useEffect(() => {
    if (geoInit.current) return;
    geoInit.current = true;
    readUserPosition().then((pos) => {
      setMapCenter([pos.lng, pos.lat]);
      setLocationPin(pos);
      setGeoLoaded(true);
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["worker-profile", accessToken],
    queryFn: () => fetchJson<WorkerProfileData>("/api/v1/workers/me", accessToken ?? ""),
    enabled: authed && Boolean(accessToken),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["worker-orders-v2", accessToken],
    queryFn: () => fetchJson<{ items: ApiOrder[] }>("/api/v1/orders", accessToken ?? ""),
    enabled: authed && Boolean(accessToken),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (profile?.LastLocation?.Valid && !geoLoaded) {
      setMapCenter([profile.LastLocation.Lng, profile.LastLocation.Lat]);
      setLocationPin({ lat: profile.LastLocation.Lat, lng: profile.LastLocation.Lng });
    }
  }, [profile, geoLoaded]);

  const updateLocation = async (lat: number, lng: number) => {
    setLocationPin({ lat, lng });
    setMapCenter([lng, lat]);
    try {
      await fetch("/api/v1/workers/me/location", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
    } catch { /* ignore */ }
  };

  const toggleAvailability = async () => {
    const next = profile?.Availability === "online" ? "offline" : "online";
    try {
      await fetch("/api/v1/workers/me/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ availability: next }),
      });
    } catch { /* ignore */ }
  };

  const orders = ordersData?.items ?? [];
  const completedOrders = orders.filter((o) => o.Status === "completed");
  const todayEarning = completedOrders.reduce((s, o) => s + (o.AgreedRate ?? 0), 0);
  const todayJobs = completedOrders.length;
  const offeredOrders = orders.filter((o) => o.Status === "offered" || o.Status === "pending_match");
  const activeOrders = orders.filter((o) =>
    ["pending_match", "offered", "accepted", "worker_departed", "in_progress"].includes(o.Status),
  );
  const recentOrders = orders.slice(0, 5);
  const isOnline = profile?.Availability === "online";

  const bio = profile?.Bio ?? "Tukang serba bisa";
  const rating = profile?.RatingAvg ?? 0;
  const ratingCount = profile?.RatingCount ?? 0;
  const totalJobs = profile?.TotalJobsDone ?? 0;
  const creditScore = profile?.CreditScore ?? 0;
  const baseRate = profile?.BaseRate;

  return (
    <div className="min-h-screen bg-[#e8ebe6]">
      {/* --- Top Navigation --- */}
      <header className="bg-[#ffffff] border-b border-ink/10 px-6 lg:px-10 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-display font-black text-xl text-[#054d28]">
            kerjadekat<span className="inline-block ml-1 size-2 rounded-full bg-[#9fe870] align-middle" />
          </Link>
          <span className="hidden sm:inline text-sm text-mute font-semibold">Mitra</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleAvailability}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border transition-colors ${
              isOnline
                ? "bg-[#e2f6d5] text-[#054d28] border-[#9fe870]"
                : "bg-[#ffffff] text-mute border-ink/10"
            }`}
          >
            <span className={`size-2 rounded-full ${isOnline ? "bg-[#2ecc40]" : "bg-mute"}`} />
            {isOnline ? "Online" : "Offline"}
          </button>
          <button
            type="button"
            onClick={() => { signOut(); navigate({ to: "/" }); }}
            className="text-xs font-semibold text-mute hover:text-[#054d28] transition-colors"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          {/* --- Left Column: Profile & Stats --- */}
          <div className="space-y-4">
            {/* Profile Card */}
            <div className="rounded-[24px] bg-[#ffffff] p-6">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full bg-[#9fe870] flex items-center justify-center font-display font-black text-2xl text-[#054d28] shrink-0">
                  {name[0] ?? "?"}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-black text-lg truncate">{name}</div>
                  <div className="text-sm text-body truncate">{bio}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Star className="size-4 fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
                </span>
                <span className="text-mute">({ratingCount} ulasan)</span>
                {baseRate != null && (
                  <span className="text-mute">· {formatIDR(baseRate)}/jam</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="rounded-[16px] bg-[#e8ebe6] p-4">
                  <div className="text-xs text-mute font-semibold uppercase tracking-wider">Pendapatan</div>
                  <div className="font-display font-black text-xl mt-1 text-[#054d28]">{formatIDR(todayEarning)}</div>
                  <div className="text-xs text-mute mt-0.5">hari ini</div>
                </div>
                <div className="rounded-[16px] bg-[#e8ebe6] p-4">
                  <div className="text-xs text-mute font-semibold uppercase tracking-wider">Pekerjaan</div>
                  <div className="font-display font-black text-xl mt-1 text-[#054d28]">{totalJobs}</div>
                  <div className="text-xs text-mute mt-0.5">total selesai</div>
                </div>
                <div className="rounded-[16px] bg-[#e8ebe6] p-4">
                  <div className="text-xs text-mute font-semibold uppercase tracking-wider">Skor Kredit</div>
                  <div className="font-display font-black text-xl mt-1 text-[#054d28]">{creditScore}</div>
                </div>
                <div className="rounded-[16px] bg-[#e8ebe6] p-4">
                  <div className="text-xs text-mute font-semibold uppercase tracking-wider">Rating</div>
                  <div className="font-display font-black text-xl mt-1 text-[#054d28]">
                    {rating > 0 ? (rating * 20).toFixed(0) : "—"}%
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/workers/orders"
                className="rounded-[24px] bg-[#ffffff] p-4 flex items-center gap-3 hover:bg-[#f5f5f5] transition-colors"
              >
                <div className="size-12 rounded-full bg-[#e8ebe6] flex items-center justify-center">
                  <ListOrdered size={20} className="text-[#054d28]" />
                </div>
                <div>
                  <div className="font-semibold">Pesanan</div>
                  <div className="text-xs text-mute">{orders.length} total</div>
                </div>
              </Link>
              <Link
                to="/workers/wallet"
                className="rounded-[24px] bg-[#ffffff] p-4 flex items-center gap-3 hover:bg-[#f5f5f5] transition-colors"
              >
                <div className="size-12 rounded-full bg-[#e8ebe6] flex items-center justify-center">
                  <Award size={20} className="text-[#054d28]" />
                </div>
                <div>
                  <div className="font-semibold">Wallet</div>
                  <div className="text-xs text-mute">Saldo & riwayat</div>
                </div>
              </Link>
            </div>
          </div>

          {/* --- Right Column: Map --- */}
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-[24px] border border-ink/10 bg-[#ffffff]" style={{ minHeight: "400px" }}>
              <Map center={mapCenter} zoom={14} className="h-full w-full min-h-[400px]">
                <MapMarker
                  draggable
                  longitude={locationPin.lng}
                  latitude={locationPin.lat}
                  onDrag={(lngLat) => updateLocation(lngLat.lat, lngLat.lng)}
                >
                  <MarkerContent>
                    <div className="cursor-move">
                      <MapPin className="fill-[#9fe870] stroke-white drop-shadow-md" size={36} />
                    </div>
                    <MarkerLabel position="top">Lokasi kamu — geser untuk update</MarkerLabel>
                  </MarkerContent>
                </MapMarker>
              </Map>

              {/* Floating order badges */}
              {offeredOrders.length > 0 && (
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                  <div className="rounded-[24px] bg-[#ffffff] border border-ink/10 shadow-sm px-4 py-2 text-xs font-semibold flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500" />
                    {offeredOrders.length} tawaran masuk
                  </div>
                </div>
              )}

              {isOnline && activeOrders.length === 0 && offeredOrders.length === 0 && (
                <div className="absolute bottom-3 left-3 z-10">
                  <div className="rounded-[24px] bg-[#ffffff]/90 backdrop-blur-sm border border-ink/10 shadow-sm px-4 py-2 text-xs font-semibold flex items-center gap-2 text-mute">
                    <Bell size={14} className="animate-pulse" />
                    Menunggu tawaran…
                  </div>
                </div>
              )}
            </div>

            {/* Offer alert — high priority */}
            {offeredOrders.length > 0 && (
              <Link
                to="/workers/orders/$id"
                params={{ id: offeredOrders[0].ID }}
                className="rounded-[24px] bg-[#ffffff] p-4 border-l-4 border-l-amber-400 flex items-center gap-3 hover:bg-[#f5f5f5] transition-colors"
              >
                <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <Sparkles size={20} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm">Tawaran masuk!</div>
                  <div className="text-xs text-body truncate">
                    {offeredOrders.length} tawaran — {skillEmoji(offeredOrders[0].Skill?.Name ?? "")} {offeredOrders[0].Skill?.Name ?? "Jasa"}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#054d28]">Lihat</span>
              </Link>
            )}

            {!isOnline && (
              <div className="rounded-[24px] bg-[#ffffff] p-4 text-sm text-mute text-center">
                Kamu sedang offline. Konsumen tidak akan melihatmu di daftar pekerja terdekat.
              </div>
            )}
          </div>
        </div>

        {/* --- Bottom Section: Active Orders & Recent --- */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-black text-lg">Pesanan Aktif</h2>
                <Link to="/workers/orders" className="text-sm font-semibold text-[#054d28] underline">Lihat Semua</Link>
              </div>
              <div className="space-y-2">
                {activeOrders.slice(0, 5).map((o) => (
                  <Link
                    key={o.ID}
                    to="/workers/orders/$id"
                    params={{ id: o.ID }}
                    className="rounded-[24px] bg-[#ffffff] p-4 flex items-center gap-3 hover:bg-[#f5f5f5] transition-colors"
                  >
                    <div className="text-2xl">{skillEmoji(o.Skill?.Name ?? "")}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{o.Skill?.Name ?? "Jasa"}</div>
                      <div className="text-xs text-mute">
                        {orderStatusLabel(o.Status)}
                        {o.AgreedRate != null && ` · ${formatIDR(o.AgreedRate)}`}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#054d28]">›</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-black text-lg">Riwayat Terakhir</h2>
              </div>
              <div className="space-y-2">
                {recentOrders.map((o) => (
                  <Link
                    key={o.ID}
                    to="/workers/orders/$id"
                    params={{ id: o.ID }}
                    className="rounded-[24px] bg-[#ffffff] p-4 flex items-center gap-3 hover:bg-[#f5f5f5] transition-colors"
                  >
                    <div className="text-2xl">{skillEmoji(o.Skill?.Name ?? "")}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{o.Skill?.Name ?? "Jasa"}</div>
                      <div className="text-xs text-mute">{orderStatusLabel(o.Status)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-black text-sm">
                        {o.AgreedRate != null ? formatIDR(o.AgreedRate) : "—"}
                      </div>
                      {o.PaymentStatus === "completed" && (
                        <div className="text-xs text-[#2ecc40] flex items-center gap-1">
                          <CheckCircle2 size={12} /> Lunas
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no orders */}
          {activeOrders.length === 0 && recentOrders.length === 0 && (
            <div className="lg:col-span-2">
              <div className="rounded-[24px] bg-[#ffffff] p-10 text-center">
                <div className="size-16 rounded-full bg-[#e8ebe6] mx-auto flex items-center justify-center">
                  <Bell size={28} className="text-mute" />
                </div>
                <div className="font-display font-black text-lg mt-4">Siap menerima tawaran</div>
                <p className="text-sm text-body mt-1">
                  Halaman ini otomatis mendeteksi tawaran baru.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
