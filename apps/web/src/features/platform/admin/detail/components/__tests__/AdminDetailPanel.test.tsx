import type { BaseRecord } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "../../../../../../../tests/test-utils/render";
import { getAdminResourceMetadata } from "../../../resources/adminResources";
import {
  AdminDetailPanel,
  customDetailPanel,
  type AdminDetailBaseContext,
} from "../../index";

interface RawRecord extends BaseRecord {
  id: string;
  name: string;
}

describe("AdminDetailPanel", () => {
  it("renders custom panel ready and empty states", async () => {
    const { rerender } = render(
      <AdminDetailPanel
        context={context()}
        panel={customDetailPanel<RawRecord, RawRecord, { count: number }>({
          id: "ready",
          title: "Ready panel",
          labels: panelLabels,
          load: vi.fn().mockResolvedValue({ count: 2 }),
          render: ({ data }) => `Count ${data?.count}`,
        })}
      />,
    );

    await waitFor(() => expect(screen.getByText("Count 2")).toBeVisible());

    rerender(
      <AdminDetailPanel
        context={context()}
        panel={customDetailPanel<RawRecord, RawRecord, { count: number }>({
          id: "empty",
          title: "Empty panel",
          labels: panelLabels,
          load: vi.fn().mockResolvedValue({ count: 0 }),
          isEmpty: (data) => data.count === 0,
          render: ({ data }) => `Count ${data?.count}`,
        })}
      />,
    );

    await waitFor(() => expect(screen.getByText("No panel data")).toBeVisible());
  });
});

function context(): AdminDetailBaseContext<RawRecord, RawRecord> {
  return {
    id: "record_1",
    identity: null,
    locale: "en-CA",
    metadata: getAdminResourceMetadata("users"),
    permissions: [],
    record: { id: "record_1", name: "Alpha" },
    resource: "users",
    roles: [],
    rawRecord: { id: "record_1", name: "Alpha" },
  };
}

const panelLabels = {
  empty: "No panel data",
  errorMessage: "Panel failed safely.",
  errorTitle: "Panel unavailable",
  loading: "Loading panel",
};
