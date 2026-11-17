type NestedErrors = { [key: string]: unknown };

/** Reads a react-hook-form error by dotted path, e.g. "address.street". */
export function getNestedError(
  errors: NestedErrors,
  path: string,
): { message?: unknown } | undefined {
  const result = path
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as NestedErrors)[part]
          : undefined,
      errors,
    );
  return result && typeof result === "object"
    ? (result as { message?: unknown })
    : undefined;
}
