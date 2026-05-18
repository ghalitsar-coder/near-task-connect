import { Link } from "@tanstack/react-router";
import { Star, MapPin, CheckCircle2 } from "lucide-react";
import type { Worker } from "@/data/mockWorkers";
import { formatIDR } from "@/lib/formatCurrency";

export function WorkerCard({ worker }: { worker: Worker }) {
  return (
    <Link
      to="/consumer/worker/$id"
      params={{ id: worker.id }}
      className="card-content flex items-center gap-4 hover:shadow-sm transition-shadow"
    >
      <img src={worker.photo} alt={worker.name} className="size-14 rounded-full bg-primary-pale shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-black text-base truncate">{worker.name}</h3>
          {worker.verifiedRT && (
            <CheckCircle2 size={14} className="text-positive shrink-0" aria-label="Verifikasi RT" />
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-body mt-0.5">
          <span className="inline-flex items-center gap-1">
            <Star size={12} className="fill-warning text-warning" /> {worker.rating}
            <span className="text-mute">({worker.ratingCount})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {worker.distanceKm} km
          </span>
        </div>
        <p className="text-sm text-body mt-1 truncate">{worker.bio}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="font-display font-black">{formatIDR(worker.hourlyRate)}</div>
        <div className="text-xs text-mute">/ jam</div>
        {worker.online ? (
          <span className="badge-positive mt-2">
            <span className="size-1.5 rounded-full bg-positive" /> Online
          </span>
        ) : (
          <span className="badge-neutral mt-2">Offline</span>
        )}
      </div>
    </Link>
  );
}
