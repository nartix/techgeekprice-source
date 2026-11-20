import { describe, expect, it } from "vitest";

import {
  isAdminDetailActionVisible,
  isAdminDetailFieldVisible,
  isAdminDetailPanelVisible,
  isAdminDetailSectionVisible,
} from "../adminDetailVisibility";
import type { AdminDetailFieldRenderContext } from "../../types/admin-detail.types";

interface RawRecord {
  id: string;
}

interface ViewRecord {
  id: string;
  active: boolean;
}

const context = {
  id: "record_1",
  identity: {
    id: "admin_1",
    username: "admin",
    roles: ["ADMIN"],
    permissions: ["admin:users:read", "admin:users:write"],
    sessionScope: "admin",
  },
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
    permissions: {
      list: "admin:users:read",
      show: "admin:users:read",
      create: "admin:users:write",
      edit: "admin:users:write",
      delete: "admin:users:write",
      state: "admin:users:status",
    },
    capabilities: {
      filters: [],
      search: [],
      optionalActions: [],
    },
  },
  permissions: ["admin:users:read", "admin:users:write"],
  record: { id: "record_1", active: true },
  resource: "users",
  roles: ["ADMIN"],
  rawRecord: { id: "record_1" },
} satisfies AdminDetailFieldRenderContext<RawRecord, ViewRecord>;

describe("admin detail visibility helpers", () => {
  it("checks role, permission, predicate, and support gates", () => {
    expect(
      isAdminDetailFieldVisible(
        { id: "status", label: "Status", permissions: ["admin:users:write"] },
        context,
      ),
    ).toBe(true);

    expect(
      isAdminDetailFieldVisible(
        { id: "status", label: "Status", roles: ["MODERATOR"] },
        context,
      ),
    ).toBe(false);

    expect(
      isAdminDetailSectionVisible(
        {
          id: "main",
          title: "Main",
          fields: [],
          visibleWhen: ({ record }) => record.active,
        },
        context,
      ),
    ).toBe(true);

    expect(
      isAdminDetailActionVisible(
        {
          id: "delete",
          kind: "mutation",
          label: "Delete",
          isSupported: () => false,
        },
        context,
      ),
    ).toBe(false);

    expect(
      isAdminDetailPanelVisible(
        {
          id: "activity",
          title: "Activity",
          labels: {
            errorTitle: "Panel unavailable",
            errorMessage: "Panel failed.",
          },
          render: () => null,
          visibleWhen: ({ identity }) => identity?.username === "admin",
        },
        context,
      ),
    ).toBe(true);
  });

  it("checks resource action gates through admin permission metadata", () => {
    const statusContext = {
      ...context,
      identity: {
        ...context.identity,
        roles: [],
        permissions: ["admin:users:status"],
      },
      permissions: ["admin:users:status"],
      roles: [],
    } satisfies AdminDetailFieldRenderContext<RawRecord, ViewRecord>;

    expect(
      isAdminDetailActionVisible(
        {
          id: "status",
          kind: "mutation",
          label: "Deactivate",
          resourceAction: "state",
        },
        statusContext,
      ),
    ).toBe(true);

    expect(
      isAdminDetailActionVisible(
        {
          id: "edit",
          kind: "navigation",
          label: "Edit",
          resourceAction: "edit",
        },
        statusContext,
      ),
    ).toBe(false);
  });
});
