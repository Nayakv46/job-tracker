import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Loader from "@/components/Loader/Loader";
import PageHeader from "@/components/PageHeader/PageHeader";
import { buttonVariants } from "@/components/ui/shadcn/button";
import Dashboard from "./Dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your job search."
        actions={
          <Link href="/applications/new" className={buttonVariants()}>
            <Plus aria-hidden />
            New application
          </Link>
        }
      />
      {/* Data is fetched on the server per request and streamed in */}
      <Suspense fallback={<Loader />}>
        <Dashboard />
      </Suspense>
    </>
  );
}
