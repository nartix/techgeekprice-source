import {
  useCustomMutation,
  useDataProvider,
  useDelete,
  useInvalidate,
  useNotification,
} from "@refinedev/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";

import {
  render,
  screen,
  waitFor,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import { productCategoryAliasConfig } from "./category-system.fixtures";
import {
  CategoryActions as CategoryActionsBase,
  CategoryActionsView as CategoryActionsViewBase,
} from "../components/CategoryActions";

function CategoryActions(
  props: Omit<
    ComponentProps<typeof CategoryActionsBase>,
    "apiBasePath" | "listHref" | "permissionResource" | "resource"
  > &
    Partial<
      Pick<
        ComponentProps<typeof CategoryActionsBase>,
        "apiBasePath" | "listHref" | "permissionResource" | "resource"
      >
    >,
) {
  return (
    <CategoryActionsBase
      apiBasePath={productCategoryAliasConfig.apiBasePath}
      listHref={productCategoryAliasConfig.listHref}
      permissionResource={productCategoryAliasConfig.permissionResource}
      resource={productCategoryAliasConfig.resource}
      {...props}
    />
  );
}

function CategoryActionsView(
  props: Omit<ComponentProps<typeof CategoryActionsViewBase>, "permissionResource"> &
    Partial<Pick<ComponentProps<typeof CategoryActionsViewBase>, "permissionResource">>,
) {
  return (
    <CategoryActionsViewBase
      permissionResource={productCategoryAliasConfig.permissionResource}
      {...props}
    />
  );
}

const routerPush = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useRouter: () => ({
      push: routerPush,
    }),
  };
});

vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();

  return {
    ...actual,
    useCustomMutation: vi.fn(),
    useDataProvider: vi.fn(),
    useDelete: vi.fn(),
    useInvalidate: vi.fn(),
    useNotification: vi.fn(),
  };
});

const useCustomMutationMock = vi.mocked(useCustomMutation);
const useDataProviderMock = vi.mocked(useDataProvider);
const useDeleteMock = vi.mocked(useDelete);
const useInvalidateMock = vi.mocked(useInvalidate);
const useNotificationMock = vi.mocked(useNotification);

