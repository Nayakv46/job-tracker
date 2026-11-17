"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/board", label: "Board" },
  { href: "/applications", label: "Applications" },
  { href: "/companies", label: "Companies" },
] as const;

/** Plain links; `pathname` is null in the static shell (no active link highlighted yet). */
export const NavLinkList = ({ pathname }: { pathname: string | null }) => (
  <nav aria-label="Main" className="flex items-center gap-1 overflow-x-auto">
    {LINKS.map(({ href, label }) => {
      const active =
        pathname !== null &&
        (href === "/" ? pathname === "/" : pathname.startsWith(href));
      return (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition hover:bg-accent hover:text-foreground",
            active && "bg-accent text-foreground",
          )}
        >
          {label}
        </Link>
      );
    })}
  </nav>
);

// Reads the URL, so it must render inside a Suspense boundary (see Navbar)
const NavLinks = () => <NavLinkList pathname={usePathname()} />;

export default NavLinks;
