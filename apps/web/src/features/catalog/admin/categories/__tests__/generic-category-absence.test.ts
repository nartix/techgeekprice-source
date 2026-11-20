import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { adminResources } from "../../../../platform/admin/resources/adminResources";

const deferredCategoryPatterns = [
  /blogCategories/,
  /galleryCategories/,
  /Blog Categories/,
  /Gallery Categories/,
  /blog-category/,
  /gallery-category/,
  /blogCategory/,
  /galleryCategory/,
];

describe("generic category system absence", () => {
  it("keeps deferred Blog and Gallery category configs and resources out", () => {
    expect(adminResources.map((resource) => resource.name)).not.toEqual(
      expect.arrayContaining(["blogCategories", "galleryCategories"]),
    );
  });

  it("does not expose Blog or Gallery category routes", () => {
    const protectedRoot = path.join(
      process.cwd(),
      "src/app/[locale]/(admin)/admin/(protected)",
    );
    const routePaths = collectPaths(protectedRoot).join("\n");

    expect(routePaths).not.toMatch(/blog.*categor/i);
    expect(routePaths).not.toMatch(/gallery.*categor/i);
    expect(existsSync(path.join(protectedRoot, "blog/categories"))).toBe(false);
    expect(existsSync(path.join(protectedRoot, "gallery/categories"))).toBe(
      false,
    );
  });

  it("does not expose legacy admin category routes", () => {
    const protectedRoot = path.join(
      process.cwd(),
      "src/app/[locale]/(admin)/admin/(protected)",
    );

    expect(existsSync(path.join(protectedRoot, "categories"))).toBe(false);
  });

  it("does not include Blog or Gallery category navigation copy", () => {
    const messages = ["en-CA", "en-US", "fr-CA"]
      .map((locale) =>
        readFileSync(path.join(process.cwd(), `messages/${locale}.json`), "utf8"),
      )
      .join("\n");

    for (const pattern of deferredCategoryPatterns) {
      expect(messages).not.toMatch(pattern);
    }
  });
});

function collectPaths(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);

    if (!entry.isDirectory()) {
      return [entryPath];
    }

    return [entryPath, ...collectPaths(entryPath)];
  });
}
