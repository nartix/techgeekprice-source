import { describe, expect, it } from "vitest";

import {
  getAdminFormDefaultValues,
  mergeAdminFormEditValues,
} from "../adminFormDefaults";

interface TestValues {
  active: boolean;
  name: string;
  tags?: string[];
}

describe("admin form defaults", () => {
  it("resolves object and function defaults without reusing the source object", () => {
    const source = { active: true, name: "Draft" };
    const objectDefaults = getAdminFormDefaultValues<TestValues>(source);
    const functionDefaults = getAdminFormDefaultValues<TestValues>(() => source);

    expect(objectDefaults).toEqual(source);
    expect(functionDefaults).toEqual(source);
    expect(objectDefaults).not.toBe(source);
    expect(functionDefaults).not.toBe(source);
  });

  it("merges edit values over cloned defaults", () => {
    const defaults = { active: true, name: "", tags: ["default"] };
    const merged = mergeAdminFormEditValues<TestValues>(defaults, {
      name: "Existing",
    });

    expect(merged).toEqual({
      active: true,
      name: "Existing",
      tags: ["default"],
    });
    expect(merged).not.toBe(defaults);
  });
});
