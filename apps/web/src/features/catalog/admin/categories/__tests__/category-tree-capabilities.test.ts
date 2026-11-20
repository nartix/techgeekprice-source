import { describe, expect, it } from "vitest";

import {
  canAppendParentMove,
  canShowTreeManualOrderingControls,
  getTreeVisibleOrderMode,
  hasTreePlacementMode,
} from "../tree/category-tree-capabilities";
import {
  appendUnavailableCapabilities,
  rankedExposedCapabilities,
  rankedHiddenCapabilities,
  unrankedCapabilities,
} from "./category-tree.fixtures";

describe("small category tree capability helpers", () => {
  it("detects append move support from ready placement modes only", () => {
    expect(
      canAppendParentMove({
        status: "ready",
        capabilities: rankedHiddenCapabilities,
      }),
    ).toBe(true);
    expect(
      canAppendParentMove({
        status: "ready",
        capabilities: unrankedCapabilities,
      }),
    ).toBe(true);
    expect(
      canAppendParentMove({
        status: "ready",
        capabilities: appendUnavailableCapabilities,
      }),
    ).toBe(false);
    expect(canAppendParentMove({ status: "loading" })).toBe(false);
    expect(hasTreePlacementMode({ status: "loading" }, "APPEND")).toBe(false);
  });

  it("keeps manual ordering controls hidden unless rank metadata is visible", () => {
    expect(
      canShowTreeManualOrderingControls({
        status: "ready",
        capabilities: rankedExposedCapabilities,
      }),
    ).toBe(true);
    expect(
      canShowTreeManualOrderingControls({
        status: "ready",
        capabilities: rankedHiddenCapabilities,
      }),
    ).toBe(false);
    expect(
      canShowTreeManualOrderingControls({
        status: "ready",
        capabilities: unrankedCapabilities,
      }),
    ).toBe(false);
  });

  it.each([
    [rankedExposedCapabilities, "rank"],
    [rankedHiddenCapabilities, "fallback"],
    [unrankedCapabilities, "fallback"],
  ] as const)("resolves the visible order mode", (capabilities, expected) => {
    expect(getTreeVisibleOrderMode({ status: "ready", capabilities })).toBe(
      expected,
    );
  });

  it("uses canonical nested ordering rather than compatibility aliases", () => {
    const capabilities = {
      ...rankedExposedCapabilities,
      rankingEnabled: true,
      sortRankExposed: true,
      ordering: {
        ...rankedExposedCapabilities.ordering,
        rankingEnabled: false,
        rankExposed: false,
      },
    };

    expect(getTreeVisibleOrderMode({ status: "ready", capabilities })).toBe(
      "fallback",
    );
    expect(
      canShowTreeManualOrderingControls({ status: "ready", capabilities }),
    ).toBe(false);
  });

  it("treats loading and error capabilities as unknown order mode", () => {
    expect(getTreeVisibleOrderMode({ status: "loading" })).toBe("unknown");
    expect(getTreeVisibleOrderMode({ status: "error", error: new Error() })).toBe(
      "unknown",
    );
  });
});
