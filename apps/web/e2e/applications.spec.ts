import { createApplication, expect, test } from "./fixtures";

// Every test needs a signed-in user
test.beforeEach(({ user }) => void user);

test("creates an application, validating the salary range", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Add your first application" }).click();
  await expect(page).toHaveURL(/\/applications\/new/);

  await page.getByLabel("Position").fill("Frontend Engineer");
  await page.getByLabel("Company", { exact: true }).fill("Playwright Corp");
  await page.getByLabel("Salary from (optional)").fill("20000");
  await page.getByLabel("Salary to (optional)").fill("10000");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(
    page.getByText("Minimum can't be higher than maximum"),
  ).toBeAttached();

  await page.getByLabel("Salary to (optional)").fill("26000");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(page).toHaveURL(/\/applications\/[0-9a-f-]{36}$/);
  await expect(
    page.getByRole("heading", { name: "Frontend Engineer" }),
  ).toBeVisible();
  await expect(page.getByText("20,000 – 26,000")).toBeVisible();
});

test("adds and edits a note", async ({ page }) => {
  const { id } = await createApplication(page, {
    position: "Frontend Engineer",
    companyName: "Playwright Corp",
  });
  await page.goto(`/applications/${id}`);

  await page.getByLabel("New note").fill("Recruiter call on Monday");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Recruiter call on Monday")).toBeVisible();

  await page.getByRole("button", { name: "Edit note" }).click();
  await page.getByLabel("Edit note").fill("Recruiter call moved to Tuesday");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Recruiter call moved to Tuesday")).toBeVisible();
});

test("changing the status to Applied sets the applied date", async ({
  page,
}) => {
  const { id } = await createApplication(page, {
    position: "Frontend Engineer",
    companyName: "Playwright Corp",
  });
  await page.goto(`/applications/${id}`);

  await page.getByRole("combobox", { name: "Change status" }).click();
  await page.getByRole("option", { name: "Applied" }).click();
  await expect(page.getByText("Status updated")).toBeVisible();

  // appliedAt is set by the API; "—" means empty
  await page.reload();
  const appliedOn = page
    .locator("dt", { hasText: "Applied on" })
    .locator("xpath=..");
  await expect(appliedOn).not.toContainText("—");
});

test("edits an application", async ({ page }) => {
  const { id } = await createApplication(page, {
    position: "Frontend Engineer",
    companyName: "Playwright Corp",
  });
  await page.goto(`/applications/${id}`);

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Position").fill("Senior Frontend Engineer");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Senior Frontend Engineer" }),
  ).toBeVisible();
});

test("deletes an application", async ({ page }) => {
  const { id } = await createApplication(page, {
    position: "Frontend Engineer",
    companyName: "Playwright Corp",
  });
  await page.goto(`/applications/${id}`);

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page).toHaveURL(/\/applications$/);

  await page.goto(`/applications/${id}`);
  await expect(page.getByText("This page doesn't exist")).toBeVisible();
});