describe("CategoryActions", () => {
  it("uses explicit category gates instead of optional-action metadata", async () => {
    const user = userEvent.setup();

    render(
      <CategoryActionsView
        category={category({ active: true })}
        identity={identity({
          permissions: ["admin:catalogue-categories:read", "admin:catalogue-categories:write"],
        })}
        locale="en-CA"
        actionGates={{
          delete: { visible: false },
          deactivate: { visible: true, disabled: true },
          edit: { visible: false },
          move: { visible: false },
          view: { visible: true },
        }}
        viewHref="/admin/products/categories/1"
      />,
    );

    await openCategoryMenu(user);
    expect(screen.getByRole("menuitem", { name: /view details/i })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: /^delete$/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /move/i })).toBeNull();
    expect(screen.getByRole("menuitem", { name: /deactivate/i })).toBeDisabled();
  });
  beforeEach(() => {
    routerPush.mockReset();
    useCustomMutationMock.mockReset();
    useDataProviderMock.mockReset();
    useDeleteMock.mockReset();
    useInvalidateMock.mockReset();
    useNotificationMock.mockReset();
  });

  it("uses configured resource, return URL, and catalogue paths for Product Category delete and state changes", async () => {
    const user = userEvent.setup();
    const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
    const customMutateAsync = vi.fn().mockResolvedValue(undefined);
    const notificationOpen = vi.fn();

    useDeleteMock.mockReturnValue({
      mutateAsync: deleteMutateAsync,
      mutation: { isPending: false },
    } as never);
    useCustomMutationMock.mockReturnValue({
      mutateAsync: customMutateAsync,
      mutation: { isPending: false },
    } as never);
    useInvalidateMock.mockReturnValue(vi.fn());
    useNotificationMock.mockReturnValue({ open: notificationOpen } as never);
    useDataProviderMock.mockReturnValue(() => ({ custom: vi.fn() }) as never);

    render(
      <CategoryActions
        apiBasePath={productCategoryAliasConfig.apiBasePath}
        category={category({ id: "1" })}
        identity={identity({
          permissions: [
            "admin:catalogue-categories:read",
            "admin:catalogue-categories:write",
          ],
        })}
        listHref={productCategoryAliasConfig.listHref}
        locale="en-CA"
        permissionResource={productCategoryAliasConfig.permissionResource}
        resource={productCategoryAliasConfig.resource}
        stateSuccessMessage={(nextActive) =>
          nextActive
            ? "The product category was activated."
            : "The product category was deactivated."
        }
      />,
    );

    await openCategoryMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /deactivate/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(customMutateAsync).toHaveBeenCalledWith({
      url: "/api/v1/admin/category-systems/catalogue/categories/1/deactivate",
      method: "post",
      values: { active: false },
    });
    expect(notificationOpen).toHaveBeenCalledWith({
      message: "The product category was deactivated.",
      type: "success",
    });

    await openCategoryMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /^delete$/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(deleteMutateAsync).toHaveBeenCalledWith({
      resource: "productCategories",
      id: "1",
      mutationMode: "pessimistic",
    });
    expect(routerPush).toHaveBeenCalledWith("/en-CA/admin/products/categories");
  });

  it("keeps connected action defaults on the Product Category resource and URLs", async () => {
    const user = userEvent.setup();
    const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
    const customMutateAsync = vi.fn().mockResolvedValue(undefined);

    useDeleteMock.mockReturnValue({
      mutateAsync: deleteMutateAsync,
      mutation: { isPending: false },
    } as never);
    useCustomMutationMock.mockReturnValue({
      mutateAsync: customMutateAsync,
      mutation: { isPending: false },
    } as never);
    useInvalidateMock.mockReturnValue(vi.fn());
    useNotificationMock.mockReturnValue({ open: vi.fn() } as never);
    useDataProviderMock.mockReturnValue(() => ({ custom: vi.fn() }) as never);

    render(
      <CategoryActions
        category={category({ id: "1" })}
        identity={identity()}
        locale="en-CA"
        stateSuccessMessage="The category was deactivated."
      />,
    );

    await openCategoryMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /deactivate/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(customMutateAsync).toHaveBeenCalledWith({
      url: "/api/v1/admin/category-systems/catalogue/categories/1/deactivate",
      method: "post",
      values: { active: false },
    });

    await openCategoryMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /^delete$/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(deleteMutateAsync).toHaveBeenCalledWith({
      resource: "productCategories",
      id: "1",
      mutationMode: "pessimistic",
    });
    expect(routerPush).toHaveBeenCalledWith("/en-CA/admin/products/categories");
  });

  it("uses configured catalogue move URL, parent-options URL, and invalidation resource", async () => {
    const user = userEvent.setup();
    const customMutateAsync = vi.fn().mockResolvedValue(undefined);
    const invalidate = vi.fn().mockResolvedValue(undefined);
    const dataProviderCustom = vi.fn(async ({ url }: { url: string }) => {
      if (
        url ===
        "/api/v1/admin/category-systems/catalogue/categories/parent-options"
      ) {
        return {
          data: {
            data: [parentOption({ id: 4, label: "Accessories" })],
            hasMore: false,
            nextCursor: null,
          },
        };
      }

      throw new Error(`Unexpected custom URL: ${url}`);
    });

    useDeleteMock.mockReturnValue({
      mutateAsync: vi.fn(),
      mutation: { isPending: false },
    } as never);
    useCustomMutationMock.mockReturnValue({
      mutateAsync: customMutateAsync,
      mutation: { isPending: false },
    } as never);
    useInvalidateMock.mockReturnValue(invalidate);
    useNotificationMock.mockReturnValue({ open: vi.fn() } as never);
    useDataProviderMock.mockReturnValue(
      () => ({ custom: dataProviderCustom }) as never,
    );

    render(
      <CategoryActions
        apiBasePath={productCategoryAliasConfig.apiBasePath}
        category={category({ id: "1", parentId: null })}
        identity={identity({
          permissions: [
            "admin:catalogue-categories:read",
            "admin:catalogue-categories:write",
          ],
        })}
        listHref={productCategoryAliasConfig.listHref}
        locale="en-CA"
        moveActionsAvailable
        permissionResource={productCategoryAliasConfig.permissionResource}
        resource={productCategoryAliasConfig.resource}
      />,
    );

    await openCategoryMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /^move$/i }));
    await user.click(await screen.findByRole("combobox", { name: /new parent/i }));
    await user.click(await screen.findByRole("option", { name: /accessories/i }));
    await user.click(screen.getByRole("button", { name: /move category/i }));

    await waitFor(() => {
      expect(customMutateAsync).toHaveBeenCalledWith({
        url: "/api/v1/admin/category-systems/catalogue/categories/1/move",
        method: "post",
        values: { newParentId: 4 },
      });
    });
    expect(dataProviderCustom).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
        query: expect.objectContaining({
          excludeSubtreeId: 1,
          limit: 25,
        }),
        url: "/api/v1/admin/category-systems/catalogue/categories/parent-options",
      }),
    );
    expect(invalidate).toHaveBeenCalledWith({
      resource: "productCategories",
      invalidates: ["list"],
    });
  });
});

