"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { getErrorMessage } from "@/lib/graphql/errors";

export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-xl border p-8 text-center"
    >
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
