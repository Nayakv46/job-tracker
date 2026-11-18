import { test as base, expect, type Locator, type Page } from "@playwright/test";

export { expect };

export const PASSWORD = "password123";

export type User = { email: string; password: string };

type ApplicationStatus =
  | "WISHLIST"
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED";

type NewApplication = {
  position: string;
  companyName: string;
  status?: ApplicationStatus;
  salaryMin?: number;
  salaryMax?: number;
};

/** Unique per call; the @e2e.test domain marks test users (the API e2e tests use it too). */
export function uniqueEmail(prefix = "user") {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${random}@e2e.test`;
}

export const test = base.extend<{
  /** A fresh user, signed in: the auth cookies are set on the page's browser context. */
  user: User;
  /** Fails the test on uncaught exceptions and console errors (e.g. hydration mismatches). */
  pageErrors: void;
}>({
  // The second fixture argument is named `provide` instead of Playwright's usual `use`,
  // which the React hooks lint rule would mistake for React's use()
  user: async ({ page }, provide) => {
    const user = { email: uniqueEmail(), password: PASSWORD };
    const response = await page.request.post("/api/auth/signup", {
      data: { ...user, confirmPassword: user.password },
    });
    if (response.status() === 429) {
      throw new Error(
        "The API rate limit was hit (429). Every test signs up a user, and all requests " +
          "share the web server's IP, so start the stack with higher limits: " +
          "THROTTLE_LIMIT=100000 THROTTLE_AUTH_LIMIT=100000 docker compose up -d " +
          '(see "End-to-end tests" in apps/web/README.md).',
      );
    }
    expect(response.status(), await response.text()).toBe(201);
    await provide(user);
  },

  pageErrors: [
    async ({ page }, provide) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        // Chrome logs every 4xx/5xx response; the tests check expected ones (wrong
        // password, 404 page) through the UI instead
        if (
          message.type() === "error" &&
          !message.text().startsWith("Failed to load resource")
        ) {
          errors.push(message.text());
        }
      });
      await provide();
      expect(errors, "errors in the browser console").toEqual([]);
    },
    { auto: true },
  ],
});

/** Creates an application through the GraphQL proxy, as the signed-in user. */
export async function createApplication(page: Page, input: NewApplication) {
  const response = await page.request.post("/api/graphql", {
    data: {
      query: `mutation ($input: CreateApplicationInput!) {
        createApplication(input: $input) { id }
      }`,
      variables: { input },
    },
  });
  const body = await response.json();
  expect(body.errors, JSON.stringify(body.errors)).toBeUndefined();
  return body.data.createApplication as { id: string };
}

/** Kanban column by its status label, e.g. "Applied". */
export function column(page: Page, label: string) {
  return page.getByRole("region", { name: new RegExp(`^${label}`) });
}

/** Drags with real mouse events, which dnd-kit's pointer sensor needs. */
export async function dragTo(page: Page, handle: Locator, target: Locator) {
  const from = await handle.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("Drag handle or target is not visible");

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  // Move a little first to pass the sensor's activation distance
  await page.mouse.move(from.x + 20, from.y + 20, { steps: 5 });
  // Aim near the top of the column so the point stays inside the viewport
  await page.mouse.move(to.x + to.width / 2, to.y + 60, { steps: 15 });
  await page.mouse.up();
}
