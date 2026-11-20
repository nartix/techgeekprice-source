import { useOne } from "@refinedev/core";
import type { BaseRecord } from "@refinedev/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { act, renderHook } from "../../../../../../../tests/test-utils/render";
import type { AdminIdentity } from "../../../types/admin.types";
import {
  defineAdminDetailConfig,
  detailField,
  detailSection,
  type AdminDetailDefinition,
} from "../../types/admin-detail.types";
import { useAdminResourceDetail } from "../useAdminResourceDetail";
import { useAdminResourceDetailViewResult } from "../useAdminResourceDetailViewResult";

vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();

  return {
    ...actual,
    useOne: vi.fn(),
  };
});

interface RawRecord extends BaseRecord {
  id: string;
  name: string;
}

interface ViewRecord {
  id: string;
  displayName: string;
}

const useOneMock = vi.mocked(useOne);

describe("useAdminResourceDetail", () => {
  beforeEach(() => {
    useOneMock.mockReset();
    useOneMock.mockReturnValue(oneResult());
  });

  it("disables get-by-ID when read permission is missing", () => {
    const { result } = renderHook(() =>
      useAdminResourceDetail({
        config: detailConfig(),
        id: "user_1",
        identity: identity({ permissions: ["admin:users:write"] }),
        locale: "en-CA",
      }),
    );

    expect(useOneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user_1",
        queryOptions: { enabled: false },
        resource: "users",
      }),
    );
    expect(result.current.state).toBe("forbidden");
    expect(result.current.onRetry).toBeUndefined();
  });

  it("composes the optional caller query gate with the default permission gate", () => {
    renderHook(() =>
      useAdminResourceDetail({
        config: detailConfig(),
        id: "user_1",
        identity: identity({ permissions: ["admin:users:read"] }),
        locale: "en-CA",
        queryEnabled: false,
      }),
    );

    expect(useOneMock).toHaveBeenCalledWith(
      expect.objectContaining({ queryOptions: { enabled: false } }),
    );
  });

  it("disables get-by-ID for blank and resource-invalid route ids", () => {
    renderHook(() =>
      useAdminResourceDetail({
        config: detailConfig({ validateRouteId: (id) => id.startsWith("user_") }),
        id: " ",
        identity: identity({ permissions: ["admin:users:read"] }),
        locale: "en-CA",
      }),
    );

    expect(useOneMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "",
        queryOptions: { enabled: false },
      }),
    );

    const { result } = renderHook(() =>
      useAdminResourceDetail({
        config: detailConfig({ validateRouteId: (id) => id.startsWith("user_") }),
        id: "bad",
        identity: identity({ permissions: ["admin:users:read"] }),
        locale: "en-CA",
      }),
    );

    expect(useOneMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "bad",
        queryOptions: { enabled: false },
      }),
    );
    expect(result.current.state).toBe("invalid");
  });

  it("defaults to allowing non-empty ids when no validator is configured", () => {
    renderHook(() =>
      useAdminResourceDetail({
        config: detailConfig(),
        id: "any-non-empty",
        identity: identity({ permissions: ["admin:users:read"] }),
        locale: "en-CA",
      }),
    );

    expect(useOneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "any-non-empty",
        queryOptions: { enabled: true },
      }),
    );
  });

  it("maps transformed records and only retries when the query is safe", () => {
    const refetch = vi.fn();
    useOneMock.mockReturnValue(oneResult({ refetch }));
    const { result } = renderHook(() =>
      useAdminResourceDetail({
        config: detailConfig(),
        id: "user_1",
        identity: identity({ permissions: ["admin:users:read"] }),
        locale: "en-CA",
      }),
    );

    expect(result.current.state).toBe("ready");
    expect(result.current.record).toEqual({
      id: "user_1",
      displayName: "Admin User",
    });
    expect(result.current.id).toBe("user_1");
    expect(result.current.locale).toBe("en-CA");
    expect(result.current.metadata.name).toBe("users");
    expect(result.current.rawRecord).toEqual({
      id: "user_1",
      name: "Admin User",
    });

    act(() => {
      result.current.onRetry?.();
    });

    expect(refetch).toHaveBeenCalledOnce();
  });

  it("maps safe not-found errors without exposing backend payloads", () => {
    useOneMock.mockReturnValue(
      oneResult({
        data: undefined,
        error: {
          response: {
            status: 404,
            data: { message: "hidden user_1 token detail" },
          },
        },
        isError: true,
      }),
    );

    const { result } = renderHook(() =>
      useAdminResourceDetail({
        config: detailConfig(),
        id: "user_1",
        identity: identity({ permissions: ["admin:users:read"] }),
        locale: "en-CA",
      }),
    );

    expect(result.current.state).toBe("not-found");
    expect(result.current.record).toBeUndefined();
  });
});

