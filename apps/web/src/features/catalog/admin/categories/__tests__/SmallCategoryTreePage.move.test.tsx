import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import { canAppendParentMove } from "../tree/category-tree-capabilities";
import {
  createSmallCategoryTreeModel,
  getInitialExpandedIds,
} from "../tree/category-tree-model";
import { SmallCategoryTreePageView } from "../tree/components/SmallCategoryTreePage";
import { productCategoryAliasConfig } from "./category-system.fixtures";
import {
  appendUnavailableCapabilities,
  rankedExposedCapabilities,
  smallCategoryTree,
} from "./category-tree.fixtures";

describe("SmallCategoryTreePage move integration", () => {
  it("gates move actions by permission and append capability", async () => {
    const user = userEvent.setup();
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");
    const readyCapabilities = {
      status: "ready" as const,
      capabilities: rankedExposedCapabilities,
    };

    expect(canAppendParentMove(readyCapabilities)).toBe(true);

    const { rerender } = render(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove={false}
        capabilitiesState={readyCapabilities}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    await openRowMenu(user, "Laptops");
    expect(screen.queryByRole("menuitem", { name: /^move$/i })).toBeNull();
    await user.keyboard("{Escape}");

    rerender(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove={canAppendParentMove({
          status: "ready",
          capabilities: appendUnavailableCapabilities,
        })}
        capabilitiesState={{
          status: "ready",
          capabilities: appendUnavailableCapabilities,
        }}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    await openRowMenu(user, "Laptops");
    expect(screen.queryByRole("menuitem", { name: /^move$/i })).toBeNull();
    await user.keyboard("{Escape}");

    rerender(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove={canAppendParentMove(readyCapabilities)}
        capabilitiesState={readyCapabilities}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    await openRowMenu(user, "Laptops");
    expect(screen.getByRole("menuitem", { name: /^move$/i })).toBeVisible();
  });

  it("opens the move dialog, submits a parent ID, and closes on success", async () => {
    const user = userEvent.setup();
    const onSubmitMove = vi.fn().mockResolvedValue(undefined);
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        moveDialogApi={createParentApi()}
        treeState={{ status: "ready", model }}
        onSubmitMove={onSubmitMove}
      />,
    );

    await openRowMenu(user, "Laptops");
    await user.click(screen.getByRole("menuitem", { name: /^move$/i }));
    expect(screen.getByRole("dialog", { name: /move category/i })).toBeVisible();
    await user.click(screen.getByRole("combobox", { name: /new parent/i }));
    await user.click(await screen.findByRole("option", { name: /accessories/i }));
    await user.click(screen.getByRole("button", { name: /move category/i }));

    expect(onSubmitMove).toHaveBeenCalledWith("4");
    expect(screen.queryByRole("dialog", { name: /move category/i })).toBeNull();
  });

  it("keeps the dialog open and shows stable failure messages", async () => {
    const user = userEvent.setup();
    const onSubmitMove = vi.fn().mockRejectedValue(new Error("failed"));
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        moveDialogApi={createParentApi()}
        moveErrorCode="invalidPlacementTarget"
        treeState={{ status: "ready", model }}
        onSubmitMove={onSubmitMove}
      />,
    );

    await openRowMenu(user, "Laptops");
    await user.click(screen.getByRole("menuitem", { name: /^move$/i }));
    expect(screen.getByText(/tree changed before the move/i)).toBeVisible();
    await user.click(screen.getByRole("combobox", { name: /new parent/i }));
    await user.click(await screen.findByRole("option", { name: /accessories/i }));
    await user.click(screen.getByRole("button", { name: /move category/i }));

    expect(onSubmitMove).toHaveBeenCalledWith("4");
    expect(screen.getByRole("dialog", { name: /move category/i })).toBeVisible();
  });
});

async function openRowMenu(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(
    screen.getByRole("button", {
      name: new RegExp(`more actions for ${name}`, "i"),
    }),
  );
}

function pageProps() {
  return {
    canActivate: true,
    canDeactivate: true,
    capabilitiesState: {
      status: "ready" as const,
      capabilities: rankedExposedCapabilities,
    },
    canMove: true,
    deleteLoading: false,
    expandedIds: new Set<string>(),
    identity: identity(),
    listHref: "/admin/products/categories",
    locale: "en-CA" as const,
    permissionResource: productCategoryAliasConfig.permissionResource,
    showHref: productCategoryAliasConfig.showHref,
    editHref: productCategoryAliasConfig.editHref,
    model: null,
    moving: false,
    moveErrorCode: null,
    selectedMoveRow: null,
    stateLoading: false,
    treeState: { status: "empty" as const },
    onCloseMoveDialog: vi.fn(),
    onCollapseAll: vi.fn(),
    onDeleteRow: vi.fn(),
    onExpandAll: vi.fn(),
    onMoveRow: vi.fn(),
    onRefresh: vi.fn(),
    onStateChangeRow: vi.fn(),
    onSubmitMove: vi.fn(),
    onToggleRow: vi.fn(),
  };
}

function identity(overrides: Partial<AdminIdentity> = {}): AdminIdentity {
  return {
    id: "admin_1",
    username: "admin",
    roles: [],
    permissions: [
      "admin:catalogue-categories:read",
      "admin:catalogue-categories:write",
    ],
    sessionScope: "admin",
    ...overrides,
  };
}

function createParentApi(): AdminFormOptionLoaderApi {
  return {
    custom: vi.fn(async () => ({
      data: [
        {
          active: true,
          depth: 0,
          disabledReason: null,
          id: 4,
          label: "Accessories",
          name: "Accessories",
          parentId: null,
          path: [],
          selectable: true,
          slug: "accessories",
        },
      ],
      hasMore: false,
      nextCursor: null,
    })) as unknown as AdminFormOptionLoaderApi["custom"],
    loadOptions: vi.fn(),
  };
}
