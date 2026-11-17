import type { ReactNode } from "react";
import { BriefcaseBusiness } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BriefcaseBusiness className="size-5" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold">Job Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Track every application from wishlist to offer.
          </p>
        </div>
        <div className="rounded-xl border bg-popover p-6 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
