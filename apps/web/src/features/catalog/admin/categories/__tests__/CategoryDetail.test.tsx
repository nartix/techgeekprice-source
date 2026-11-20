import type { BaseRecord } from "@refinedev/core";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import { getAdminResourceMetadata } from "../../../../platform/admin/resources/adminResources";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import type { AdminResourceDetailResult } from "../../../../platform/admin/detail";
import { productCategoryAliasConfig } from "./category-system.fixtures";
import { CategoryDetailView } from "../components/CategoryDetail";
import { createCategoryDetailConfig } from "../category-admin.detail-config";
import type {
  AdminCategoryDetailRecord,
  CategoryAdminDetailViewModel,
} from "../types/category-admin-detail.types";

describe("CategoryDetailView", () => {
  it("renders loading, forbidden, safe fields, root fallback, and status text", () => {
    const { rerender } = render(
      <CategoryDetailView result={detailResult({ state: "loading" })} />,
    );

    expect(screen.getByText(/loading category/i)).toBeVisible();

    rerender(
      <CategoryDetailView result={detailResult({ state: "forbidden" })} />,
    );
    expect(screen.getByText(/access denied/i)).toBeVisible();

    rerender(
      <CategoryDetailView
        result={detailResult({
          record: {
            ...categoryRecord(),
            parentId: null,
          },
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: /^laptops$/i })).toBeVisible();
    expect(screen.getAllByText("laptops")).toHaveLength(2);
    expect(screen.getByText(/root category/i)).toBeVisible();
    expect(screen.getByText(/^active$/i)).toBeVisible();
  });

  it("hides write and unsupported optional actions without placeholders", () => {
    const { rerender } = render(
      <CategoryDetailView
        result={detailResult({
          identity: identity({
            permissions: ["admin:catalogue-categories:read"],
          }),
        })}
      />,
    );

    expect(screen.queryByRole("button", { name: /^delete$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /deactivate/i })).toBeNull();

    rerender(
      <CategoryDetailView
        result={detailResult({
          metadata: {
            ...getAdminResourceMetadata("productCategories"),
            capabilities: { filters: [], search: [], optionalActions: [] },
          },
        })}
      />,
    );

    expect(screen.queryByRole("button", { name: /deactivate/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /move/i })).toBeNull();
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeVisible();
  });

  it("confirms state change, notifies success, and refetches the detail", async () => {
    const user = userEvent.setup();
    const changeCategoryState = vi.fn().mockResolvedValue(undefined);
    const refetch = vi.fn();
    const notify = vi.fn();

    render(
      <CategoryDetailView
        notify={notify}
        result={detailResult({ changeCategoryState, onRetry: refetch })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /deactivate/i }));
    expect(await screen.findByRole("dialog")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(changeCategoryState).toHaveBeenCalledWith("1", false);
    expect(notify).toHaveBeenCalledWith({
      message: "The category was deactivated.",
      type: "success",
    });
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("opens the category move workflow from detail actions", async () => {
    const user = userEvent.setup();
    const openMoveDialog = vi.fn();

    render(
      <CategoryDetailView
        result={detailResult({
          openMoveDialog,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^move$/i }));

    expect(openMoveDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        name: "Laptops",
        parentId: null,
      }),
    );
  });

  it("confirms delete, notifies success, and redirects to categories", async () => {
    const user = userEvent.setup();
    const deleteCategory = vi.fn().mockResolvedValue(undefined);
    const notify = vi.fn();
    const redirect = vi.fn();

    render(
      <CategoryDetailView
        notify={notify}
        redirect={redirect}
        result={detailResult({ deleteCategory })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(await screen.findByRole("dialog")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(deleteCategory).toHaveBeenCalledWith("1");
    expect(notify).toHaveBeenCalledWith({
      message: "The category was deleted.",
      type: "success",
    });
    expect(redirect).toHaveBeenCalledWith("/admin/products/categories");
  });

  it("derives Product Category detail resource and action links from config", async () => {
    const user = userEvent.setup();
    const deleteCategory = vi.fn().mockResolvedValue(undefined);
    const notify = vi.fn();
    const redirect = vi.fn();

    render(
      <CategoryDetailView
        notify={notify}
        redirect={redirect}
        result={detailResult({
          categoryConfig: productCategoryAliasConfig,
          deleteCategory,
          identity: identity({
            permissions: [
              "admin:catalogue-categories:read",
              "admin:catalogue-categories:write",
            ],
          }),
          metadata: getAdminResourceMetadata("productCategories"),
          resource: "productCategories",
        })}
      />,
    );

    expect(
      screen.getByRole("link", { name: /back to categories/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories");
    expect(screen.getByRole("link", { name: /^edit$/i })).toHaveAttribute(
      "href",
      "/en-CA/admin/products/categories/1/edit",
    );

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(await screen.findByRole("button", { name: /^confirm$/i }));

    expect(deleteCategory).toHaveBeenCalledWith("1");
    expect(redirect).toHaveBeenCalledWith("/admin/products/categories");
  });

  it("hides Product Category detail actions for admin-role-only identities", () => {
    render(
      <CategoryDetailView
        result={detailResult({
          categoryConfig: productCategoryAliasConfig,
          identity: identity({ roles: ["ADMIN"] }),
          metadata: getAdminResourceMetadata("productCategories"),
          resource: "productCategories",
        })}
      />,
    );

    expect(screen.queryByRole("link", { name: /^edit$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^delete$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^move$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /deactivate/i })).toBeNull();
  });

  it("renders generic detail records without list-only hierarchy fields", () => {
    render(
      <CategoryDetailView
        result={detailResult({
          rawRecord: {
            active: true,
            createdAt: "2026-05-29T12:00:00.000Z",
            id: 1,
            name: "Laptops",
            parentId: null,
            slug: "laptops",
            updatedAt: "2026-05-30T12:00:00.000Z",
          },
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: /^laptops$/i })).toBeVisible();
    expect(screen.getByText(/root category/i)).toBeVisible();
  });
});

function detailResult(
  options: Partial<
    AdminResourceDetailResult<
      AdminCategoryDetailRecord & BaseRecord,
      CategoryAdminDetailViewModel
    >
  > & {
    categoryConfig?: typeof productCategoryAliasConfig;
    changeCategoryState?: (id: string, nextActive: boolean) => Promise<void>;
    deleteCategory?: (id: string) => Promise<void>;
    openMoveDialog?: (record: CategoryAdminDetailViewModel) => void;
  } = {},
): AdminResourceDetailResult<
  AdminCategoryDetailRecord & BaseRecord,
  CategoryAdminDetailViewModel
> {
  const config = createCategoryDetailConfig({
    changeCategoryState: options.changeCategoryState ?? vi.fn(),
    deleteCategory: options.deleteCategory ?? vi.fn(),
    config: options.categoryConfig ?? productCategoryAliasConfig,
    isActionSupported: (operation) => {
      if (operation === "delete") {
        return true;
      }

      if (!options.metadata) {
        return true;
      }

      const optionalActions = options.metadata.capabilities.optionalActions;

      return operation === "move"
        ? optionalActions.includes("move")
        : optionalActions.includes(operation);
    },
    locale: "en-CA",
    openMoveDialog: options.openMoveDialog,
    t: translator(),
    tActions: translator(),
    tDetail: translator(),
    tStates: translator(),
  });
  const state = options.state ?? "ready";

  return {
    config,
    error: null,
    id: "1",
    identity: identity({
      permissions: [
        "admin:catalogue-categories:read",
        "admin:catalogue-categories:write",
      ],
    }),
    isFetching: false,
    isForbidden: state === "forbidden",
    isInvalidRouteId: state === "invalid",
    isLoading: state === "loading",
    labels: config.labels,
    locale: "en-CA",
    metadata: getAdminResourceMetadata("productCategories"),
    onRetry: vi.fn(),
    queryEnabled: true,
    record: categoryRecord(),
    resource: "productCategories",
    rawRecord: rawCategory(),
    state,
    ...options,
  };
}

function rawCategory(): AdminCategoryDetailRecord & BaseRecord {
  return {
    active: true,
    createdAt: "2026-05-29T12:00:00.000Z",
    depth: 0,
    hasChildren: false,
    id: 1,
    name: "Laptops",
    parentId: null,
    slug: "laptops",
    updatedAt: "2026-05-30T12:00:00.000Z",
  };
}

function categoryRecord(
  overrides: Partial<CategoryAdminDetailViewModel> = {},
): CategoryAdminDetailViewModel {
  return {
    active: true,
    createdAtLabel: "May 29, 2026, 12:00 p.m.",
    id: "1",
    name: "Laptops",
    parentId: null,
    slug: "laptops",
    updatedAtLabel: "May 30, 2026, 12:00 p.m.",
    ...overrides,
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

function translator() {
  const messages: Record<string, string> = {
    "actions.activate": "Activate",
    "actions.activateSuccess": "The category was activated.",
    "actions.deactivate": "Deactivate",
    "actions.deactivateSuccess": "The category was deactivated.",
    "actions.deleteMessage": "Delete {name}? This action cannot be undone.",
    "actions.deleteSuccess": "The category was deleted.",
    "actions.deleteTitle": "Delete category",
    "actions.move": "Move",
    "actions.moveSuccess": "The category was moved.",
    "actions.stateMessage": "Change the active state for {name}?",
    "actions.stateTitle": "Confirm category state change",
    "fields.createdAt": "Created",
    "fields.parentId": "Parent ID",
    "fields.slug": "Slug",
    "fields.status": "Status",
    "fields.updatedAt": "Updated",
    "form.loading": "Loading category",
    "list.rootCategory": "Root category",
    "sections.category": "Category details",
    "show.backToList": "Back to categories",
    "status.active": "Active",
    "status.inactive": "Inactive",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    emptyMessage: "No configured detail content is visible for this record.",
    emptyTitle: "No visible detail content",
    errorMessage: "The admin dashboard could not complete this request.",
    errorTitle: "Something went wrong",
    forbiddenMessage: "You do not have permission to use this admin workflow.",
    forbiddenTitle: "Access denied",
    invalidMessage: "This admin record link is invalid.",
    invalidTitle: "Record unavailable",
    notFoundMessage: "This admin record could not be found.",
    notFoundTitle: "Record not found",
    retry: "Try again",
  };

  return ((key: string, values?: Record<string, string>) => {
    const template = messages[key] ?? key;

    return Object.entries(values ?? {}).reduce(
      (current, [name, value]) => current.replace(`{${name}}`, value),
      template,
    );
  }) as never;
}
