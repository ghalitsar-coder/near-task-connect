import { createFileRoute, Link } from "@tanstack/react-router";
import { mockServices } from "@/data/mockServices";
import { mockWorkers } from "@/data/mockWorkers";
import { formatIDR } from "@/lib/formatCurrency";

export const Route = createFileRoute("/consumer/services")({
  head: () => ({ meta: [{ title: "Kategori Jasa · KerjaDekat" }] }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <main className="px-5 pt-6">
      <h1 className="display-md">Kategori jasa</h1>
      <p className="text-body mt-1">5 kategori esensial untuk MVP.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {mockServices.map((s) => {
          const count = mockWorkers.filter((w) => w.skills.includes(s.slug) && w.online).length;
          return (
            <Link
              key={s.id}
              to="/consumer"
              className="card-content flex flex-col gap-2"
            >
              <div className="text-4xl">{s.icon}</div>
              <div className="font-display font-black">{s.name}</div>
              <div className="text-xs text-body">{s.description}</div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <span className="text-xs text-mute">mulai {formatIDR(s.basePrice)}</span>
                <span className="badge-positive text-[11px] !py-0.5">{count} online</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
