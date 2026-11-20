import { Table } from "@mantine/core";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import frCaMessages from "../../../../../../messages/fr-CA.json";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import { AdminSortableHeader } from "../AdminSortableHeader";

describe("AdminSortableHeader", () => {
  it("renders an inactive localized sort button", () => {
    render(<SortableHeaderHarness />);

    const sortButton = screen.getByRole("button", { name: /sort by name/i });

    expect(sortButton).toBeVisible();
    expect(sortButton.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(screen.queryByText("Sort")).not.toBeInTheDocument();
  });

  it("toggles sorting from the keyboard", async () => {
    const user = userEvent.setup();

    render(<SortableHeaderHarness />);

    await user.tab();
    expect(screen.getByRole("button", { name: /sort by name/i })).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("button", { name: /name sorted ascending/i }),
    ).toBeVisible();
  });

  it("announces ascending and descending states", async () => {
    const user = userEvent.setup();

    render(<SortableHeaderHarness initialSorting={[{ id: "name", desc: false }]} />);

    expect(
      screen.getByRole("button", { name: /name sorted ascending/i }),
    ).toBeVisible();
    expect(screen.queryByText("Asc")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /name sorted ascending/i }),
    );

    expect(
      screen.getByRole("button", { name: /name sorted descending/i }),
    ).toBeVisible();
    expect(screen.queryByText("Desc")).not.toBeInTheDocument();
  });

  it("uses non-default locale labels", () => {
    render(<SortableHeaderHarness />, {
      locale: "fr-CA",
      messages: frCaMessages,
    });

    expect(screen.getByRole("button", { name: /trier par name/i })).toBeVisible();
  });

  it("calls the TanStack sorting callback", async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();

    render(<SortableHeaderHarness onSortingChange={onSortingChange} />);

    await user.click(screen.getByRole("button", { name: /sort by name/i }));

    expect(onSortingChange).toHaveBeenCalled();
  });
});

interface SortableHeaderHarnessProps {
  initialSorting?: SortingState;
  onSortingChange?: () => void;
}

function SortableHeaderHarness({
  initialSorting = [],
  onSortingChange,
}: SortableHeaderHarnessProps) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const table = useReactTable({
    data: [{ id: "row_1", name: "Name" }],
    columns: [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <AdminSortableHeader column={column} label="Name" />
        ),
        enableSorting: true,
      },
    ],
    getCoreRowModel: getCoreRowModel(),
    state: { sorting },
    enableSortingRemoval: false,
    onSortingChange: (updater) => {
      onSortingChange?.();
      setSorting(updater);
    },
  });

  return (
    <Table>
      <Table.Thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <Table.Tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <Table.Th key={header.id}>
                <AdminSortableHeader column={header.column} label="Name" />
              </Table.Th>
            ))}
          </Table.Tr>
        ))}
      </Table.Thead>
    </Table>
  );
}
