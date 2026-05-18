import type { NearbyWorker } from "@/lib/api/types";
import type { Worker } from "@/data/mockWorkers";

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e2f6d5`;

/** Maps GET /workers/nearby items to NearbyMap worker markers. */
export function nearbyToMapWorker(w: NearbyWorker): Worker {
  const primary = w.skills[0]?.name ?? "";
  return {
    id: w.user_id,
    name: w.full_name,
    photo: avatar(w.full_name),
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
