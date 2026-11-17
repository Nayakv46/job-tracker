import type { Metadata } from "next";
import { Suspense } from "react";
import Loader from "@/components/Loader/Loader";
import PageHeader from "@/components/PageHeader/PageHeader";
import { isApplicationStatus } from "@/lib/status";
import NewApplicationForm from "./NewApplicationForm";

export const metadata: Metadata = { title: "New application" };

// `?status=INTERVIEW` preselects the status (used by the kanban column buttons)
async function NewApplication({
  searchParams,
}: {
  searchParams: PageProps<"/applications/new">["searchParams"];
}) {
  const { status } = await searchParams;
  return (
    <NewApplicationForm
      initialStatus={isApplicationStatus(status) ? status : undefined}
    />
  );
}

export default function NewApplicationPage({
  searchParams,
}: PageProps<"/applications/new">) {
  return (
    <>
      <PageHeader
        title="New application"
        description="Add a job you want to apply for or already applied to."
      />
      <div className="max-w-3xl rounded-xl border bg-popover p-6">
        <Suspense fallback={<Loader />}>
          <NewApplication searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
