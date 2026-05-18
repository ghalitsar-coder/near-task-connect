import L from "leaflet";

// Fix the default marker icon paths so they don't 404 in a bundler.
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// @ts-expect-error private prop on Leaflet defaults
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

export const workerDivIcon = (label: string, online: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="
      background: ${online ? "#9fe870" : "#e8ebe6"};
      color: #0e0f0c;
      border: 2px solid #0e0f0c;
      border-radius: 9999px;
      padding: 4px 10px;
      font-weight: 700;
      font-size: 12px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      font-family: Inter, system-ui, sans-serif;
    ">${label}</div>`,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
  });

export const userDivIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="
      width: 18px; height: 18px; border-radius: 9999px;
      background: #38c8ff; border: 3px solid #fff;
      box-shadow: 0 0 0 2px #0e0f0c, 0 0 0 8px rgba(56,200,255,0.25);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
