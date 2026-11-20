import { expect, test, type Locator } from "@playwright/test";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

// Serve the actual built component story through interception so this layout
// regression needs neither a running application nor authenticated backend data.
const storybookRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../packages/admin-ui/storybook-static",
);
const contentTypes: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
// Reuse the preview package's installed accessibility engine and version.
const adminRequire = createRequire(resolve(storybookRoot, "../package.json"));
const axeRequire = createRequire(adminRequire.resolve("@storybook/addon-a11y"));
const axeSource = readFile(axeRequire.resolve("axe-core/axe.min.js"), "utf8");

test.beforeAll(async () => {
  test.setTimeout(120_000);
  // Build once per worker so clean checkouts and changed source are covered.
  await promisify(execFile)(
    "pnpm",
    ["--filter", "@tgp/admin-ui", "storybook:build"],
    {
      cwd: resolve(storybookRoot, "../../.."),
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
});

for (const scenario of [
  { theme: "light", viewport: { width: 1280, height: 800 } },
  { theme: "dark", viewport: { width: 360, height: 640 } },
  { theme: "light", viewport: { width: 1024, height: 420 } },
]) {
  test(`paginated move picker stays scrollable in ${scenario.theme} at ${scenario.viewport.width}x${scenario.viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(scenario.viewport);
    await page.route("**/*", async (route) => {
      const pathname = decodeURIComponent(
        new URL(route.request().url()).pathname,
      );
      const file = resolve(storybookRoot, `.${pathname}`);
      if (!file.startsWith(`${storybookRoot}${sep}`)) {
        await route.abort();
        return;
      }
      try {
        await route.fulfill({
          body: await readFile(file),
          contentType:
            contentTypes[extname(file)] ?? "application/octet-stream",
        });
      } catch {
        await route.fulfill({ status: 404, body: "Missing Storybook asset" });
      }
    });
    await page.goto(
      `/iframe.html?id=inputs-hierarchy-picker-cursorhierarchypicker--paginated-in-modal&viewMode=story&globals=colorScheme:${scenario.theme}`,
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-mantine-color-scheme",
      scenario.theme,
    );
    await page
      .getByRole("button", { name: "Move category", exact: true })
      .click();
    const input = page.getByRole("combobox", { name: "New parent" });
    await input.click();
    const list = page.getByRole("listbox");
    const dropdown = list.locator("..");
    await expect(page.getByRole("option")).toHaveCount(20);

    for (const count of [40, 60]) {
      const more = page.getByRole("button", { name: "Load more" });
      await more.click();
      await expect(page.getByRole("option")).toHaveCount(count);
      await expect(input).toHaveValue("Category 001");
    }
    await expectInViewport(dropdown);
    await expectInViewport(page.getByRole("button", { name: "Load more" }));
    await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
    await page.addScriptTag({ content: await axeSource });
    const violations = await page.evaluate(async () => {
      const { axe } = window as unknown as {
        axe: {
          run(
            context: Document,
            options: { runOnly: { type: "tag"; values: string[] } },
          ): Promise<{ violations: unknown[] }>;
        };
      };
      return (
        await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations;
    });
    expect(violations).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath("loaded-destinations.png"),
    });
    await expect
      .poll(() =>
        list.evaluate((element) => element.scrollHeight > element.clientHeight),
      )
      .toBe(true);

    await list.hover();
    await page.mouse.wheel(0, 10000);
    await expect
      .poll(() => list.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await expectInViewport(page.getByRole("option").last());
    await page.getByRole("option").last().click();
    await expect(input).toHaveValue("Category 060");
    await expect(list).toBeHidden();

    await input.click();
    await page.keyboard.press("ArrowUp");
    const activeId = await input.getAttribute("aria-activedescendant");
    expect(activeId).toBeTruthy();
    await expectInViewport(page.locator(`[id="${activeId}"]`));
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Category 059");

    await input.click();
    await page.setViewportSize({ width: 390, height: 480 });
    await expectInViewport(dropdown);
    await list.hover();
    await page.mouse.wheel(0, -10000);
    await expect
      .poll(() => list.evaluate((element) => element.scrollTop))
      .toBe(0);
    await expectInViewport(page.getByRole("option").first());
    await page.getByRole("option").first().click();
    await expect(input).toHaveValue("Category 001");
    await input.click();
    for (let index = 0; index < 59; index += 1) {
      await page.keyboard.press("ArrowDown");
    }
    await expectInViewport(page.getByRole("option").last());
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Category 060");
    await input.click();
    await page.keyboard.press("Escape");
    await expect(list).toBeHidden();
    await expect(input).toHaveValue("Category 060");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Move category", exact: true }),
    ).toBeFocused();
  });
}

async function expectInViewport(locator: Locator) {
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.left >= 0 &&
          rect.right <= window.innerWidth
        );
      }),
    )
    .toBe(true);
}
