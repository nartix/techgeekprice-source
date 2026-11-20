import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async () => (key: string) => key,
}));

import Home from "../src/app/[locale]/page";

describe("admin portfolio entry", () => {
  it.each(["en-CA", "en-US", "fr-CA"])(
    "redirects the %s homepage to the localized protected admin route",
    async (locale) => {
      await expect(
        Home({ params: Promise.resolve({ locale }) }),
      ).rejects.toMatchObject({
        digest: expect.stringContaining(`;/${locale}/admin;`),
      });
    },
  );

  it("keeps unsupported locale homepages unavailable", async () => {
    await expect(
      Home({ params: Promise.resolve({ locale: "unsupported" }) }),
    ).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  });
});
