import { createApplication, expect, test } from "./fixtures";

test.beforeEach(async ({ page, user }) => {
  void user;
  await createApplication(page, {
    position: "Senior Frontend Engineer",
    companyName: "Playwright Corp",
    status: "OFFER",
  });
  await createApplication(page, {
    position: "Platform Engineer",
    companyName: "Kube Inc",
    status: "REJECTED",
  });
});

test("searches, filters by status and shows the empty state", async ({
  page,
}) => {
  await page.goto("/applications");
  const search = page.getByLabel("Search by position or company");
  const senior = page.getByRole("link", { name: "Senior Frontend Engineer" });
  const platform = page.getByRole("link", { name: "Platform Engineer" });
  await expect(senior).toBeVisible();
  await expect(platform).toBeVisible();

  // Search matches the company name too
  await search.fill("kube");
  await expect(page).toHaveURL(/search=kube/);
  await expect(senior).toHaveCount(0);
  await expect(platform).toBeVisible();

  await search.fill("");
  await page.getByRole("combobox", { name: "Filter by status" }).click();
  await page.getByRole("option", { name: "Offer" }).click();
  await expect(page).toHaveURL(/status=OFFER/);
  await expect(senior).toBeVisible();
  await expect(platform).toHaveCount(0);

  await search.fill("nothing-matches");
  await expect(
    page.getByText("No applications match these filters."),
  ).toBeVisible();
});
