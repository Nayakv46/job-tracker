import { PASSWORD, expect, test, uniqueEmail } from "./fixtures";

test("redirects signed-out visitors to login, keeping the target page", async ({
  page,
}) => {
  await page.goto("/board");
  await expect(page).toHaveURL(/\/login\?next=%2Fboard$/);
});

test("signs up with validation and lands on the empty dashboard", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(uniqueEmail("signup"));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill("something-else");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Passwords do not match").first()).toBeAttached();
  await expect(page).toHaveURL(/\/signup$/);

  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("No applications yet")).toBeVisible();
});

test("logs in after a wrong password and returns to the requested page", async ({
  page,
  user,
}) => {
  await page.context().clearCookies();
  await page.goto("/companies");
  await expect(page).toHaveURL(/\/login\?next=%2Fcompanies$/);

  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Invalid credentials")).toBeVisible();

  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/companies$/);
});

test("signs out and protects pages again", async ({ page, user }) => {
  void user;
  await page.goto("/");
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/applications");
  await expect(page).toHaveURL(/\/login\?next=%2Fapplications$/);
});
