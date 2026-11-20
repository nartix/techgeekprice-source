import { test, expect } from "@playwright/test";

const identity = {
  id: "admin_1",
  username: "admin",
  roles: ["ADMIN"],
  permissions: ["admin:access"],
  sessionScope: "admin",
};
for (const locale of ["en-CA", "en-US", "fr-CA"]) {
  test(`${locale} session outage is recoverable with keyboard retry`, async ({
    page,
  }, testInfo) => {
    let healthy = false;
    let logouts = 0;
    await page.route("**/api/v1/admin/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/logout")) logouts++;
      if (path.endsWith("/auth/me"))
        return route.fulfill(
          healthy
            ? { json: identity }
            : {
                status: 503,
                contentType: "text/html",
                body: "<html>private diagnostic</html>",
              },
        );
      return route.fulfill({
        json: {
          data: [],
          page: {
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 20,
            first: true,
            last: true,
            numberOfElements: 0,
          },
        },
      });
    });
    await page.goto(`/${locale}/admin`);
    const title =
      locale === "fr-CA"
        ? "Vérification de session indisponible"
        : "Session verification unavailable";
    const retry = page.getByRole("button", {
      name: locale === "fr-CA" ? "Réessayer" : "Try again",
      exact: true,
    });
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByRole("navigation")).toHaveCount(0);
    await expect(
      page.getByText(/private diagnostic|session expired/i),
    ).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/${locale}/admin$`));
    for (const scheme of ["light", "dark", "auto"] as const) {
      await page.evaluate((value) => {
        localStorage.setItem("mantine-color-scheme-value", value);
      }, scheme);
      await page.emulateMedia({
        colorScheme: scheme === "light" ? "light" : "dark",
      });
      await page.reload();
      await expect(page.getByText(title)).toBeVisible();
      for (const width of [360, 390, 768, 1024, 1280, 1536]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(retry).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        if (locale === "fr-CA" && (width === 390 || width === 1280)) {
          await retry.focus();
          await page.screenshot({
            path: testInfo.outputPath(`session-${scheme}-${width}.png`),
          });
        }
      }
    }
    await retry.focus();
    await expect(retry).toBeFocused();
    healthy = true;
    await page.keyboard.press("Enter");
    await expect(page.getByText(title)).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: locale === "fr-CA" ? /tableau de bord/i : /admin dashboard/i,
      }),
    ).toBeVisible();
    expect(logouts).toBe(0);
  });
}

for (const status of [401, 403]) {
  test(`non-JSON ${status} has the correct authentication outcome`, async ({
    page,
  }) => {
    await page.route("**/api/v1/admin/auth/me", (route) =>
      route.fulfill({
        status,
        contentType: "text/plain",
        body: "private diagnostic",
      }),
    );
    await page.goto("/fr-CA/admin");
    if (status === 401) {
      await expect(page).toHaveURL(/\/fr-CA\/admin\/login$/);
      await expect(
        page.getByRole("textbox", { name: /utilisateur|courriel/i }),
      ).toBeVisible();
    } else {
      await expect(page.getByText("Accès refusé")).toBeVisible();
      await expect(page).toHaveURL(/\/fr-CA\/admin$/);
      await expect(page.getByRole("navigation")).toHaveCount(0);
    }
    await expect(page.getByText("private diagnostic")).toHaveCount(0);
  });
}

test("network failure keeps a retry action without redirect", async ({
  page,
}) => {
  await page.route("**/api/v1/admin/auth/me", (route) => route.abort("failed"));
  await page.goto("/en-CA/admin");
  await expect(
    page.getByText("Session verification unavailable"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeEnabled();
  await expect(page).toHaveURL(/\/en-CA\/admin$/);
});
