import type { BaseRecord } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "../../../../../../../tests/test-utils/render";
import { getAdminResourceMetadata } from "../../../resources/adminResources";
import {
  AdminGeneratedDetail,
  customDetailPanel,
  defineAdminDetailConfig,
  detailField,
  detailSection,
  type AdminResourceDetailResult,
} from "../../index";

interface RawRecord extends BaseRecord {
  id: string;
  name: string;
}

describe("AdminDetailPanel error isolation", () => {
  it("keeps the main detail ready when a panel fails", async () => {
    render(<AdminGeneratedDetail result={resultWithFailingPanel()} />);

    expect(screen.getByRole("heading", { name: /alpha/i })).toBeVisible();
    expect(screen.getAllByText("Alpha")).toHaveLength(2);

    await waitFor(() =>
      expect(screen.getByText("Panel failed safely.")).toBeVisible(),
    );
    expect(screen.queryByText(/raw token stack/i)).toBeNull();
  });
});

function resultWithFailingPanel(): AdminResourceDetailResult<
  RawRecord,
  RawRecord
> {
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
    panels: [
      customDetailPanel<RawRecord, RawRecord>({
        id: "failing",
        title: "Failing panel",
        labels: {
          errorTitle: "Panel unavailable",
          errorMessage: "Panel failed safely.",
        },
        load: vi.fn().mockRejectedValue(new Error("raw token stack")),
        render: () => null,
      }),
    ],
  });

  return {
    config,
    error: null,
    id: "record_1",
    identity: null,
    isFetching: false,
    isForbidden: false,
    isInvalidRouteId: false,
    isLoading: false,
    labels,
    locale: "en-CA",
    metadata: getAdminResourceMetadata("users"),
    onRetry: vi.fn(),
    queryEnabled: true,
    record: { id: "record_1", name: "Alpha" },
    resource: "users",
    rawRecord: { id: "record_1", name: "Alpha" },
    state: "ready",
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
