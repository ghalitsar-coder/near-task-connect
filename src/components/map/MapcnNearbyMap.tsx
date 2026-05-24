"use client";

import { useEffect, useMemo, useState } from "react";
import { Map, MapMarker, MarkerContent, MarkerLabel, MarkerPopup, MapRoute } from "@/components/ui/map";
import type { Worker } from "@/data/mockWorkers";
import { formatIDR } from "@/lib/formatCurrency";
import { Clock, Route, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  center: [number, number];
  workers?: Worker[];
  height?: string;
  selectedWorkerId?: string | null;
  onSelectWorker?: (id: string) => void;
  showUser?: boolean;
  zoom?: number;
  kelurahans?: Array<{
    ID: number;
    Name: string;
    Kecamatan?: string;
    Centroid?: { Lat: number; Lng: number; Valid: boolean };
  }>;
  selectedKelurahanId?: number | null;
  onKelurahanSelect?: (id: number) => void;
}

export function MapcnNearbyMap({
  center,
  workers = [],
  height = "320px",
  selectedWorkerId,
  onSelectWorker,
  showUser = true,
  zoom = 13,
  kelurahans = [],
  selectedKelurahanId,
  onKelurahanSelect,
}: Props) {
  const [lat, lng] = center;
  const mapCenter: [number, number] = [lng, lat];
  const [routes, setRoutes] = useState<{ coordinates: [number, number][]; duration: number; distance: number }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const selectedWorker = useMemo(
    () => workers.find((w) => w.id === selectedWorkerId) ?? null,
    [workers, selectedWorkerId],
  );

  useEffect(() => {
    if (!selectedWorker || !showUser) {
      setRoutes([]);
      setSelectedIndex(0);
      setRouteLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchRoute = async () => {
      setRouteLoading(true);
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${selectedWorker.lng},${selectedWorker.lat}?overview=full&geometries=geojson&alternatives=true`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Route fetch failed");
        const data = (await response.json()) as {
          routes?: { geometry: { coordinates: [number, number][] }; duration: number; distance: number }[];
        };
        if (data.routes?.length) {
          const mapped = data.routes.map((route) => ({
            coordinates: route.geometry.coordinates,
            duration: route.duration,
            distance: route.distance,
          }));
          setRoutes(mapped);
          setSelectedIndex(0);
        } else {
          setRoutes([]);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setRoutes([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setRouteLoading(false);
        }
      }
    };

    fetchRoute();
    return () => controller.abort();
  }, [selectedWorker, showUser, lng, lat]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} mnt`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}j ${remainingMins}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const sortedRoutes = useMemo(
    () =>
      routes
        .map((route, index) => ({ route, index }))
        .sort((a, b) => {
          if (a.index === selectedIndex) return 1;
          if (b.index === selectedIndex) return -1;
          return 0;
        }),
    [routes, selectedIndex],
  );
  console.log(sortedRoutes);


  return (
    <div className="relative overflow-hidden rounded-[24px] border border-ink/10" style={{ height }}>
      <Map center={mapCenter} zoom={zoom} className="h-full w-full">
        {sortedRoutes.map(({ route, index }) => {
          const isSelected = index === selectedIndex;
          return (
            <MapRoute
              key={`${route.coordinates.length}-${index}`}
              coordinates={route.coordinates}
              color={isSelected ? "#0f5f3c" : "#42b883"}
              width={isSelected ? 7 : 5}
              opacity={isSelected ? 0.95 : 0.7}
              onClick={() => setSelectedIndex(index)}
            />
          );
        })}
        {showUser && (
          <MapMarker longitude={lng} latitude={lat}>
            <MarkerContent>
              <div className="size-7 rounded-full border border-ink bg-[#ffffff] flex items-center justify-center shadow-sm">
                <div className="size-2.5 rounded-full bg-[#9fe870]" />
              </div>
              <MarkerLabel position="top">Lokasi kamu</MarkerLabel>
            </MarkerContent>
          </MapMarker>
        )}
        {workers.map((w) => {
          const isSelected = selectedWorkerId === w.id;
          return (
            <MapMarker key={w.id} longitude={w.lng} latitude={w.lat}>
              <MarkerContent>
                <button
                  type="button"
                  onClick={() => onSelectWorker?.(w.id)}
                  className={`size-8 rounded-full border shadow-sm flex items-center justify-center text-[11px] font-semibold transition-transform ${isSelected
                    ? "bg-ink text-[#ffffff] border-ink"
                    : w.online
                      ? "bg-[#9fe870] text-ink border-[#9fe870]"
                      : "bg-[#ffffff] text-body border-ink/20"
                    }`}
                >
                  {w.name.split(" ")[1]?.[0] ?? w.name[0] ?? "?"}
                </button>
                <MarkerLabel position="bottom">{w.name}</MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="w-64 rounded-[24px] border border-ink/10 bg-[#ffffff] p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-full bg-[#e2f6d5] text-[#163300] flex items-center justify-center text-base font-bold">
                    {w.name.split(" ")[1]?.[0] ?? w.name[0] ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-black text-sm truncate">{w.name}</div>
                    <div className="text-xs text-body mt-0.5">
                      ⭐ {w.rating.toFixed(1)} ({w.ratingCount}) · {w.distanceKm} km
                    </div>
                    <div className="text-xs text-mute mt-1">
                      Estimasi tarif {formatIDR(w.hourlyRate)} / jam
                    </div>
                  </div>
                </div>

                {isSelected && routes[selectedIndex] && (
                  <div className="mt-3 rounded-[16px] bg-[#e8ebe6] px-3 py-2 text-xs text-ink flex items-center gap-2">
                    <Clock className="size-3.5" />
                    <span>{formatDuration(routes[selectedIndex].duration)}</span>
                    <Route className="size-3.5" />
                    <span>{formatDistance(routes[selectedIndex].distance)}</span>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectWorker?.(w.id)}
                    className={`flex-1 text-sm font-semibold rounded-[24px] px-3 py-2 border transition-colors ${isSelected
                      ? "bg-ink text-[#ffffff] border-ink"
                      : "bg-[#9fe870] text-ink border-[#9fe870] hover:bg-[#cdffad]"
                      }`}
                  >
                    {isSelected ? "Dipilih" : "Pilih mitra"}
                  </button>
                  {w.online ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e2f6d5] text-[#054d28] px-2 py-1 text-[11px] font-semibold">
                      <CheckCircle2 className="size-3" /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-ink/10 px-2 py-1 text-[11px] font-semibold text-mute">
                      Offline
                    </span>
                  )}
                </div>
              </MarkerPopup>
            </MapMarker>
          );
        })}
        {kelurahans.map((kel) => {
          if (!kel.Centroid?.Valid) return null;
          const isSelected = selectedKelurahanId === kel.ID;
          return (
            <MapMarker key={`kel-${kel.ID}`} longitude={kel.Centroid.Lng} latitude={kel.Centroid.Lat}>
              <MarkerContent>
                <button
                  type="button"
                  onClick={() => onKelurahanSelect?.(kel.ID)}
                  className={`size-8 rounded-full border-2 shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
                    isSelected
                      ? "bg-green-500 border-white"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {isSelected && <div className="size-2 rounded-full bg-white" />}
                </button>
                <MarkerLabel position="bottom">{kel.Name}</MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="w-56 rounded-[24px] border border-ink/10 bg-[#ffffff] p-3 shadow-lg">
                <div className="space-y-2">
                  <div>
                    <div className="font-display font-black text-sm">{kel.Name}</div>
                    {kel.Kecamatan && (
                      <div className="text-xs text-muted-foreground">{kel.Kecamatan}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onKelurahanSelect?.(kel.ID)}
                    className={`w-full text-sm font-semibold rounded-[24px] px-3 py-2 border transition-colors ${
                      isSelected
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-ink border-ink/20 hover:border-ink"
                    }`}
                  >
                    {isSelected ? "Terpilih" : "Pilih Kelurahan"}
                  </button>
                </div>
              </MarkerPopup>
            </MapMarker>
          );
        })}
      </Map>
      {routeLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#ffffff]/40 backdrop-blur-sm">
          <Loader2 className="size-5 animate-spin text-ink" />
        </div>
      )}
      {routes.length > 0 && selectedWorkerId && (
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {routes.map((route, index) => {
            const isActive = index === selectedIndex;
            const isFastest = index === selectedIndex && sortedRoutes[0]?.index === index;
            return (
              <button
                key={`route-chip-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`flex items-center gap-3 rounded-[24px] border px-3 py-2 text-xs font-semibold shadow-sm transition-colors ${isActive
                  ? "bg-ink text-[#ffffff] border-ink"
                  : "bg-[#ffffff] text-ink border-ink/10 hover:border-ink"
                  }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {formatDuration(route.duration)}
                </span>
                <span className={`inline-flex items-center gap-1.5 ${isActive ? "text-[#ffffff]/80" : "text-mute"}`}>
                  <Route className="size-3.5" />
                  {formatDistance(route.distance)}
                </span>


              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
