import type { BaseRecord } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "../../../../../../../tests/test-utils/render";
import { getAdminResourceMetadata } from "../../../resources/adminResources";
import type { AdminIdentity } from "../../../types/admin.types";
import {
  AdminGeneratedDetail,
  customDetailPanel,
  defineAdminDetailConfig,
  detailComputedField,
  detailField,
  detailSection,
  type AdminDetailDefinition,
  type AdminResourceDetailResult,
} from "../../index";

interface RawRecord extends BaseRecord {
  id: string;
  name: string;
  passwordHash?: string;
  token?: string;
}

interface ViewRecord {
  accountStateLabel: string;
  capabilityFlagsLabel: string;
  id: string;
  displayName: string;
  internalIdLabel: string;
  permissionsLabel: string;
  rolesLabel: string;
}

describe("AdminGeneratedDetail config contract", () => {
  it("renders transformed view models, computed fields, and custom panels", () => {
    render(<AdminGeneratedDetail result={resultFor(transformedConfig())} />);

    expect(screen.getByRole("heading", { name: /display alpha/i })).toBeVisible();
    expect(screen.getAllByText("Display Alpha")).toHaveLength(2);
    expect(screen.getByText("record_1:en-CA")).toBeVisible();
    expect(screen.getByText("Panel for Display Alpha")).toBeVisible();
  });

  it("supports no-transform fallback while still rendering explicit fields only", () => {
    render(<AdminGeneratedDetail result={resultFor(noTransformConfig())} />);

    expect(screen.getByRole("heading", { name: /^alpha$/i })).toBeVisible();
    expect(screen.getAllByText("Alpha")).toHaveLength(2);
    expect(screen.queryByText(/password-secret/i)).toBeNull();
    expect(screen.queryByText(/token-secret/i)).toBeNull();
  });
});

detailField<RawRecord, ViewRecord, "displayName">({
  id: "name",
  label: "Name",
  valueKey: "displayName",
});

detailComputedField<RawRecord, ViewRecord>({
  id: "computed",
  label: "Computed",
  value: ({ id }) => id,
});

detailField<RawRecord, ViewRecord, "rolesLabel">({
  id: "roles",
  label: "Roles",
  valueKey: "rolesLabel",
  sensitive: true,
  sensitiveKind: "roles",
  safeRenderer: true,
  render: ({ value }) => String(value),
});

detailField<RawRecord, ViewRecord, "permissionsLabel">({
  id: "permissions",
  label: "Permissions",
  valueKey: "permissionsLabel",
  sensitive: true,
  sensitiveKind: "permissions",
  safeRenderer: true,
  render: ({ value }) => String(value),
});

detailField<RawRecord, ViewRecord, "accountStateLabel">({
  id: "account-state",
  label: "Account state",
  valueKey: "accountStateLabel",
  sensitive: true,
  sensitiveKind: "account-state",
  safeRenderer: true,
  render: ({ value }) => String(value),
});

detailField<RawRecord, ViewRecord, "capabilityFlagsLabel">({
  id: "capability-flags",
  label: "Capability flags",
  valueKey: "capabilityFlagsLabel",
  sensitive: true,
  sensitiveKind: "capability-flags",
  safeRenderer: true,
  render: ({ value }) => String(value),
});

detailField<RawRecord, ViewRecord, "internalIdLabel">({
  id: "internal-id",
  label: "Internal id",
  valueKey: "internalIdLabel",
  sensitive: true,
  sensitiveKind: "internal-identifier",
  safeRenderer: true,
  render: ({ value }) => String(value),
});

// @ts-expect-error invalid display-model keys must be rejected at compile time
detailField<RawRecord, ViewRecord, "passwordHash">({
  id: "bad-key",
  label: "Bad key",
  valueKey: "passwordHash",
});

detailComputedField<RawRecord, ViewRecord>({
  id: "bad-async-value",
  label: "Bad async value",
  // @ts-expect-error field value callbacks must be synchronous
  value: async () => "unsafe",
});

detailComputedField<RawRecord, ViewRecord>({
  id: "bad-side-effect-access",
  label: "Bad side-effect access",
  // @ts-expect-error field callbacks must not receive refetch helpers
  value: (ctx) => ctx.refetch,
});

