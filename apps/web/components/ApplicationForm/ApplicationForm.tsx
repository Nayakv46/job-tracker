"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form/Form";
import FormDatePicker from "@/components/ui/form/FormDatePicker";
import FormSelect from "@/components/ui/form/FormSelect";
import { FormTextInput } from "@/components/ui/form/FormTextInput";
import { Button } from "@/components/ui/shadcn/button";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { useCompanies } from "@/hooks/useCompanies";
import { showErrorToast } from "@/lib/toasts";
import { STATUS_OPTIONS } from "@/lib/status";
import {
  applicationFormSchema,
  type ApplicationFormValues,
} from "@/lib/types/application";

type ApplicationFormProps = {
  mode: "create" | "edit";
  defaultValues: ApplicationFormValues;
  onSubmit: (values: ApplicationFormValues) => Promise<void>;
  onCancel?: () => void;
};

const ApplicationForm = ({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
}: ApplicationFormProps) => {
  const form = useForm<ApplicationFormValues>({
    defaultValues,
    resolver: zodResolver(applicationFormSchema),
  });
  // Suggest existing companies so applications are grouped under the same company
  const { data: companies } = useCompanies();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () =>
          showErrorToast("Please fix the highlighted fields"),
        )}
        className="grid gap-4 sm:grid-cols-2"
        noValidate
      >
        <FormTextInput
          control={form.control}
          name="position"
          label="Position"
          placeholder="e.g. Frontend Developer"
        />
        <FormTextInput
          control={form.control}
          name="companyName"
          label="Company"
          placeholder="e.g. Acme"
          list="company-suggestions"
          autoComplete="off"
        />
        <datalist id="company-suggestions">
          {companies?.companies.map((company) => (
            <option key={company.id} value={company.name} />
          ))}
        </datalist>

        {mode === "create" && (
          <FormTextInput
            control={form.control}
            name="companyWebsite"
            label="Company website (optional)"
            placeholder="https://"
            type="url"
          />
        )}
        <FormTextInput
          control={form.control}
          name="url"
          label="Job offer link (optional)"
          placeholder="https://"
          type="url"
        />
        <FormTextInput
          control={form.control}
          name="salaryMin"
          label="Salary from (optional)"
          inputMode="numeric"
        />
        <FormTextInput
          control={form.control}
          name="salaryMax"
          label="Salary to (optional)"
          inputMode="numeric"
        />
        <FormSelect
          control={form.control}
          name="status"
          label="Status"
          options={STATUS_OPTIONS}
          className="w-full"
        />
        <FormDatePicker
          control={form.control}
          name="appliedAt"
          label="Applied on (optional)"
          placeholder="Set automatically when applied"
        />

        <div className="flex justify-end gap-2 sm:col-span-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner />}
            {mode === "create" ? "Add application" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ApplicationForm;
