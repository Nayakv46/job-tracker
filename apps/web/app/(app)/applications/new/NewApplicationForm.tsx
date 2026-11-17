"use client";

import { useRouter } from "next/navigation";
import ApplicationForm from "@/components/ApplicationForm/ApplicationForm";
import type { ApplicationStatus } from "@/gql/graphql";
import { useCreateApplication } from "@/hooks/useApplications";
import { getErrorMessage } from "@/lib/graphql/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toasts";
import {
  emptyApplicationForm,
  toApplicationInput,
  type ApplicationFormValues,
} from "@/lib/types/application";

const NewApplicationForm = ({
  initialStatus,
}: {
  initialStatus?: ApplicationStatus;
}) => {
  const router = useRouter();
  const createApplication = useCreateApplication();

  const onSubmit = async (values: ApplicationFormValues) => {
    try {
      const { createApplication: created } =
        await createApplication.mutateAsync(
          toApplicationInput(values, "create"),
        );
      showSuccessToast("Application added");
      router.push(`/applications/${created.id}`);
    } catch (error) {
      showErrorToast(getErrorMessage(error));
    }
  };

  return (
    <ApplicationForm
      mode="create"
      defaultValues={emptyApplicationForm(initialStatus)}
      onSubmit={onSubmit}
      onCancel={() => router.back()}
    />
  );
};

export default NewApplicationForm;
