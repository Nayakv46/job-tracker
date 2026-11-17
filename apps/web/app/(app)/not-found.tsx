import Link from "next/link";
import { buttonVariants } from "@/components/ui/shadcn/button";

export default function NotFound() {
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-xl border p-8 text-center">
      <h2 className="text-lg font-semibold">Not found</h2>
      <p className="text-sm text-muted-foreground">
        This page doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link href="/applications" className={buttonVariants()}>
        Back to applications
      </Link>
    </div>
  );
}
