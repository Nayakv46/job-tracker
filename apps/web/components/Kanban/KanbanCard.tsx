"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import StatusSelect from "@/components/StatusSelect/StatusSelect";
import type { ApplicationsQuery, ApplicationStatus } from "@/gql/graphql";
import { cn } from "@/lib/utils";
import { formatDate, formatSalary } from "@/lib/utils/format";

export type BoardApplication =
  ApplicationsQuery["applications"]["items"][number];

type KanbanCardProps = {
  application: BoardApplication;
  onStatusChange?: (status: ApplicationStatus) => void;
  // Rendered inside the drag overlay (a visual copy that follows the pointer)
  overlay?: boolean;
};

export const KanbanCardContent = ({
  application,
  onStatusChange,
  dragHandle,
  overlay,
}: KanbanCardProps & { dragHandle?: ReactNode }) => {
  const salary = formatSalary(application.salaryMin, application.salaryMax);
  const appliedAt = formatDate(application.appliedAt);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-popover p-3 shadow-xs",
        overlay && "rotate-2 shadow-lg",
      )}
    >
      <div className="flex items-start gap-1">
        {dragHandle}
        <div className="min-w-0 flex-1">
          <Link
            href={`/applications/${application.id}`}
            className="line-clamp-2 font-medium hover:underline"
          >
            {application.position}
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {application.company.name}
          </p>
        </div>
      </div>
      {(salary || appliedAt) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {salary && <span>{salary}</span>}
          {appliedAt && <span>Applied {appliedAt}</span>}
        </div>
      )}
      {onStatusChange && (
        <StatusSelect
          value={application.status}
          label={`Move ${application.position} to`}
          onChange={onStatusChange}
          className="w-full"
        />
      )}
    </div>
  );
};

const KanbanCard = ({ application, onStatusChange }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: application.id,
    data: { status: application.status },
  });

  return (
    <li
      ref={setNodeRef}
      data-flip-id={application.id}
      className={cn(isDragging && "opacity-40")}
    >
      <KanbanCardContent
        application={application}
        onStatusChange={onStatusChange}
        dragHandle={
          <button
            type="button"
            className="-ml-1 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
            aria-label={`Drag ${application.position} at ${application.company.name}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        }
      />
    </li>
  );
};

export default KanbanCard;
