import {
  useCustomMutation,
  useDataProvider,
  useDelete,
  useNotification,
} from "@refinedev/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
  waitFor,
} from "../../../../../../tests/test-utils/render";
import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import {
  clearAdminIdentity,
  setAdminIdentity,
} from "../../../../platform/admin/session/adminIdentityStore";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import { productCategoryAliasConfig } from "./category-system.fixtures";
import {
  createSmallCategoryTreeModel,
  getInitialExpandedIds,
  type SmallCategoryTreeRow,
} from "../tree/category-tree-model";
import {
  SmallCategoryTreePage,
  SmallCategoryTreePageView,
} from "../tree/components/SmallCategoryTreePage";
import { useAdminCategorySystemCapabilities } from "../hooks/useAdminCategorySystemCapabilities";
import {
  categoryTreePage,
  rankedExposedCapabilities,
  smallCategoryTree,
} from "./category-tree.fixtures";

vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();

  return {
    ...actual,
    useCustomMutation: vi.fn(),
    useDataProvider: vi.fn(),
    useDelete: vi.fn(),
    useNotification: vi.fn(),
  };
});

vi.mock("../hooks/useAdminCategorySystemCapabilities", () => ({
  useAdminCategorySystemCapabilities: vi.fn(),
}));

const useCustomMutationMock = vi.mocked(useCustomMutation);
const useDataProviderMock = vi.mocked(useDataProvider);
const useDeleteMock = vi.mocked(useDelete);
const useNotificationMock = vi.mocked(useNotification);
const capabilityHookMock = vi.mocked(useAdminCategorySystemCapabilities);