describe("useAdminResourceDetailViewResult", () => {
  beforeEach(() => {
    useOneMock.mockReset();
    useOneMock.mockReturnValue(oneResult());
  });

  it("derives visible sections and empty content from hook output", () => {
    const { result } = renderHook(() => {
      const detail = useAdminResourceDetail({
        config: detailConfig(),
        id: "user_1",
        identity: identity({ permissions: ["admin:users:read"] }),
        locale: "en-CA",
      });

      return useAdminResourceDetailViewResult(detail);
    });

    expect(result.current.title).toBe("Admin User");
    expect(result.current.sections).toHaveLength(1);
    expect(result.current.sections[0]?.fields[0]?.node).toBe("Admin User");
    expect(result.current.state).toBe("ready");
  });

  it("returns empty when every section, panel, and action is hidden", () => {
    const { result } = renderHook(() => {
      const detail = useAdminResourceDetail({
        config: detailConfig({
          actions: [],
          sections: [
            detailSection<RawRecord, ViewRecord>({
              id: "hidden",
              title: "Hidden",
              fields: [
                detailField<RawRecord, ViewRecord, "displayName">({
                  id: "name",
                  label: "Name",
                  valueKey: "displayName",
                  visibleWhen: () => false,
                }),
              ],
            }),
          ],
        }),
        id: "user_1",
        identity: identity({ permissions: ["admin:users:read"] }),
        locale: "en-CA",
      });

      return useAdminResourceDetailViewResult(detail);
    });

    expect(result.current.sections).toEqual([]);
    expect(result.current.isEmptyContent).toBe(true);
    expect(result.current.state).toBe("empty");
  });
});

function detailConfig(
  overrides: Partial<AdminDetailDefinition<RawRecord, ViewRecord>> = {},
): AdminDetailDefinition<RawRecord, ViewRecord> {
  return defineAdminDetailConfig<RawRecord, ViewRecord>({
    resource: "users",
    labels: {
      loading: "Loading detail",
      forbiddenTitle: "Access denied",
      forbiddenMessage: "You cannot read this resource.",
      invalidTitle: "Invalid record",
      invalidMessage: "The record id is invalid.",
      notFoundTitle: "Record not found",
      notFoundMessage: "The record was not found.",
      errorTitle: "Unable to load record",
      errorMessage: "The record could not be loaded.",
      emptyTitle: "No visible content",
      emptyMessage: "There is no configured content.",
      retry: "Retry",
    },
    title: ({ record }) => record.displayName,
    transformRecord: (record) => ({
      id: record.id,
      displayName: record.name,
    }),
    sections: [
      detailSection<RawRecord, ViewRecord>({
        id: "main",
        title: "Main",
        fields: [
          detailField<RawRecord, ViewRecord, "displayName">({
            id: "name",
            label: "Name",
            valueKey: "displayName",
          }),
        ],
      }),
    ],
    ...overrides,
  });
}

function identity(overrides: Partial<AdminIdentity> = {}): AdminIdentity {
  return {
    id: "admin_1",
    username: "admin",
    roles: [],
    permissions: [],
    sessionScope: "admin",
    ...overrides,
  };
}

function oneResult(
  overrides: {
    data?: RawRecord;
    error?: unknown;
    isError?: boolean;
    isFetching?: boolean;
    isLoading?: boolean;
    refetch?: () => void;
  } = {},
) {
  const data = Object.prototype.hasOwnProperty.call(overrides, "data")
    ? overrides.data
    : { id: "user_1", name: "Admin User" };

  return {
    query: {
      data,
      error: overrides.error ?? null,
      isError: overrides.isError ?? false,
      isFetching: overrides.isFetching ?? false,
      isLoading: overrides.isLoading ?? false,
      refetch: overrides.refetch ?? vi.fn(),
    },
    result: data,
  } as ReturnType<typeof useOne>;
}
