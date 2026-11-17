"use client";

import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import Loader from "@/components/Loader/Loader";
import AlertDialogWrapper from "@/components/ui/shadcn/AlertDialogWrapper";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import type { CompaniesQuery } from "@/gql/graphql";
import {
  useCompanies,
  useDeleteCompany,
  useUpdateCompany,
} from "@/hooks/useCompanies";
import { getErrorMessage } from "@/lib/graphql/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toasts";

type Company = CompaniesQuery["companies"][number];

const CompanyRow = ({ company }: { company: Company }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(company.name);
  const [website, setWebsite] = useState(company.website ?? "");
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    updateCompany.mutate(
      {
        id: company.id,
        input: { name: name.trim(), website: website.trim() || null },
      },
      {
        onSuccess: () => {
          showSuccessToast("Company updated");
          setEditing(false);
        },
        onError: (error) => showErrorToast(getErrorMessage(error)),
      },
    );
  };

  if (editing) {
    return (
      <li className="py-3">
        <form onSubmit={onSave} className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-48 flex-1 gap-1">
            <Label htmlFor={`name-${company.id}`}>Name</Label>
            <Input
              id={`name-${company.id}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="grid min-w-48 flex-1 gap-1">
            <Label htmlFor={`website-${company.id}`}>Website</Label>
            <Input
              id={`website-${company.id}`}
              type="url"
              placeholder="https://"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setName(company.name);
                setWebsite(company.website ?? "");
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || updateCompany.isPending}
            >
              Save
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{company.name}</p>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {company.website.replace(/^https?:\/\//, "")}
            <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${company.name}`}
          onClick={() => setEditing(true)}
        >
          <Pencil aria-hidden />
        </Button>
        <AlertDialogWrapper
          title={`Delete ${company.name}?`}
          description="Only companies without applications can be deleted."
          confirmText="Delete"
          onClick={() =>
            deleteCompany.mutate(company.id, {
              onSuccess: () => showSuccessToast("Company deleted"),
              onError: (error) => showErrorToast(getErrorMessage(error)),
            })
          }
          triggerButtonProps={{
            variant: "ghost",
            size: "icon-sm",
            "aria-label": `Delete ${company.name}`,
            children: <Trash2 aria-hidden />,
          }}
        />
      </div>
    </li>
  );
};

const CompaniesList = () => {
  const { data, isPending, error } = useCompanies();

  if (isPending) return <Loader />;
  if (error) throw error;

  if (data.companies.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        No companies yet. They appear when you add applications.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-popover px-4">
      {data.companies.map((company) => (
        <CompanyRow key={company.id} company={company} />
      ))}
    </ul>
  );
};

export default CompaniesList;
