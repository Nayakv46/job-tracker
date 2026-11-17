import Link from "next/link";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { buttonVariants } from "@/components/ui/shadcn/button";
import type { ApplicationStatus } from "@/gql/graphql";
import { serverGraphql } from "@/lib/graphql/server";
import { STATUS_META } from "@/lib/status";
import { formatRelative } from "@/lib/utils/format";
import { DashboardQuery } from "@/services/applications";
import StatusChart from "./StatusChart";

const StatTile = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <div className="rounded-xl border bg-popover p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

/** Server Component: fetches stats and recent applications for the current user. */
const Dashboard = async () => {
  const { stats, recent } = await serverGraphql(DashboardQuery);

  const count = (status: ApplicationStatus) =>
    stats.find((s) => s.status === status)?.count ?? 0;
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  const sent = total - count("WISHLIST");
  const progressed = count("INTERVIEW") + count("OFFER");
  const interviewRate = sent > 0 ? Math.round((progressed / sent) * 100) : 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
        <h2 className="text-lg font-semibold">No applications yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add the first job you are interested in and track it from wishlist to
          offer.
        </p>
        <Link href="/applications/new" className={buttonVariants()}>
          Add your first application
        </Link>
      </div>
    );
  }

  const chartData = stats.map(({ status, count }) => ({
    status: STATUS_META[status].label,
    count,
    fill: STATUS_META[status].color,
  }));

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Summary"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatTile label="Total applications" value={total} />
        <StatTile
          label="In progress"
          value={count("APPLIED") + count("INTERVIEW")}
          hint="Applied or interviewing"
        />
        <StatTile label="Offers" value={count("OFFER")} />
        <StatTile
          label="Interview rate"
          value={`${interviewRate}%`}
          hint="Sent applications that reached an interview"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-xl border bg-popover p-4 lg:col-span-3">
          <h2 className="mb-4 font-semibold">Applications by status</h2>
          <StatusChart data={chartData} />
        </section>

        <section className="rounded-xl border bg-popover p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Recently updated</h2>
            <Link
              href="/applications"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y">
            {recent.items.map((application) => (
              <li key={application.id}>
                <Link
                  href={`/applications/${application.id}`}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {application.position}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {application.company.name} ·{" "}
                      {formatRelative(application.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
