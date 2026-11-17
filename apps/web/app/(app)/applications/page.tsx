import { HydrationBoundary } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Loader from "@/components/Loader/Loader";
import PageHeader from "@/components/PageHeader/PageHeader";
import { buttonVariants } from "@/components/ui/shadcn/button";
import { parseFilters, toQueryVariables } from "@/lib/applicationFilters";
import { serverGraphql } from "@/lib/graphql/server";
import { prefetchQuery } from "@/lib/query/prefetch";
import { ApplicationsQuery, applicationKeys } from "@/services/applications";
import ApplicationsList from "./ApplicationsList";

export const metadata: Metadata = { title: "Applications" };

async function ApplicationsData({
  searchParams,
}: {
  searchParams: PageProps<"/applications">["searchParams"];
}) {
  const variables = toQueryVariables(parseFilters(await searchParams));
  const { state } = await prefetchQuery(applicationKeys.list(variables), () =>
    serverGraphql(ApplicationsQuery, variables),
  );
  return (
    <HydrationBoundary state={state}>
      <ApplicationsList />
    </HydrationBoundary>
  );
}

export default function ApplicationsPage({
  searchParams,
}: PageProps<"/applications">) {
  return (
    <>
      <PageHeader
        title="Applications"
        description="Search, filter and browse all your applications."
        actions={
          <Link href="/applications/new" className={buttonVariants()}>
            <Plus aria-hidden />
            New application
          </Link>
        }
      />
      <Suspense fallback={<Loader />}>
        <ApplicationsData searchParams={searchParams} />
      </Suspense>
    </>
  );
}
