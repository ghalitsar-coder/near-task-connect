import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import { useMemo } from "react";
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

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10" style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
