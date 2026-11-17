"use client";

import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import ApplicationForm from "@/components/ApplicationForm/ApplicationForm";
import Loader from "@/components/Loader/Loader";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import StatusSelect from "@/components/StatusSelect/StatusSelect";
import AlertDialogWrapper from "@/components/ui/shadcn/AlertDialogWrapper";
import { Button } from "@/components/ui/shadcn/button";
import type { ApplicationQuery } from "@/gql/graphql";
import {
  useApplication,
  useDeleteApplication,
  useUpdateApplication,
  useUpdateApplicationStatus,
} from "@/hooks/useApplications";
import { getErrorMessage } from "@/lib/graphql/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toasts";
import {
  toApplicationInput,
  type ApplicationFormValues,
} from "@/lib/types/application";
import { formatDate, formatSalary } from "@/lib/utils/format";
import NotesSection from "./NotesSection";

type Application = ApplicationQuery["application"];

const Detail = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-1 text-sm">{children ?? "—"}</dd>
  </div>
);

const toFormValues = (application: Application): ApplicationFormValues => ({
  companyName: application.company.name,
  companyWebsite: "",
  position: application.position,
  url: application.url ?? "",
  salaryMin: application.salaryMin?.toString() ?? "",
  salaryMax: application.salaryMax?.toString() ?? "",
  status: application.status,
  appliedAt: application.appliedAt
    ? new Date(application.appliedAt)
    : undefined,
});

const ApplicationDetails = ({ id }: { id: string }) => {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const { data, isPending, error } = useApplication(id);
  const updateApplication = useUpdateApplication(id);
  const updateStatus = useUpdateApplicationStatus();
  const deleteApplication = useDeleteApplication();

  if (isPending) return <Loader />;
  if (error) throw error;

  const application = data.application;
  const salary = formatSalary(application.salaryMin, application.salaryMax);

  const onSave = async (values: ApplicationFormValues) => {
    try {
      await updateApplication.mutateAsync(toApplicationInput(values, "edit"));
      showSuccessToast("Changes saved");
      setEditing(false);
    } catch (err) {
      showErrorToast(getErrorMessage(err));
    }
  };

  const onDelete = () =>
    deleteApplication.mutate(id, {
      onSuccess: () => {
        showSuccessToast("Application deleted");
        router.push("/applications");
      },
      onError: (err) => showErrorToast(getErrorMessage(err)),
    });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/applications"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All applications
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {application.position}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
            {application.company.website ? (
              <a
                href={application.company.website}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground hover:underline"
              >
                {application.company.name}
              </a>
            ) : (
              application.company.name
            )}
            <StatusBadge status={application.status} />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusSelect
            value={application.status}
            label="Change status"
            size="default"
            disabled={updateStatus.isPending}
            onChange={(status) =>
              updateStatus.mutate(
                { id, status },
                {
                  onSuccess: () => showSuccessToast("Status updated"),
                  onError: (err) => showErrorToast(getErrorMessage(err)),
                },
              )
            }
          />
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden />
              Edit
            </Button>
          )}
          <AlertDialogWrapper
            title="Delete this application?"
            description="The application and all its notes will be permanently deleted."
            confirmText="Delete"
            onClick={onDelete}
            triggerButtonProps={{
              variant: "destructive",
              disabled: deleteApplication.isPending,
              children: (
                <>
                  <Trash2 aria-hidden />
                  Delete
                </>
              ),
            }}
          />
        </div>
      </div>

      <section className="rounded-xl border bg-popover p-6">
        {editing ? (
          <ApplicationForm
            mode="edit"
            defaultValues={toFormValues(application)}
            onSubmit={onSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Salary">{salary}</Detail>
            <Detail label="Applied on">
              {formatDate(application.appliedAt)}
            </Detail>
            <Detail label="Job offer">
              {application.url ? (
                <a
                  href={application.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline"
                >
                  Open link
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              ) : null}
            </Detail>
            <Detail label="Last updated">
              {formatDate(application.updatedAt)}
            </Detail>
          </dl>
        )}
      </section>

      <NotesSection applicationId={id} notes={application.notes} />
    </div>
  );
};

export default ApplicationDetails;
