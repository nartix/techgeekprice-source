import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import {
  createSmallCategoryTreeModel,
  getInitialExpandedIds,
} from "../tree/category-tree-model";
import { SmallCategoryTreePageView } from "../tree/components/SmallCategoryTreePage";
import { productCategoryAliasConfig } from "./category-system.fixtures";
import {
  appendUnavailableCapabilities,
  rankedExposedCapabilities,
  rankedHiddenCapabilities,
  rankedHiddenSmallCategoryTree,
  smallCategoryTree,
  unrankedCapabilities,
  unrankedSmallCategoryTree,
} from "./category-tree.fixtures";

describe("SmallCategoryTreePage capability explanations", () => {
  it("renders ranked-exposed order as read-only rank metadata", async () => {
    const user = userEvent.setup();
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    expect(screen.getByText(/showing the backend ranked order/i)).toBeVisible();
    expect(screen.getByRole("columnheader", { name: /rank/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /drag/i })).toBeNull();
    expect(screen.queryByText(/target index/i)).toBeNull();
    expect(screen.queryByText(/before id/i)).toBeNull();
    expect(screen.queryByText(/after id/i)).toBeNull();

    await openRowMenu(user, "Laptops");
    expect(screen.getByRole("menuitem", { name: /^move$/i })).toBeVisible();
  });

  it("hides rank metadata for ranked-hidden and unranked states", () => {
    const rankedHiddenModel = createSmallCategoryTreeModel(
      rankedHiddenSmallCategoryTree,
      "en-CA",
    );
    const { rerender } = render(
      <SmallCategoryTreePageView
        {...pageProps()}
        capabilitiesState={{
          status: "ready",
          capabilities: rankedHiddenCapabilities,
        }}
        expandedIds={getInitialExpandedIds(rankedHiddenModel)}
        model={rankedHiddenModel}
        treeState={{ status: "ready", model: rankedHiddenModel }}
      />,
    );

    expect(screen.getByText(/rank metadata is hidden/i)).toBeVisible();
    expect(screen.queryByRole("columnheader", { name: /rank/i })).toBeNull();

    const unrankedModel = createSmallCategoryTreeModel(
      unrankedSmallCategoryTree,
      "en-CA",
    );

    rerender(
      <SmallCategoryTreePageView
        {...pageProps()}
        capabilitiesState={{
          status: "ready",
          capabilities: unrankedCapabilities,
        }}
        expandedIds={getInitialExpandedIds(unrankedModel)}
        model={unrankedModel}
        treeState={{ status: "ready", model: unrankedModel }}
      />,
    );

    expect(screen.getByText(/ranking is disabled/i)).toBeVisible();
    expect(screen.queryByRole("columnheader", { name: /rank/i })).toBeNull();
  });

  it("renders loading/error capability explanations as read-only and hides mutation actions", () => {
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");
    const { rerender } = render(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove={false}
        capabilitiesState={{ status: "loading" }}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    expect(
      screen.getByText(/checking category ordering capabilities/i),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /more actions for laptops/i }),
    ).toBeNull();
    expect(screen.queryByRole("columnheader", { name: /rank/i })).toBeNull();

    rerender(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove={false}
        capabilitiesState={{ status: "error", error: new Error("failed") }}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    expect(
      screen.getByText(/ordering capabilities could not be loaded/i),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /more actions for laptops/i }),
    ).toBeNull();
  });

  it("does not expose a stale move action when tree authority is no longer ready", () => {
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove
        capabilitiesState={{ status: "loading" }}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /more actions for laptops/i }),
    ).toBeNull();
  });

  it("hides every row action when the canonical tree availability gate is revoked", () => {
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeActionsEnabled={false}
        treeState={{ status: "ready", model }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /more actions for laptops/i }),
    ).toBeNull();
  });

  it("does not expose append move when only target-index placement is available", async () => {
    const user = userEvent.setup();
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove={false}
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
    expect(screen.queryByText(/target index/i)).toBeNull();
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
    canMove: false,
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
