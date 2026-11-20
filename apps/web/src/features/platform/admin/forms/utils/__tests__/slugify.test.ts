import { describe, expect, it } from "vitest";

import { slugify } from "../slugify";

describe("slugify", () => {
  it("creates catalogue slugs from user-entered titles", () => {
    expect(slugify("  Café Laptop 15\" -- Pro  ")).toBe("cafe-laptop-15-pro");
    expect(slugify("GPU___Deals")).toBe("gpu-deals");
    expect(slugify("---")).toBe("");
  });
});
