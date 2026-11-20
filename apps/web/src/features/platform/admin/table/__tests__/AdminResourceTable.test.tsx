import type { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import { AdminResourceTable } from "../AdminResourceTable";
import type {
  AdminResourceTableConfig,
  AdminResourceTablePageMetadata,
} from "../admin-resource-table.types";
import { useAdminResourceTableViewResult } from "../useAdminResourceTableViewResult";

interface TestRow {
  id: string;
  name: string;
}

const columns: Array<ColumnDef<TestRow, unknown>> = [
  {
    accessorKey: "name",
    header: "Name",
  },
];

describe("AdminResourceTable", () => {
  it("renders title, description, metadata, page size, pagination, and scroll container", () => {
    render(<TableHarness />);

    expect(screen.getByRole("heading", { name: "Test resources" })).toBeVisible();
    expect(screen.getByText("Shared table description")).toBeVisible();
    expect(screen.getByText("Page 1 of 3 - 42 total")).toBeVisible();
    expect(screen.getByRole("combobox", { name: /rows per page/i })).toBeVisible();
    expect(screen.getByLabelText(/test pages/i)).toBeVisible();
    expect(screen.getByTestId("admin-resource-table-scroll")).toBeVisible();
  });

  it("renders loading, empty, and error states with retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<TableHarness rows={[]} loading />);

    expect(screen.getByText(/loading admin dashboard/i)).toBeVisible();

    rerender(<TableHarness rows={[]} />);

    expect(screen.getByText("No records found.")).toBeVisible();

    rerender(<TableHarness rows={[]} error onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("preserves rows while showing a refetching status", () => {
    render(<TableHarness fetching />);

    expect(screen.getByText("Alpha")).toBeVisible();
    expect(screen.getByText("Refreshing table data")).toBeVisible();
  });

  it("shows forbidden state before table controls", () => {
    render(<TableHarness forbidden />);

    expect(screen.getByText(/access denied/i)).toBeVisible();
    expect(screen.queryByRole("combobox", { name: /rows per page/i })).toBeNull();
  });

  it("calls page size and page callbacks", async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    const onPageChange = vi.fn();

    render(
      <TableHarness
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /rows per page/i }));
    await user.click(screen.getByRole("option", { name: "50" }));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);

    await user.click(screen.getByRole("button", { name: "2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("scrolls to the table top when the page changes", () => {
    const originalScrollIntoView =
      window.HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();

    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    try {
      const { rerender } = render(<TableHarness />);

      expect(scrollIntoView).not.toHaveBeenCalled();

      rerender(<TableHarness currentPage={2} />);

      expect(scrollIntoView).toHaveBeenCalledWith({
        block: "start",
        behavior: "smooth",
      });
    } finally {
      Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value: originalScrollIntoView,
      });
    }
  });

  it("renders custom cells, display columns, and configured overrides", () => {
    render(
      <TableHarness
        config={tableConfig({
          columns: [
            {
              accessorKey: "name",
              header: "Name",
              cell: ({ row }) => row.original.name.toUpperCase(),
            },
            {
              id: "actions",
              header: "Actions",
              cell: () => <button type="button">Row action</button>,
            },
          ],
          components: {
            Toolbar: () => <div>Custom toolbar</div>,
            AboveTable: () => <div>Above table content</div>,
          },
        })}
      />,
    );

    expect(screen.getByText("Custom toolbar")).toBeVisible();
    expect(screen.getByText("Above table content")).toBeVisible();
    expect(screen.getByText("ALPHA")).toBeVisible();
    expect(screen.getByRole("button", { name: /row action/i })).toBeVisible();
    expect(screen.getByTestId("admin-resource-table-scroll")).toBeVisible();
  });

  it("renders configured empty-state and hydration-error overrides safely", () => {
    const { rerender } = render(
      <TableHarness
        rows={[]}
        config={tableConfig({
          components: {
            EmptyState: () => <div>Custom empty state</div>,
          },
        })}
      />,
    );

    expect(screen.getByText("Custom empty state")).toBeVisible();

    rerender(
      <TableHarness
        rows={[]}
        error
        errorSource="hydration"
        rawError={new Error("backend-secret-stack")}
      />,
    );

    expect(screen.getByText("Table data could not be prepared")).toBeVisible();
    expect(screen.getByText("Try again.")).toBeVisible();
    expect(screen.queryByText(/backend-secret-stack/i)).toBeNull();
  });
});

function TableHarness({
  config = tableConfig(),
  currentPage = 1,
  error = false,
  errorSource,
  fetching = false,
  forbidden = false,
  loading = false,
  onPageChange,
  onPageSizeChange,
  onRetry,
  page = pageMetadata(),
  rawError,
  rows = [{ id: "row_1", name: "Alpha" }],
}: {
  config?: AdminResourceTableConfig<unknown, TestRow>;
  currentPage?: number;
  error?: boolean;
  errorSource?: "list" | "hydration";
  fetching?: boolean;
  forbidden?: boolean;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRetry?: () => void;
  page?: AdminResourceTablePageMetadata;
  rawError?: unknown;
  rows?: TestRow[];
}) {
  const result = useAdminResourceTableViewResult<unknown, TestRow>({
    config,
    identity: {
      id: "admin_1",
      username: "admin",
      roles: ["ADMIN"],
      permissions: [],
      sessionScope: "admin",
    },
    locale: "en-CA",
    rows,
    currentPage,
    pageSize: 20,
    sortField: "name",
    sortOrder: "asc",
    page,
    loading,
    fetching,
    error,
    forbidden,
    onPageChange,
    onPageSizeChange,
    onRetry,
  });
  result.error = rawError ?? result.error;
  result.errorSource = errorSource ?? result.errorSource;

  return <AdminResourceTable result={result} />;
}

function tableConfig(
  overrides: Partial<AdminResourceTableConfig<unknown, TestRow>> = {},
): AdminResourceTableConfig<unknown, TestRow> {
  return {
    resource: "productCategories",
    getRowId: (row) => row.id,
    defaultSort: { field: "name", order: "asc" },
    minWidth: 720,
    columns,
    mapDtoToRow: () => ({ id: "row_1", name: "Alpha" }),
    labels: {
      title: "Test resources",
      description: "Shared table description",
      loading: "Loading admin dashboard",
      empty: "No records found.",
      errorTitle: "Something went wrong",
      errorMessage: "The admin dashboard could not complete this request.",
      forbiddenTitle: "Access denied",
      forbiddenMessage: "You do not have permission to use this admin workflow.",
      retry: "Try again",
      refetching: "Refreshing table data",
      pageMetadata: (metadata) =>
        `Page ${metadata.page} of ${metadata.totalPages} - ${metadata.total} total`,
      pageSizeLabel: "Rows per page",
      paginationLabel: "Test pages",
      hydrationErrorTitle: "Table data could not be prepared",
      hydrationErrorMessage: "Try again.",
    },
    createAction: {
      href: "/admin/products/categories/create",
      label: "Create category",
      visible: true,
    },
    ...overrides,
  };
}

function pageMetadata(): AdminResourceTablePageMetadata {
  return {
    number: 0,
    size: 20,
    totalElements: 42,
    totalPages: 3,
    numberOfElements: 20,
    first: true,
    last: false,
  };
}
