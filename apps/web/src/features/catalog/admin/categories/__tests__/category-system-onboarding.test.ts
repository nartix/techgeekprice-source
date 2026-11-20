import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("category-system onboarding guide", () => {
  it("documents the definition, routes, aliases, translations, tests, and limits", () => {
    const guide = readFileSync(
      path.join(
        process.cwd(),
        "../../docs/category-system-onboarding.md",
      ),
      "utf8",
    );

    expect(guide).toMatch(/categorySystemRegistry/);
    expect(guide).toMatch(/CategoryScreenComposition/);
    expect(guide).toMatch(/category-systems\/\{systemKey\}\/categories/);
    expect(guide).toMatch(/optional retained alias/i);
    expect(guide).toMatch(/en-CA, en-US, and fr-CA/);
    expect(guide).toMatch(/numeric-v1/i);
    expect(guide).toMatch(/visible reorder UI/i);
  });
});
