import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderHook } from "../../../../../../../tests/test-utils/render";
import {
  customDetailPanel,
  relatedAdminPanel,
  type AdminDetailBaseContext,
} from "../../types/admin-detail.types";
import { useAdminDetailPanel } from "../useAdminDetailPanel";

interface RawRecord {
  id: string;
}

interface ViewRecord {
  id: string;
  name: string;
}

describe("useAdminDetailPanel", () => {
  it("isolates custom panel loader failures", async () => {
    const panel = customDetailPanel<RawRecord, ViewRecord, { count: number }>({
      id: "activity",
      title: "Activity",
      labels: {
        loading: "Loading panel",
        empty: "No panel data",
        errorTitle: "Panel unavailable",
        errorMessage: "Panel failed safely.",
      },
      load: vi.fn().mockRejectedValue(new Error("raw stack token")),
      render: ({ data }) => data?.count,
    });

    const context = baseContext();
    const { result } = renderHook(() => useAdminDetailPanel({ context, panel }));

    await waitFor(() => expect(result.current.state).toBe("error"));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.labels.errorMessage).toBe("Panel failed safely.");
  });

  it("does not dispatch unsupported related panels", () => {
    const render = vi.fn();
    const panel = relatedAdminPanel<RawRecord, ViewRecord, RawRecord>({
      id: "orders",
      title: "Orders",
      resource: "users",
      labels: {
        errorTitle: "Related panel unavailable",
        errorMessage: "Related panel failed.",
      },
      query: {
        filters: [{ field: "userId", operator: "eq", value: "user_1" }],
      },
      isSupported: () => false,
      render,
    });

    const context = baseContext();
    const { result } = renderHook(() => useAdminDetailPanel({ context, panel }));

    expect(result.current.state).toBe("unsupported");
    expect(render).not.toHaveBeenCalled();
  });

  it("represents supported related panels as empty fixtures without custom dispatch", () => {
    const render = vi.fn();
    const panel = relatedAdminPanel<RawRecord, ViewRecord, RawRecord>({
      id: "orders",
      title: "Orders",
      resource: "users",
      labels: {
        empty: "No related records",
        errorTitle: "Related panel unavailable",
        errorMessage: "Related panel failed.",
      },
      query: {},
      isSupported: () => true,
      render,
    });

    const context = baseContext();
    const { result } = renderHook(() => useAdminDetailPanel({ context, panel }));

    expect(result.current.state).toBe("empty");
    expect(result.current.data).toEqual([]);
    expect(render).not.toHaveBeenCalled();
  });
});

function baseContext(): AdminDetailBaseContext<RawRecord, ViewRecord> {
  return {
    id: "user_1",
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
    record: { id: "user_1", name: "Admin User" },
    resource: "users",
    roles: [],
    rawRecord: { id: "user_1" },
  };
}
