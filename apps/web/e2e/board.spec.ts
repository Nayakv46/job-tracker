import { column, createApplication, dragTo, expect, test } from "./fixtures";

test.beforeEach(({ user }) => void user);

test("adding from a column preselects its status", async ({ page }) => {
  await page.goto("/board");
  await page
    .getByRole("link", { name: "Add application to Interview" })
    .click();
  await expect(page).toHaveURL(/status=INTERVIEW/);
  await expect(page.getByRole("combobox", { name: "Status" })).toContainText(
    "Interview",
  );

  await page.getByLabel("Position").fill("Platform Engineer");
  await page.getByLabel("Company", { exact: true }).fill("Kube Inc");
  await page.getByRole("button", { name: "Add application" }).click();
  await expect(page).toHaveURL(/\/applications\/[0-9a-f-]{36}$/);

  await page.goto("/board");
  await expect(
    column(page, "Interview").getByText("Platform Engineer"),
  ).toBeVisible();
});

test("dragging a card to another column persists the status", async ({
  page,
}) => {
  await createApplication(page, {
    position: "Senior Frontend Engineer",
    companyName: "Playwright Corp",
    status: "APPLIED",
  });
  await page.goto("/board");
  const applied = column(page, "Applied");
  const offer = column(page, "Offer");
  await expect(applied.getByText("Senior Frontend Engineer")).toBeVisible();

  await dragTo(
    page,
    applied.getByRole("button", { name: /^Drag Senior Frontend Engineer/ }),
    offer,
  );
  await expect(offer.getByText("Senior Frontend Engineer")).toBeVisible();
  await expect(applied.getByText("Senior Frontend Engineer")).toHaveCount(0);

  // The mutation has to finish before the reload
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(
    column(page, "Offer").getByText("Senior Frontend Engineer"),
  ).toBeVisible();
});

test("moves a card with the status menu", async ({ page }) => {
  await createApplication(page, {
    position: "Platform Engineer",
    companyName: "Kube Inc",
    status: "INTERVIEW",
  });
  await page.goto("/board");

  await column(page, "Interview")
    .getByRole("combobox", { name: "Move Platform Engineer to" })
    .click();
  await page.getByRole("option", { name: "Rejected" }).click();
  await expect(
    column(page, "Rejected").getByText("Platform Engineer"),
  ).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the board doesn't overflow the page horizontally", async ({ page }) => {
    await page.goto("/board");
    await expect(column(page, "Wishlist")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
