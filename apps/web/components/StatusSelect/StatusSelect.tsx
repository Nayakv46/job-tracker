"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import type { ApplicationStatus } from "@/gql/graphql";
import { STATUS_OPTIONS, isApplicationStatus } from "@/lib/status";

/** Standalone status picker (outside forms), e.g. on kanban cards and the details page. */
const StatusSelect = ({
  value,
  onChange,
  label = "Status",
  size = "sm",
  disabled,
  className,
}: {
  value: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
  label?: string;
  size?: "sm" | "default";
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <Select
      value={value}
      items={STATUS_OPTIONS}
      disabled={disabled}
      onValueChange={(next) => {
        if (isApplicationStatus(next) && next !== value) onChange(next);
      }}
    >
      <SelectTrigger size={size} aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default StatusSelect;
