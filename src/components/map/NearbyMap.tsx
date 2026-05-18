import { MapContainer, TileLayer, Marker, Circle, Popup, Polyline } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { workerDivIcon, userDivIcon } from "@/lib/leafletIconFix";
import type { Worker } from "@/data/mockWorkers";

interface Props {
  center: [number, number];
  workers?: Worker[];
  radiusKm?: number;
  height?: string;
  selectedWorkerId?: string | null;
  onSelectWorker?: (id: string) => void;
  showUser?: boolean;
  zoom?: number;
}

export function NearbyMap({
  center,
  workers = [],
  radiusKm = 5,
  height = "320px",
  selectedWorkerId,
  onSelectWorker,
  showUser = true,
  zoom = 15,
}: Props) {
  const userIcon = useMemo(() => userDivIcon(), []);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const selectedWorker = useMemo(
    () => workers.find((w) => w.id === selectedWorkerId) ?? null,
    [workers, selectedWorkerId],
  );

  useEffect(() => {
    if (!selectedWorker || !showUser) {
      setRouteCoords([]);
      return;
    }

    const controller = new AbortController();
    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${center[1]},${center[0]};${selectedWorker.lng},${selectedWorker.lat}?overview=full&geometries=geojson`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Route fetch failed");
        const data = (await response.json()) as {
          routes?: { geometry: { coordinates: [number, number][] } }[];
        };
        const coords = data.routes?.[0]?.geometry.coordinates ?? [];
        setRouteCoords(coords.map(([lng, lat]) => [lat, lng]));
      } catch (error) {
        if (!controller.signal.aborted) {
          setRouteCoords([]);
        }
      }
    };

    fetchRoute();
    return () => controller.abort();
  }, [selectedWorker, showUser, center]);

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10" style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: "#0e0f0c", weight: 4, opacity: 0.85 }}
          />
        )}
        {showUser && (
          <>
            <Marker position={center} icon={userIcon} />
            <Circle
              center={center}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#0e0f0c", weight: 1, fillColor: "#9fe870", fillOpacity: 0.08 }}
            />
          </>
        )}
        {workers.map((w) => (
          <Marker
            key={w.id}
            position={[w.lat, w.lng]}
            icon={workerDivIcon(w.name.split(" ")[1] || w.name, w.online)}
            eventHandlers={{ click: () => onSelectWorker?.(w.id) }}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <div style={{ fontWeight: 700 }}>{w.name}</div>
                <div style={{ fontSize: 12, color: "#454745" }}>
                  ⭐ {w.rating} · {w.distanceKm} km
                </div>
                {selectedWorkerId === w.id && <div style={{ fontSize: 11, marginTop: 4 }}>Dipilih</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
