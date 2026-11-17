import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Loader from "@/components/Loader/Loader";
import { GraphQLRequestError } from "@/lib/graphql/errors";
import { serverGraphql } from "@/lib/graphql/server";
import { prefetchQuery } from "@/lib/query/prefetch";
import { ApplicationQuery, applicationKeys } from "@/services/applications";
import ApplicationDetails from "./ApplicationDetails";

export const metadata: Metadata = { title: "Application" };

async function ApplicationData({
  params,
}: {
  params: PageProps<"/applications/[id]">["params"];
}) {
  const { id } = await params;

  let state;
  try {
    ({ state } = await prefetchQuery(applicationKeys.detail(id), () =>
      serverGraphql(ApplicationQuery, { id }),
    ));
  } catch (error) {
    // Unknown id, another user's application or a malformed id
    if (
      error instanceof GraphQLRequestError &&
      (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <HydrationBoundary state={state}>
      <ApplicationDetails id={id} />
    </HydrationBoundary>
  );
}

export default function ApplicationPage({
  params,
}: PageProps<"/applications/[id]">) {
  return (
    <Suspense fallback={<Loader />}>
      <ApplicationData params={params} />
    </Suspense>
  );
}
