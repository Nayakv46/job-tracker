import { createApplication, expect, test } from "./fixtures";

test.beforeEach(({ user }) => void user);

test("shows statistics and the status chart", async ({ page }) => {
  await createApplication(page, {
    position: "Frontend Engineer",
    companyName: "Playwright Corp",
    status: "APPLIED",
  });
  await createApplication(page, {
    position: "Platform Engineer",
    companyName: "Kube Inc",
    status: "INTERVIEW",
  });

  await page.goto("/");
  await expect(page.getByText("Total applications")).toBeVisible();
  await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();
});

test("renames a company and refuses to delete one that has applications", async ({
  page,
}) => {
  await createApplication(page, {
    position: "Platform Engineer",
    companyName: "Kube Inc",
  });
  await page.goto("/companies");

  await page.getByRole("button", { name: "Edit Kube Inc" }).click();
  await page.getByLabel("Name").fill("Kube Incorporated");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Kube Incorporated")).toBeVisible();

  await page.getByRole("button", { name: "Delete Kube Incorporated" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Company has applications")).toBeVisible();
});
