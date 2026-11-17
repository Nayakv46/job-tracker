import type { ReactNode } from "react";
import Navbar from "@/components/Navbar/Navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6">
        {children}
      </main>
    </>
  );
}