detailComputedField<RawRecord, ViewRecord>({
  id: "bad-notify-access",
  label: "Bad notify access",
  // @ts-expect-error field callbacks must not receive action notification helpers
  value: (ctx) => ctx.notify,
});

detailField<RawRecord, ViewRecord, "displayName">({
  id: "bad-async-render",
  label: "Bad async render",
  valueKey: "displayName",
  // @ts-expect-error field render callbacks must be synchronous
  render: async ({ value }) => String(value),
});

// @ts-expect-error sensitive-adjacent fields require safeRenderer and render
detailField<RawRecord, ViewRecord, "rolesLabel">({
  id: "bad-sensitive-field",
  label: "Bad sensitive field",
  valueKey: "rolesLabel",
  sensitive: true,
  sensitiveKind: "roles",
});

function transformedConfig(): AdminDetailDefinition<RawRecord, ViewRecord> {
  return defineAdminDetailConfig<RawRecord, ViewRecord>({
    resource: "users",
    labels,
    title: ({ record }) => record.displayName,
    transformRecord: (record) => ({
      accountStateLabel: "Active",
      capabilityFlagsLabel: "Read enabled",
      id: record.id,
      displayName: `Display ${record.name}`,
      internalIdLabel: record.id,
      permissionsLabel: "Read permission",
      rolesLabel: "Admin role",
    }),
    sections: [
      detailSection<RawRecord, ViewRecord>({
        id: "main",
        title: "Main",
        fields: [
          detailField<RawRecord, ViewRecord, "displayName">({
            id: "displayName",
            label: "Display name",
            valueKey: "displayName",
          }),
          detailComputedField<RawRecord, ViewRecord>({
            id: "computed",
            label: "Computed",
            value: ({ id, locale }) => `${id}:${locale}`,
          }),
        ],
      }),
    ],
    panels: [
      customDetailPanel<RawRecord, ViewRecord>({
        id: "custom",
        title: "Custom panel",
        labels: {
          errorTitle: "Panel unavailable",
          errorMessage: "Panel failed.",
        },
        render: ({ record }) => `Panel for ${record.displayName}`,
      }),
    ],
  });
}

function noTransformConfig(): AdminDetailDefinition<RawRecord, RawRecord> {
  return defineAdminDetailConfig<RawRecord>({
    resource: "users",
    labels,
    title: ({ record }) => record.name,
    sections: [
      detailSection<RawRecord, RawRecord>({
        id: "main",
        title: "Main",
        fields: [
          detailField<RawRecord, RawRecord, "name">({
            id: "name",
            label: "Name",
            valueKey: "name",
          }),
        ],
      }),
    ],
  });
}

function resultFor<TView>(
  config: AdminDetailDefinition<RawRecord, TView>,
): AdminResourceDetailResult<RawRecord, TView> {
  const rawRecord = {
    id: "record_1",
    name: "Alpha",
    passwordHash: "password-secret",
    token: "token-secret",
  };
  const record = config.transformRecord
    ? config.transformRecord(rawRecord, "en-CA")
    : (rawRecord as TView);

  return {
    config,
    error: null,
    id: "record_1",
    identity: identity(),
    isFetching: false,
    isForbidden: false,
    isInvalidRouteId: false,
    isLoading: false,
    labels: config.labels,
    locale: "en-CA",
    metadata: getAdminResourceMetadata("users"),
    onRetry: vi.fn(),
    queryEnabled: true,
    record,
    resource: "users",
    rawRecord,
    state: "ready",
  };
}

function identity(overrides: Partial<AdminIdentity> = {}): AdminIdentity {
  return {
    id: "admin_1",
    username: "admin",
    roles: ["ADMIN"],
    permissions: ["admin:users:read"],
    sessionScope: "admin",
    ...overrides,
  };
}

const labels = {
  emptyMessage: "No configured detail content is visible.",
  emptyTitle: "No visible detail content",
  errorMessage: "The record could not be loaded.",
  errorTitle: "Unable to load record",
  forbiddenMessage: "Forbidden.",
  forbiddenTitle: "Access denied",
  invalidMessage: "Invalid record.",
  invalidTitle: "Record unavailable",
  loading: "Loading record",
  notFoundMessage: "Not found.",
  notFoundTitle: "Record not found",
  retry: "Retry",
};
