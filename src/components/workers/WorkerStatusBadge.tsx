import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type WorkerStatus } from "@/types/worker";
import { cn } from "@/lib/utils";

const STYLES: Record<WorkerStatus, string> = {
  active: "bg-success/15 text-success border-success/30",
  pending_verification: "bg-warning/20 text-foreground border-warning/40",
  suspended: "bg-muted text-muted-foreground border-border",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

export function WorkerStatusBadge({ status }: { status: WorkerStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-semibold", STYLES[status])}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
