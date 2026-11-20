import type { AdminCategoryParentOptionDto } from "@tgp/contracts";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
  waitFor,
} from "../../../../../../tests/test-utils/render";
import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import { createSmallCategoryTreeModel } from "../tree/category-tree-model";
import { SmallCategoryTreeMoveDialogView } from "../tree/components/SmallCategoryTreeMoveDialog";
import { smallCategoryTree } from "./category-tree.fixtures";

describe("SmallCategoryTreeMoveDialogView", () => {
  it("submits root and valid append move targets", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");
    const row = model.rowsById.get("2");

    render(
      <SmallCategoryTreeMoveDialogView
        api={createParentApi([
          parentOption({ id: 1, label: "Computers" }),
          parentOption({ id: 4, label: "Accessories" }),
        ])}
        category={row ?? null}
        labels={labels()}
        model={model}
        opened
        onClose={vi.fn()}
        onMove={onMove}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));
    await user.click(await screen.findByRole("option", { name: /accessories/i }));
    await user.click(screen.getByRole("button", { name: /move category/i }));

    expect(onMove).toHaveBeenCalledWith("4");

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));
    await user.click(await screen.findByRole("option", { name: /root/i }));
    await user.click(screen.getByRole("button", { name: /move category/i }));

    expect(onMove).toHaveBeenLastCalledWith(null);
  });

  it("hydrates the current parent and excludes the moved subtree", async () => {
    const user = userEvent.setup();
    const api = createParentApi();
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");
    const row = model.rowsById.get("2");

    render(
      <SmallCategoryTreeMoveDialogView
        api={api}
        category={row ?? null}
        labels={labels()}
        model={model}
        opened
        onClose={vi.fn()}
        onMove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));

    await waitFor(() =>
      expect(api.custom).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            excludeSubtreeId: 2,
            includeIds: [1],
            includeInactive: true,
          }),
        }),
      ),
    );
  });

  it("blocks unchanged targets without showing a warning like the category listing", () => {
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");
    const laptops = model.rowsById.get("2");

    render(
      <SmallCategoryTreeMoveDialogView
        api={createParentApi()}
        category={laptops ?? null}
        labels={labels()}
        model={model}
        opened
        onClose={vi.fn()}
        onMove={vi.fn()}
      />,
    );

    expect(screen.queryByText(/choose a different parent/i)).toBeNull();
    expect(screen.getByRole("button", { name: /move category/i })).toBeDisabled();
  });

  it("blocks inactive, missing, self, and descendant targets with warnings", async () => {
    const user = userEvent.setup();
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");
    const computers = model.rowsById.get("1");
    const laptops = model.rowsById.get("2");
    const { rerender } = render(
      <SmallCategoryTreeMoveDialogView
        api={createParentApi([
          parentOption({
            active: false,
            disabledReason: "INACTIVE",
            id: 4,
            label: "Archived Accessories",
            selectable: false,
          }),
        ])}
        category={laptops ?? null}
        labels={labels()}
        model={model}
        opened
        onClose={vi.fn()}
        onMove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));
    expect(
      await screen.findByRole("option", { name: /archived accessories/i }),
    ).toBeVisible();
    expect(screen.getByText("Inactive")).toBeVisible();
    expect(screen.getByRole("button", { name: /move category/i })).toBeDisabled();

    rerender(
      <SmallCategoryTreeMoveDialogView
        api={createParentApi([])}
        category={laptops ?? null}
        labels={labels()}
        model={model}
        opened
        onClose={vi.fn()}
        onMove={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox", { name: /new parent/i })).toBeDisabled();

    rerender(
      <SmallCategoryTreeMoveDialogView
        api={createParentApi([
          parentOption({ id: 1, label: "Computers" }),
          parentOption({ id: 2, label: "Laptops", parentId: 1 }),
        ])}
        category={computers ?? null}
        labels={labels()}
        model={model}
        opened
        onClose={vi.fn()}
        onMove={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: /new parent/i }));
    await user.click(await screen.findByRole("option", { name: /computers/i }));
    expect(screen.getByText(/cannot be moved under itself/i)).toBeVisible();

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));
    await user.click(await screen.findByRole("option", { name: /laptops/i }));
    expect(
      screen.getByText(/cannot be moved under one of its descendants/i),
    ).toBeVisible();
  });
});

function labels() {
  return {
    cancel: "Cancel",
    description: "Choose a new parent for {name}.",
    errorMessages: {
      categoryNotFound: "This category changed or no longer exists.",
      descendant: "A category cannot be moved under one of its descendants.",
      forbidden: "You do not have permission to move categories.",
      genericError: "The category could not be moved. Try again.",
      inactive: "Inactive categories cannot be selected as move targets.",
      invalidPlacementTarget: "The tree changed before the move was applied.",
      missing: "The selected parent category is no longer available.",
      rankRebalanceRejected: "The category order could not be updated.",
      self: "A category cannot be moved under itself.",
      stale: "The category tree changed.",
      unchanged: "Choose a different parent before moving this category.",
      unauthorized: "Your admin session could not be verified.",
      unsupportedPlacement: "This placement action is not supported right now.",
      validationFailed: "Choose a valid parent category and try again.",
    },
    parentDescription: "Clear the field to move this category to root.",
    parentLabel: "New parent",
    submit: "Move category",
    title: "Move category",
  };
}

function createParentApi(
  options: AdminCategoryParentOptionDto[] = [
    parentOption({ id: 1, label: "Computers" }),
    parentOption({ id: 2, label: "Laptops", parentId: 1 }),
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
  overrides: Partial<AdminCategoryParentOptionDto> & { id: number; label: string },
): AdminCategoryParentOptionDto {
  return {
    active: overrides.active ?? true,
    depth: 0,
    disabledReason: overrides.disabledReason ?? null,
    id: overrides.id,
    label: overrides.label,
    name: overrides.name ?? overrides.label,
    parentId: overrides.parentId ?? null,
    path: [],
    selectable: overrides.selectable ?? true,
    slug: overrides.slug ?? overrides.label.toLowerCase().replace(/\s+/g, "-"),
  };
}
