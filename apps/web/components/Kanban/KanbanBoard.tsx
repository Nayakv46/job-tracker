"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import Loader from "@/components/Loader/Loader";
import type { ApplicationStatus } from "@/gql/graphql";
import {
  useApplications,
  useUpdateApplicationStatus,
} from "@/hooks/useApplications";
import { getErrorMessage } from "@/lib/graphql/errors";
import { STATUSES, STATUS_META, isApplicationStatus } from "@/lib/status";
import { showErrorToast } from "@/lib/toasts";
import { BOARD_VARIABLES } from "@/services/applications";
import { KanbanCardContent, type BoardApplication } from "./KanbanCard";
import KanbanColumn from "./KanbanColumn";

const KanbanBoard = () => {
  const { data, isPending, error } = useApplications(BOARD_VARIABLES);
  const updateStatus = useUpdateApplicationStatus();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // Small distance/delay so clicks and scrolling still work on cards
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const items = useMemo(() => data?.applications.items ?? [], [data]);
  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(
      STATUSES.map((status) => [status, [] as BoardApplication[]]),
    ) as Record<ApplicationStatus, BoardApplication[]>;
    items.forEach((item) => groups[item.status].push(item));
    return groups;
  }, [items]);

  if (isPending) return <Loader />;
  if (error) throw error;

  const findTitle = (id: string | number) => {
    const item = items.find((application) => application.id === id);
    return item ? `${item.position} at ${item.company.name}` : "Application";
  };
  const columnLabel = (id: string | number | undefined) =>
    isApplicationStatus(id) ? STATUS_META[id].label : "no column";

  // Screen reader announcements for keyboard drag and drop
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${findTitle(active.id)}.`,
    onDragOver: ({ active, over }) =>
      `${findTitle(active.id)} is over ${columnLabel(over?.id)}.`,
    onDragEnd: ({ active, over }) =>
      `${findTitle(active.id)} was dropped in ${columnLabel(over?.id)}.`,
    onDragCancel: ({ active }) =>
      `Moving ${findTitle(active.id)} was cancelled.`,
  };

  const changeStatus = (id: string, status: ApplicationStatus) => {
    updateStatus.mutate(
      { id, status },
      { onError: (err) => showErrorToast(getErrorMessage(err)) },
    );
  };

  const onDragStart = ({ active }: DragStartEvent) =>
    setActiveId(String(active.id));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const from = active.data.current?.status;
    if (over && isApplicationStatus(over.id) && over.id !== from) {
      changeStatus(String(active.id), over.id);
    }
  };

  const activeApplication = items.find((item) => item.id === activeId);
  const { total } = data.applications;

  return (
    <div className="flex flex-col gap-3">
      {total > items.length && (
        <p className="text-sm text-muted-foreground">
          Showing the {items.length} most recently updated of {total}{" "}
          applications.
        </p>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{ announcements }}
      >
        {/* Horizontal scroll on small screens, five columns on large ones */}
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <div className="grid min-w-[1100px] grid-cols-5 gap-3 xl:min-w-0">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                applications={byStatus[status]}
                onStatusChange={changeStatus}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeApplication ? (
            <KanbanCardContent application={activeApplication} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
