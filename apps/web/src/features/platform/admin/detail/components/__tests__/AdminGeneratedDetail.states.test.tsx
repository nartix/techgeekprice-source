import type { BaseRecord } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "../../../../../../../tests/test-utils/render";
import { getAdminResourceMetadata } from "../../../resources/adminResources";
import {
  AdminGeneratedDetail,
  defineAdminDetailConfig,
  detailField,
  detailSection,
  type AdminResourceDetailResult,
} from "../../index";

interface RawRecord extends BaseRecord {
  id: string;
  name: string;
}

describe("AdminGeneratedDetail states", () => {
  it("renders safe loading, forbidden, invalid, not-found, error, empty, and ready states", () => {
    const { rerender } = render(
      <AdminGeneratedDetail result={resultFor({ state: "loading" })} />,
    );
    expect(screen.getByText("Loading record")).toBeVisible();

    rerender(<AdminGeneratedDetail result={resultFor({ state: "forbidden" })} />);
    expect(screen.getByText("Access denied")).toBeVisible();
    expect(screen.getByText("Forbidden.")).toBeVisible();

    rerender(<AdminGeneratedDetail result={resultFor({ state: "invalid" })} />);
    expect(screen.getByText("Record unavailable")).toBeVisible();
    expect(screen.queryByText(/stack|token|secret|hidden record/i)).toBeNull();

    rerender(<AdminGeneratedDetail result={resultFor({ state: "not-found" })} />);
    expect(screen.getByText("Record not found")).toBeVisible();

    rerender(
      <AdminGeneratedDetail
        result={resultFor({
          error: new Error("stack token exception hidden record"),
          state: "error",
        })}
      />,
    );
    expect(screen.getByText("Unable to load record")).toBeVisible();
    expect(screen.queryByText(/stack token exception/i)).toBeNull();

    rerender(<AdminGeneratedDetail result={resultFor({ state: "empty" })} />);
    expect(screen.getByText("No visible detail content")).toBeVisible();

    rerender(<AdminGeneratedDetail result={resultFor()} />);
    expect(screen.getByRole("heading", { name: /alpha/i })).toBeVisible();
  });

  it("renders retry only when the result exposes a safe retry callback", () => {
    const { rerender } = render(
      <AdminGeneratedDetail
        result={resultFor({ onRetry: undefined, state: "error" })}
      />,
    );

    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();

    rerender(
      <AdminGeneratedDetail result={resultFor({ state: "error" })} />,
    );
    expect(screen.getByRole("button", { name: /retry/i })).toBeVisible();
  });
});

function resultFor(
  options: Partial<AdminResourceDetailResult<RawRecord, RawRecord>> = {},
): AdminResourceDetailResult<RawRecord, RawRecord> {
  const config = defineAdminDetailConfig<RawRecord>({
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
  const state = options.state ?? "ready";

  return {
    config,
    error: null,
    id: "record_1",
    identity: null,
    isFetching: false,
    isForbidden: state === "forbidden",
    isInvalidRouteId: state === "invalid",
    isLoading: state === "loading",
    labels,
    locale: "en-CA",
    metadata: getAdminResourceMetadata("users"),
    onRetry: vi.fn(),
    queryEnabled: true,
    record: { id: "record_1", name: "Alpha" },
    resource: "users",
    rawRecord: { id: "record_1", name: "Alpha" },
    state,
    ...options,
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
