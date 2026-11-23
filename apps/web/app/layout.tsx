import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/shadcn/sonner";
import { ThemeProvider } from "@/components/ui/shadcn/theme-provider";
import { QueryProvider } from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: { default: "Job Tracker", template: "%s · Job Tracker" },
  description: "Track your job applications from wishlist to offer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <ThemeProvider storageKey="job-tracker-theme">
            {children}
            <Toaster position="bottom-right" duration={5000} closeButton />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
