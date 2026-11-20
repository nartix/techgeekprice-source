import type { DataProvider } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";

import {
  createAdminFormOptionLoaderApi,
  normalizeAdminFieldOptions,
  preserveSelectedAdminFieldOptions,
} from "../adminFormOptions";

describe("admin form options", () => {
  it("normalizes missing options and preserves selected values", () => {
    const empty = normalizeAdminFieldOptions(undefined);

    expect(empty).toEqual([]);
    expect(preserveSelectedAdminFieldOptions(empty, "brand_1")).toEqual([
      { disabled: true, label: "brand_1", value: "brand_1" },
    ]);
    expect(
      preserveSelectedAdminFieldOptions(
        [{ label: "Lenovo", value: "brand_1" }],
        "brand_1",
      ),
    ).toEqual([{ label: "Lenovo", value: "brand_1" }]);
  });

  it("loads options through the Refine data provider adapter", async () => {
    const getList = vi.fn(async () => ({
      data: [{ id: "brand_1", name: "Lenovo" }],
      total: 1,
    }));
    const api = createAdminFormOptionLoaderApi({
      getList,
    } as unknown as DataProvider);

    const options = await api.loadOptions({
      filters: { active: true },
      labelField: "name",
      resource: "brands",
      search: "len",
      valueField: "id",
    });

    expect(options).toEqual([{ label: "Lenovo", value: "brand_1" }]);
    expect(getList).toHaveBeenCalledWith({
      filters: [
        { field: "active", operator: "eq", value: true },
        { field: "q", operator: "contains", value: "len" },
      ],
      pagination: { currentPage: 1, pageSize: 50 },
      resource: "brands",
    });
  });
});
