import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { AdminCategoryParentOptionDto } from "@tgp/contracts";

import {
  render,
  screen,
  userEvent,
  waitFor,
} from "../../../../../../tests/test-utils/render";
import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import { CategoryMoveDialogView } from "../components/CategoryMoveDialog";

describe("CategoryMoveDialogView", () => {
  it("gives every move-dialog button an accessible name", () => {
    render(<ControlledMoveDialog onMove={vi.fn()} />);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAccessibleName();
    }
  });

  it("submits the selected parent category", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();

    render(<ControlledMoveDialog onMove={onMove} />);

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));
    await user.click(
      await screen.findByRole("option", { name: /accessories/i }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /move category/i }),
      ).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: /move category/i }));

    expect(onMove).toHaveBeenCalledWith("2");
  });

  it("submits root as null", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();

    render(
      <ControlledMoveDialog
        initialParentId="2"
        currentParentId="2"
        onMove={onMove}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));
    await user.click(await screen.findByRole("option", { name: /root/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /move category/i }),
      ).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: /move category/i }));

    expect(onMove).toHaveBeenCalledWith(null);
  });

  it("prevents submitting when the parent is unchanged", () => {
    render(
      <CategoryMoveDialogView
        api={createParentApi()}
        category={{ id: "1", name: "Laptops", parentId: "2" }}
        currentParentId="2"
        labels={labels()}
        opened
        parentId="2"
        onClose={vi.fn()}
        onMove={vi.fn()}
        onParentIdChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /move category/i }),
    ).toBeDisabled();
  });

  it("requests current parent hydration and current category subtree exclusion", async () => {
    const user = userEvent.setup();
    const api = createParentApi();

    render(
      <CategoryMoveDialogView
        api={api}
        category={{ id: "1", name: "Laptops", parentId: "2" }}
        currentParentId="2"
        labels={labels()}
        opened
        parentId="2"
        onClose={vi.fn()}
        onMove={vi.fn()}
        onParentIdChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));

    await waitFor(() =>
      expect(api.custom).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            excludeSubtreeId: 1,
            includeIds: [2],
            includeInactive: true,
            limit: 25,
          },
        }),
      ),
    );
  });

  it("prevents submitting inactive targets", async () => {
    const user = userEvent.setup();

    render(
      <ControlledMoveDialog
        api={createParentApi([
          parentOption({
            active: false,
            disabledReason: "INACTIVE",
            label: "Archived Accessories",
            selectable: false,
            slug: "archived-accessories",
          }),
        ])}
        onMove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));

    expect(
      await screen.findByRole("option", { name: /archived accessories/i }),
    ).toBeVisible();
    expect(screen.getByText("Inactive")).toBeVisible();
    expect(
      screen.getByRole("button", { name: /move category/i }),
    ).toBeDisabled();
  });

  it("prevents submitting when the excluded category is stale", async () => {
    const user = userEvent.setup();

    render(
      <ControlledMoveDialog
        api={{
          custom: vi.fn(async () => Promise.reject({ status: 404 })),
          loadOptions: vi.fn(),
        }}
        onMove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));

    expect(
      (await screen.findAllByText(/category changed or no longer exists/i))[0],
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: /move category/i }),
    ).toBeDisabled();
  });

  it("keeps a retained selection display-only when current move authority is revoked", async () => {
    render(
      <CategoryMoveDialogView
        api={createParentApi()}
        category={{ id: "1", name: "Laptops", parentId: null }}
        currentParentId=""
        enabled={false}
        labels={labels()}
        opened
        parentId="2"
        onClose={vi.fn()}
        onMove={vi.fn()}
        onParentIdChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /move category/i }),
    ).toBeDisabled();
  });
});

function labels() {
  return {
    cancel: "Cancel",
    description: "Choose a new parent for Laptops.",
    move: "Move category",
    parentDescription: "Clear the field to move this category to root.",
    parentLabel: "New parent",
    title: "Move category",
  };
}

function ControlledMoveDialog({
  api = createParentApi(),
  currentParentId = "",
  initialParentId = "",
  onMove,
}: {
  api?: AdminFormOptionLoaderApi;
  currentParentId?: string;
  initialParentId?: string;
  onMove: (newParentId: string | null) => void;
}) {
  const [parentId, setParentId] = useState(initialParentId);

  return (
    <CategoryMoveDialogView
      api={api}
      category={{ id: "1", name: "Laptops", parentId: currentParentId || null }}
      currentParentId={currentParentId}
      labels={labels()}
      opened
      parentId={parentId}
      onClose={vi.fn()}
      onMove={onMove}
      onParentIdChange={setParentId}
    />
  );
}

function createParentApi(
  options: AdminCategoryParentOptionDto[] = [
    parentOption({ id: 2, label: "Accessories", slug: "accessories" }),
  ],
): AdminFormOptionLoaderApi {
  return {
    custom: vi.fn(async () => ({
      data: options,
      hasMore: false,
      nextCursor: null,
    })) as unknown as AdminFormOptionLoaderApi["custom"],
    loadOptions: vi.fn(),
  };
}

function parentOption(
  overrides: Partial<AdminCategoryParentOptionDto> = {},
): AdminCategoryParentOptionDto {
  const id = overrides.id ?? 2;
  const slug = overrides.slug ?? "accessories";

  return {
    active: true,
    depth: 0,
    disabledReason: null,
    id,
    label: overrides.label ?? "Accessories",
    name: overrides.name ?? "Accessories",
    parentId: null,
    path: [],
    selectable: true,
    slug,
    ...overrides,
  };
}
