import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title?: string;
  backTo?: string;
  right?: ReactNode;
  variant?: "canvas" | "sage";
}

export function TopNav({ title, backTo, right, variant = "canvas" }: Props) {
  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between px-4 py-3 ${
        variant === "sage" ? "bg-canvas-soft" : "bg-canvas border-b border-ink/10"
      }`}
    >
      <div className="flex items-center gap-3">
        {backTo ? (
          <Link
            to={backTo}
            className="size-10 rounded-full bg-canvas-soft flex items-center justify-center"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
          </Link>
        ) : (
          <Link to="/" className="font-display font-black text-xl tracking-tight">
            kerja<span className="text-ink">dekat</span>
            <span className="inline-block ml-1 size-2 rounded-full bg-primary align-middle" />
          </Link>
        )}
        {title && <h1 className="font-display font-black text-lg">{title}</h1>}
      </div>
      <div>{right}</div>
    </header>
  );
}
