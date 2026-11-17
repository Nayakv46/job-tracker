import { HydrationBoundary } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import KanbanBoard from "@/components/Kanban/KanbanBoard";
import Loader from "@/components/Loader/Loader";
import PageHeader from "@/components/PageHeader/PageHeader";
import { buttonVariants } from "@/components/ui/shadcn/button";
import { serverGraphql } from "@/lib/graphql/server";
import { prefetchQuery } from "@/lib/query/prefetch";
import {
  ApplicationsQuery,
  BOARD_VARIABLES,
  applicationKeys,
} from "@/services/applications";

export const metadata: Metadata = { title: "Board" };

// Server-rendered first paint; the board then lives in the React Query cache
async function BoardData() {
  const { state } = await prefetchQuery(
    applicationKeys.list(BOARD_VARIABLES),
    () => serverGraphql(ApplicationsQuery, BOARD_VARIABLES),
  );
  return (
    <HydrationBoundary state={state}>
      <KanbanBoard />
    </HydrationBoundary>
  );
}

export default function BoardPage() {
  return (
    <>
      <PageHeader
        title="Board"
        description="Drag cards between columns or use the status menu on a card."
        actions={
          <Link href="/applications/new" className={buttonVariants()}>
            <Plus aria-hidden />
            New application
          </Link>
        }
      />
      <Suspense fallback={<Loader />}>
        <BoardData />
      </Suspense>
    </>
  );
}
