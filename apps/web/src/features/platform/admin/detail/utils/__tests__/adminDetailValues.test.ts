import { describe, expect, it } from "vitest";

import {
  normalizeAdminDetailDisplayValue,
  resolveAdminDetailFieldValue,
} from "../adminDetailValues";
import type { AdminDetailFieldRenderContext } from "../../types/admin-detail.types";

interface RawRecord {
  id: string;
}

interface ViewRecord {
  id: string;
  name: string;
  nickname?: string;
  active: boolean;
  count: number;
}

const context = {
  id: "record_1",
  identity: null,
  locale: "en-CA",
  metadata: {
    name: "users",
    list: "/admin/users",
    create: "/admin/users/create",
    show: "/admin/users/:id",
    edit: "/admin/users/:id/edit",
    apiPath: "/api/v1/admin/users",
    labelKey: "Admin.Navigation.users",
    icon: "users",
    permissions: {},
    capabilities: {
      filters: [],
      search: [],
      optionalActions: [],
    },
  },
  permissions: [],
  record: { id: "record_1", name: "Admin", active: true, count: 2 },
  resource: "users",
  roles: [],
  rawRecord: { id: "record_1" },
} satisfies AdminDetailFieldRenderContext<RawRecord, ViewRecord>;

describe("admin detail value helpers", () => {
  it("resolves key-backed and computed field values synchronously", () => {
    expect(
      resolveAdminDetailFieldValue(
        { id: "name", label: "Name", valueKey: "name" },
        context,
      ),
    ).toBe("Admin");

    expect(
      resolveAdminDetailFieldValue(
        { id: "virtual", label: "Virtual", value: ({ id }) => id },
        context,
      ),
    ).toBe("record_1");
  });

  it("normalizes display values and applies empty fallbacks", () => {
    expect(normalizeAdminDetailDisplayValue(true)).toBe("true");
    expect(normalizeAdminDetailDisplayValue(2)).toBe("2");
    expect(normalizeAdminDetailDisplayValue("")).toBe("");
    expect(
      normalizeAdminDetailDisplayValue(undefined, "Not provided"),
    ).toBe("Not provided");
  });
});
