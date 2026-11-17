import { z } from "zod";
import type { ApplicationStatus, CreateApplicationInput } from "@/gql/graphql";
import { STATUSES } from "@/lib/status";

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || z.url().safeParse(value).success, {
    message: "Enter a full URL, e.g. https://example.com",
  });

const optionalAmount = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+$/.test(value), {
    message: "Enter a whole number",
  });

// Form values are kept as strings (inputs) and converted when submitting
export const applicationFormSchema = z
  .object({
    companyName: z.string().trim().min(1, "Company is required").max(200),
    companyWebsite: optionalUrl,
    position: z.string().trim().min(1, "Position is required").max(200),
    url: optionalUrl,
    salaryMin: optionalAmount,
    salaryMax: optionalAmount,
    status: z.enum(STATUSES as [ApplicationStatus, ...ApplicationStatus[]]),
    appliedAt: z.date().optional(),
  })
  .refine(
    ({ salaryMin, salaryMax }) =>
      salaryMin === "" ||
      salaryMax === "" ||
      Number(salaryMin) <= Number(salaryMax),
    { message: "Minimum can't be higher than maximum", path: ["salaryMax"] },
  );

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export const emptyApplicationForm = (
  status: ApplicationStatus = "WISHLIST",
): ApplicationFormValues => ({
  companyName: "",
  companyWebsite: "",
  position: "",
  url: "",
  salaryMin: "",
  salaryMax: "",
  status,
  appliedAt: undefined,
});

/**
 * Converts form strings to API input. Empty fields become `null` when editing (clears the
 * value) and are omitted when creating.
 */
export function toApplicationInput(
  values: ApplicationFormValues,
  mode: "create" | "edit",
): CreateApplicationInput {
  const empty = mode === "edit" ? null : undefined;
  const text = (value: string) => (value === "" ? empty : value);
  const amount = (value: string) => (value === "" ? empty : Number(value));

  return {
    companyName: values.companyName,
    ...(mode === "create" && { companyWebsite: text(values.companyWebsite) }),
    position: values.position,
    url: text(values.url),
    salaryMin: amount(values.salaryMin),
    salaryMax: amount(values.salaryMax),
    status: values.status,
    appliedAt: values.appliedAt ? values.appliedAt.toISOString() : empty,
  };
}
