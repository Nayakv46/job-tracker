import type { FullConfig } from "@playwright/test";

/** Fails fast with one clear message when the app isn't running, instead of every test timing out. */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3000";
  try {
    const response = await fetch(new URL("/login", baseURL));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `The app isn't reachable at ${baseURL} (${reason}).\n` +
        "Start the stack first (see \"End-to-end tests\" in apps/web/README.md), " +
        "or point the tests at it with E2E_BASE_URL, e.g. E2E_BASE_URL=http://localhost:3100.",
    );
  }
}
