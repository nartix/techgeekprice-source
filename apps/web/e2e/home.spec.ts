import { expect, test } from "@playwright/test";

for (const locale of ["en-CA", "en-US", "fr-CA"]) {
  test(`opens the ${locale} admin portfolio sign-in from the homepage`, async ({
    page,
  }) => {
    await page.route("**/api/v1/admin/auth/me", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: "{}",
      }),
    );
    await page.goto(`/${locale}`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/login$`));
    await expect(
      page.getByRole("textbox", { name: /username|courriel|utilisateur/i }),
    ).toBeVisible();
  });
}
