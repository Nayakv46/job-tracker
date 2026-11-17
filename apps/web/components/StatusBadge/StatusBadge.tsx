import type { ApplicationStatus } from "@/gql/graphql";
import { STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";

const StatusBadge = ({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) => {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        meta.badgeClass,
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", meta.dotClass)}
        aria-hidden
      />
      {meta.label}
    </span>
  );
};

export default StatusBadge;
