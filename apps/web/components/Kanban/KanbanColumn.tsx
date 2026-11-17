"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { ApplicationStatus } from "@/gql/graphql";
import { STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import KanbanCard, { type BoardApplication } from "./KanbanCard";

type KanbanColumnProps = {
  status: ApplicationStatus;
  applications: BoardApplication[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
};

const KanbanColumn = ({
  status,
  applications,
  onStatusChange,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status];
  const headingId = `column-${status}`;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cn(
        "flex min-h-64 flex-col gap-3 rounded-xl border bg-card/60 p-3 transition-colors",
        isOver && "border-ring bg-accent",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <span
            className={cn("size-2 rounded-full", meta.dotClass)}
            aria-hidden
          />
          {meta.label}
          <span className="rounded-full bg-background px-2 text-xs font-normal text-muted-foreground tabular-nums">
            {applications.length}
          </span>
        </h2>
        <Link
          href={`/applications/new?status=${status}`}
          aria-label={`Add application to ${meta.label}`}
          className="rounded p-1 text-muted-foreground transition hover:bg-background hover:text-foreground"
        >
          <Plus className="size-4" aria-hidden />
        </Link>
      </div>

      <ul className="flex flex-1 flex-col gap-2">
        {applications.map((application) => (
          <KanbanCard
            key={application.id}
            application={application}
            onStatusChange={(next) => onStatusChange(application.id, next)}
          />
        ))}
        {applications.length === 0 && (
          <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Drop applications here
          </li>
        )}
      </ul>
    </section>
  );
};

export default KanbanColumn;
