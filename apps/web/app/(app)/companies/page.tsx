import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import Loader from "@/components/Loader/Loader";
import PageHeader from "@/components/PageHeader/PageHeader";
import { serverGraphql } from "@/lib/graphql/server";
import { prefetchQuery } from "@/lib/query/prefetch";
import { CompaniesQuery, companyKeys } from "@/services/companies";
import CompaniesList from "./CompaniesList";

export const metadata: Metadata = { title: "Companies" };

async function CompaniesData() {
  const { state } = await prefetchQuery(companyKeys.all, () =>
    serverGraphql(CompaniesQuery),
  );
  return (
    <HydrationBoundary state={state}>
      <CompaniesList />
    </HydrationBoundary>
  );
}

export default function CompaniesPage() {
  return (
    <>
      <PageHeader
        title="Companies"
        description="Companies are created automatically when you add an application."
      />
      <Suspense fallback={<Loader />}>
        <CompaniesData />
      </Suspense>
    </>
  );
}
