import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import type { Worker } from "@/types/worker";
import { tegalrejoPolygon, tegalrejoCenter } from "@/mocks/kelurahan";
import { STATUS_LABEL } from "@/types/worker";

// fix default icon paths
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl: iconRetina,
  shadowUrl,
});

const STATUS_COLOR: Record<Worker["status"], string> = {
  active: "#16a34a",
  pending_verification: "#f59e0b",
  suspended: "#737373",
  rejected: "#dc2626",
};

export default function TerritoryMap({ workers }: { workers: Worker[] }) {
  return (
    <MapContainer
      center={tegalrejoCenter}
      zoom={14}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polygon
        positions={tegalrejoPolygon}
        pathOptions={{
          color: "var(--color-primary)",
          fillColor: "var(--color-primary)",
          fillOpacity: 0.08,
          weight: 2,
        }}
      />
      {workers.map((w) => (
        <CircleMarker
          key={w.id}
          center={[w.geo.lat, w.geo.lng]}
          radius={8}
          pathOptions={{
            color: STATUS_COLOR[w.status],
            fillColor: STATUS_COLOR[w.status],
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Popup>
            <div style={{ fontFamily: "inherit" }}>
              <strong>{w.fullName}</strong>
              <br />
              <span style={{ fontSize: 12, color: "#666" }}>
                {w.id} · {STATUS_LABEL[w.status]}
              </span>
              <br />
              <span style={{ fontSize: 12 }}>
                RT {w.rt}/RW {w.rw}
              </span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