describe("SmallCategoryTreePage row actions", () => {
  beforeEach(() => {
    clearAdminIdentity();
    useCustomMutationMock.mockReset();
    useDataProviderMock.mockReset();
    useDeleteMock.mockReset();
    useNotificationMock.mockReset();
    capabilityHookMock.mockReset();
    capabilityHookMock.mockReturnValue({
      status: "ready",
      identity: {
        apiBasePath: "/api/v1/admin/category-systems/catalogue/categories",
        systemKey: "catalogue",
      },
      capabilities: rankedExposedCapabilities,
    } as never);
  });

  it("shows the shared dropdown actions for permitted tree rows and keeps move in the tree dialog", async () => {
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

    expect(
      screen.getByRole("menuitem", { name: /view details/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories/2");
    expect(screen.getByRole("menuitem", { name: /^edit$/i })).toHaveAttribute(
      "href",
      "/en-CA/admin/products/categories/2/edit",
    );
    expect(screen.getByRole("menuitem", { name: /^move$/i })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: /deactivate/i })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeVisible();

    await user.click(screen.getByRole("menuitem", { name: /^move$/i }));
    expect(
      screen.getByRole("dialog", { name: /move category/i }),
    ).toBeVisible();

    await user.click(screen.getByRole("combobox", { name: /new parent/i }));
    await user.click(
      await screen.findByRole("option", { name: /accessories/i }),
    );
    await user.click(screen.getByRole("button", { name: /move category/i }));

    expect(onSubmitMove).toHaveBeenCalledWith("4");
  });

  it("runs state and delete row callbacks before refreshing the tree", async () => {
    const user = userEvent.setup();
    const onDeleteRow = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();
    const onStateChangeRow = vi.fn().mockResolvedValue(undefined);
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        onDeleteRow={onDeleteRow}
        onRefresh={onRefresh}
        onStateChangeRow={onStateChangeRow}
        treeState={{ status: "ready", model }}
      />,
    );

    await openRowMenu(user, "Laptops");
    await user.click(screen.getByRole("menuitem", { name: /deactivate/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(onStateChangeRow).toHaveBeenCalledWith(
      expect.objectContaining({ id: "2", name: "Laptops" }),
      false,
    );
    expect(onRefresh).toHaveBeenCalledOnce();

    await openRowMenu(user, "Laptops");
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(onDeleteRow).toHaveBeenCalledWith(
      expect.objectContaining({ id: "2", name: "Laptops" }),
    );
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it("hides move independently from unrelated row actions", async () => {
    const user = userEvent.setup();
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps()}
        canMove={false}
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    await openRowMenu(user, "Laptops");

    expect(screen.queryByRole("menuitem", { name: /^move$/i })).toBeNull();
    expect(
      screen.getByRole("menuitem", { name: /view details/i }),
    ).toBeVisible();
    expect(screen.getByRole("menuitem", { name: /^edit$/i })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: /deactivate/i })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeVisible();
  });

  it("hides write row actions for read-only admins", async () => {
    const user = userEvent.setup();
    const model = createSmallCategoryTreeModel(smallCategoryTree, "en-CA");

    render(
      <SmallCategoryTreePageView
        {...pageProps({
          identity: identity({
            permissions: ["admin:catalogue-categories:read"],
          }),
        })}
        canMove
        expandedIds={getInitialExpandedIds(model)}
        model={model}
        treeState={{ status: "ready", model }}
      />,
    );

    await openRowMenu(user, "Laptops");

    expect(
      screen.getByRole("menuitem", { name: /view details/i }),
    ).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: /^edit$/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /^move$/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /deactivate/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /delete/i })).toBeNull();
  });

  it("uses connected Refine mutations for tree state and delete actions before refreshing", async () => {
    const user = userEvent.setup();
    const custom = createTreeDataProviderCustom();
    const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
    const stateMutateAsync = vi.fn().mockResolvedValue(undefined);
    const notificationOpen = vi.fn();

    setAdminIdentity(identity());
    useDataProviderMock.mockReturnValue(() => ({ custom }) as never);
    useDeleteMock.mockReturnValue({
      mutateAsync: deleteMutateAsync,
      mutation: { isPending: false },
    } as never);
    useCustomMutationMock.mockReturnValue({
      mutateAsync: stateMutateAsync,
      mutation: { isPending: false },
    } as never);
    useNotificationMock.mockReturnValue({
      open: notificationOpen,
    } as never);

    render(
      <SmallCategoryTreePage
        config={productCategoryAliasConfig}
        locale="en-CA"
      />,
    );

    await screen.findByRole("button", { name: /more actions for laptops/i });
    expect(treeReadCalls(custom)).toHaveLength(1);

    await openRowMenu(user, "Laptops");
    await user.click(screen.getByRole("menuitem", { name: /deactivate/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(stateMutateAsync).toHaveBeenCalledWith({
      url: "/api/v1/admin/category-systems/catalogue/categories/2/deactivate",
      method: "post",
      values: { active: false },
    });
    expect(notificationOpen).toHaveBeenCalledWith({
      message: "The category was deactivated.",
      type: "success",
    });
    await waitFor(() => expect(treeReadCalls(custom)).toHaveLength(2));

    await openRowMenu(user, "Desktop towers");
    await user.click(screen.getByRole("menuitem", { name: /activate/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(stateMutateAsync).toHaveBeenLastCalledWith({
      url: "/api/v1/admin/category-systems/catalogue/categories/3/activate",
      method: "post",
      values: { active: true },
    });
    expect(notificationOpen).toHaveBeenCalledWith({
      message: "The category was activated.",
      type: "success",
    });
    await waitFor(() => expect(treeReadCalls(custom)).toHaveLength(3));

    await openRowMenu(user, "Laptops");
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(deleteMutateAsync).toHaveBeenCalledWith({
      resource: "productCategories",
      id: "2",
      mutationMode: "pessimistic",
    });
    expect(notificationOpen).toHaveBeenCalledWith({
      message: "The category was deleted.",
      type: "success",
    });
    await waitFor(() => expect(treeReadCalls(custom)).toHaveLength(4));
  });

  it("renders Product Categories tree as forbidden for admin-role-only identities", () => {
    const custom = createTreeDataProviderCustom();

    setAdminIdentity(identity({ roles: ["ADMIN"], permissions: [] }));
    useDataProviderMock.mockReturnValue(() => ({ custom }) as never);
    useDeleteMock.mockReturnValue({
      mutateAsync: vi.fn(),
      mutation: { isPending: false },
    } as never);
    useCustomMutationMock.mockReturnValue({
      mutateAsync: vi.fn(),
      mutation: { isPending: false },
    } as never);
    useNotificationMock.mockReturnValue({ open: vi.fn() } as never);

    render(
      <SmallCategoryTreePage
        config={productCategoryAliasConfig}
        locale="en-CA"
      />,
    );

    expect(screen.getByText(/access denied/i)).toBeVisible();
    expect(custom).not.toHaveBeenCalled();
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

function pageProps(
  overrides: Partial<{
    identity: AdminIdentity | null;
    onDeleteRow: (row: SmallCategoryTreeRow) => Promise<void> | void;
    onStateChangeRow: (
      row: SmallCategoryTreeRow,
      nextActive: boolean,
    ) => Promise<void> | void;
  }> = {},
) {
  return {
    canActivate: true,
    canDeactivate: true,
    canMove: true,
    capabilitiesState: {
      status: "ready" as const,
      capabilities: rankedExposedCapabilities,
    },
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
    ...overrides,
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

function createTreeDataProviderCustom() {
  return vi.fn(async ({ url }: { url: string }) => {
    if (
      url === "/api/v1/admin/category-systems/catalogue/categories/capabilities"
    ) {
      return { data: rankedExposedCapabilities };
    }

    if (url === "/api/v1/admin/category-systems/catalogue/categories/tree") {
      return { data: categoryTreePage(smallCategoryTree) };
    }

    throw new Error(`Unexpected data provider URL: ${url}`);
  });
}

function treeReadCalls(
  custom: ReturnType<typeof createTreeDataProviderCustom>,
) {
  return custom.mock.calls.filter(
    ([params]) =>
      params.url === "/api/v1/admin/category-systems/catalogue/categories/tree",
  );
}
