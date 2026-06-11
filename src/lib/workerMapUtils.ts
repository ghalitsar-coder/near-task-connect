import type { NearbyWorker } from "@/lib/api/types";
import type { Worker } from "@/data/mockWorkers";
import { serviceBase } from "@/lib/api/config";

const dicebear = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e2f6d5`;

export function workerPhotoUrl(key?: string | null): string {
  if (!key) return "";
  return `${serviceBase()}/files/photo?key=${encodeURIComponent(key)}`;
}

/** Maps GET /workers/nearby items to NearbyMap worker markers. */
export function nearbyToMapWorker(w: NearbyWorker): Worker {
  const primary = w.skills[0]?.name ?? "";
  return {
    id: w.user_id,
    name: w.full_name,
    photo: w.profile_photo ? workerPhotoUrl(w.profile_photo) : dicebear(w.full_name),
    skills: w.skills.map((s) => s.name.toLowerCase()),
    primarySkill: primary,
    rating: w.rating_avg,
    ratingCount: w.rating_count,
    completedJobs: 0,
    distanceKm: Math.round((w.distance_m / 1000) * 10) / 10,
    lat: w.latitude,
    lng: w.longitude,
    hourlyRate: w.base_rate ?? 0,
    online: w.availability === "online",
    verifiedRT: w.verified_rt,
    bio: "",
    responseMin: 5,
  };
}
