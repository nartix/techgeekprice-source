import { afterEach, describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import {
  clearAdminIdentity,
  setAdminIdentity,
} from "../../../../platform/admin/session/adminIdentityStore";
import { productCategoryAliasConfig } from "./category-system.fixtures";
import {
  SmallCategoryTreePage,
  SmallCategoryTreePageView,
} from "../tree/components/SmallCategoryTreePage";
import {
  createSmallCategoryTreeModel,
  getInitialExpandedIds,
} from "../tree/category-tree-model";
import {
  rankedExposedCapabilities,
  smallCategoryTree,
} from "./category-tree.fixtures";

describe("SmallCategoryTreePageView", () => {
  afterEach(() => {
    clearAdminIdentity();
  });

  it("renders Product Categories no-read identities as forbidden before the tree", () => {
    setAdminIdentity(identity({ roles: ["ADMIN"] }));

    render(
      <SmallCategoryTreePage
        config={productCategoryAliasConfig}
        locale="en-CA"
      />,
    );

    expect(screen.getByText(/access denied/i)).toBeVisible();
    expect(
      screen.getByText(/permission to use this admin workflow/i),
    ).toBeVisible();
    expect(screen.queryByRole("heading", { name: /category tree/i })).toBeNull();
  });

  it("renders loading and dedicated too-large fallback states", () => {
    const baseProps = pageProps();
    const { rerender } = render(
      <SmallCategoryTreePageView
        {...baseProps}
        treeState={{ status: "loading" }}
      />,
    );

    expect(screen.getByText(/loading category tree/i)).toBeVisible();

    rerender(
      <SmallCategoryTreePageView
        {...baseProps}
        treeState={{
          status: "too-large",
          error: { code: "too-large", message: "too-large", retryable: false },
        }}
      />,
    );

    expect(screen.getByText(/too large for the tree view/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: /open paginated list/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories");
  });

  it("renders all rows expanded by default and supports keyboard expand/collapse", async () => {
    const user = userEvent.setup();
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    expect(screen.getByRole("heading", { name: /category tree/i })).toBeVisible();
    expect(screen.getByText(/intended for small category sets/i)).toBeVisible();
    expect(screen.getByText("Computers")).toBeVisible();
    expect(screen.getByText("Laptops")).toBeVisible();
    expect(screen.getByText("Desktop towers")).toBeVisible();

    const collapseComputers = screen.getByRole("button", {
      name: /collapse computers/i,
    });

    expect(collapseComputers).toHaveAttribute("aria-expanded", "true");
    await user.tab();
    await user.click(collapseComputers);

    expect(screen.queryByText("Laptops")).toBeNull();
    expect(
      screen.getByRole("button", { name: /expand computers/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("wires refresh, expand all, and collapse all toolbar actions", async () => {
    const user = userEvent.setup();
    const handlers = {
      onCollapseAll: vi.fn(),
      onExpandAll: vi.fn(),
      onRefresh: vi.fn(),
      onToggleRow: vi.fn(),
    };
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        {...handlers}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /refresh tree/i }));
    await user.click(screen.getByRole("button", { name: /collapse all/i }));
    await user.click(screen.getByRole("button", { name: /expand all/i }));

    expect(handlers.onRefresh).toHaveBeenCalledOnce();
    expect(handlers.onCollapseAll).toHaveBeenCalledOnce();
    expect(handlers.onExpandAll).toHaveBeenCalledOnce();
  });

  it("renders the ready tree with a compact density contract for reduced scrolling", () => {
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    const table = screen.getByRole("table", { name: /category tree/i });
    const computersRow = screen.getByRole("row", { name: /computers/i });

    expect(table).toHaveAttribute("data-density", "compact");
    expect(table).toHaveAttribute("data-scroll-goal", "less-scrolling");
    expect(computersRow).toHaveAttribute("data-density", "compact");
  });
});

function pageProps() {
  return {
    canActivate: true,
    canDeactivate: true,
    canMove: false,
    capabilitiesState: {
      status: "ready" as const,
      capabilities: rankedExposedCapabilities,
    },
    deleteLoading: false,
    expandedIds: new Set<string>(),
    identity: identity({
      permissions: [
        "admin:catalogue-categories:read",
        "admin:catalogue-categories:write",
      ],
    }),
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
    permissions: [],
    sessionScope: "admin",
    ...overrides,
  };
}
