import { BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { serverGraphql } from "@/lib/graphql/server";
import { MeQuery } from "@/services/auth";
import NavLinks, { NavLinkList } from "./NavLinks";
import UserMenu from "./UserMenu";

// Reads the session, so it streams in behind a Suspense boundary
async function CurrentUser() {
  const email = await serverGraphql(MeQuery)
    .then(({ me }) => me.email)
    .catch(() => null);
  return <UserMenu email={email} />;
}

const Navbar = () => {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BriefcaseBusiness className="size-4" aria-hidden />
          </span>
          <span className="max-sm:sr-only">Job Tracker</span>
        </Link>
        <div className="min-w-0 flex-1">
          {/* The URL is request data: the static shell renders links without highlighting */}
          <Suspense fallback={<NavLinkList pathname={null} />}>
            <NavLinks />
          </Suspense>
        </div>
        <Suspense fallback={<span className="size-9 rounded-full bg-muted" />}>
          <CurrentUser />
        </Suspense>
      </div>
    </header>
  );
};

export default Navbar;