describe("CategoryActionsView", () => {
  it("confirms delete and high-risk state changes", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onStateChange = vi.fn();

    const { rerender } = render(
      <CategoryActionsView
        category={category()}
        identity={identity()}
        locale="en-CA"
        onDelete={onDelete}
        onStateChange={onStateChange}
      />,
    );

    await openCategoryMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(await screen.findByRole("dialog")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onDelete).toHaveBeenCalledWith("cat_1");

    rerender(
      <CategoryActionsView
        category={category({ active: true })}
        identity={identity()}
        locale="en-CA"
        onStateChange={onStateChange}
      />,
    );

    await openCategoryMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /deactivate/i }));
    expect(await screen.findByRole("dialog")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onStateChange).toHaveBeenCalledWith("cat_1", false);
  });

  it("renders localized trigger copy and navigation links", async () => {
    const user = userEvent.setup();

    render(
      <CategoryActionsView
        category={category()}
        editHref="/admin/products/categories/cat_1/edit"
        identity={identity()}
        locale="en-CA"
        viewHref="/admin/products/categories/cat_1"
      />,
    );

    expect(
      screen.getByRole("button", { name: /more actions for laptops/i }),
    ).toBeVisible();

    await openCategoryMenu(user);

    expect(
      screen.getByRole("menuitem", { name: /view details/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories/cat_1");
    expect(screen.getByRole("menuitem", { name: /^edit$/i })).toHaveAttribute(
      "href",
      "/en-CA/admin/products/categories/cat_1/edit",
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("omits write controls without permission or backend capability", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CategoryActionsView
        category={category()}
        identity={identity({ permissions: ["admin:catalogue-categories:read"] })}
        locale="en-CA"
      />,
    );

    expect(screen.queryByRole("button", { name: /more actions/i })).toBeNull();

    rerender(
      <CategoryActionsView
        category={category()}
        identity={identity()}
        locale="en-CA"
        stateActionsAvailable={false}
      />,
    );

    await openCategoryMenu(user);
    expect(screen.queryByRole("menuitem", { name: /deactivate/i })).toBeNull();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeVisible();
  });

  it("does not expose strict Product Category actions for admin-role-only identities", () => {
    render(
      <CategoryActionsView
        category={category()}
        editHref="/admin/products/categories/cat_1/edit"
        identity={identity({ roles: ["ADMIN"], permissions: [] })}
        locale="en-CA"
        moveActionsAvailable
        permissionResource="productCategories"
        viewHref="/admin/products/categories/cat_1"
      />,
    );

    expect(screen.queryByRole("button", { name: /more actions/i })).toBeNull();
  });

  it("runs success callbacks after delete and state changes", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onDeleteSuccess = vi.fn();
    const onStateChange = vi.fn().mockResolvedValue(undefined);
    const onStateChangeSuccess = vi.fn();

    const { rerender } = render(
      <CategoryActionsView
        category={category()}
        identity={identity()}
        locale="en-CA"
        onDelete={onDelete}
        onDeleteSuccess={onDeleteSuccess}
      />,
    );

    await openCategoryMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(onDelete).toHaveBeenCalledWith("cat_1");
    expect(onDeleteSuccess).toHaveBeenCalledOnce();

    rerender(
      <CategoryActionsView
        category={category({ active: false })}
        identity={identity({ roles: ["ADMIN"] })}
        locale="en-CA"
        onStateChange={onStateChange}
        onStateChangeSuccess={onStateChangeSuccess}
      />,
    );

    await openCategoryMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /activate/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));

    expect(onStateChange).toHaveBeenCalledWith("cat_1", true);
    expect(onStateChangeSuccess).toHaveBeenCalledWith(true);
  });

  it("requests the move workflow when move is available", async () => {
    const user = userEvent.setup();
    const onMoveRequest = vi.fn();

    render(
      <CategoryActionsView
        category={category()}
        identity={identity({ roles: ["ADMIN"] })}
        locale="en-CA"
        moveActionsAvailable
        onMoveRequest={onMoveRequest}
      />,
    );

    await openCategoryMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /^move$/i }));

    expect(onMoveRequest).toHaveBeenCalledOnce();
  });

  it("gates placement-dependent move controls without hiding unrelated actions", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CategoryActionsView
        category={category()}
        identity={identity({ roles: ["ADMIN"] })}
        locale="en-CA"
        moveActionsAvailable={false}
        onMoveRequest={vi.fn()}
      />,
    );

    await openCategoryMenu(user);
    expect(screen.queryByRole("menuitem", { name: /^move$/i })).toBeNull();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeVisible();
    expect(
      screen.getByRole("menuitem", { name: /deactivate/i }),
    ).toBeVisible();
    await user.keyboard("{Escape}");

    rerender(
      <CategoryActionsView
        category={category()}
        identity={identity({ roles: ["ADMIN"] })}
        locale="en-CA"
        moveActionsAvailable
        onMoveRequest={vi.fn()}
      />,
    );

    await openCategoryMenu(user);
    expect(screen.getByRole("menuitem", { name: /^move$/i })).toBeVisible();
  });
});

async function openCategoryMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: /more actions for laptops/i }),
  );
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

function category(
  overrides: Partial<{
    id: string;
    parentId: string | null;
    name: string;
    active: boolean;
  }> = {},
) {
  return {
    id: "cat_1",
    parentId: null,
    name: "Laptops",
    active: true,
    ...overrides,
  };
}

function parentOption(
  overrides: Partial<{
    active: boolean;
    depth: number;
    disabledReason: string | null;
    id: number;
    label: string;
    name: string;
    parentId: number | null;
    path: unknown[];
    selectable: boolean;
    slug: string;
  }> = {},
) {
  return {
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
    ...overrides,
  };
}
