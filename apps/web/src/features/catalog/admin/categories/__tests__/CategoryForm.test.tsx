import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminCategoryParentOptionDto } from "@tgp/contracts";

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
import { productCategoryAliasConfig } from "./category-system.fixtures";
import { CategoryFormView, ProductCategoryForm } from "../components/CategoryForm";
import { emptyCategoryAdminFormValues } from "../mappers/category-admin.mapper";

describe("CategoryFormView", () => {
  it("validates hierarchy fields and submits without ordinary confirmation", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CategoryFormView
        config={productCategoryAliasConfig}
        mode="create"
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /create category/i }));
    expect(await screen.findByText(/enter a category name/i)).toBeVisible();
    expect(screen.getByText(/enter a category slug/i)).toBeVisible();

    await user.type(screen.getByRole("textbox", { name: /^name/i }), "Laptops");
    expect(screen.getByRole("combobox", { name: /parent id/i })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /create category/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Laptops",
        parentId: "",
        slug: "laptops",
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows disabled, safe feedback, and conflict reload states", async () => {
    const user = userEvent.setup();
    const onReloadLatest = vi.fn();

    render(
      <CategoryFormView
        config={productCategoryAliasConfig}
        mode="edit"
        loading
        formError="Review the category fields and try again."
        successMessage="The category was updated."
        conflict
        onReloadLatest={onReloadLatest}
        initialValues={{
          ...emptyCategoryAdminFormValues,
          name: "Laptops",
          slug: "laptops",
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /save category/i }),
    ).toBeDisabled();
    expect(screen.getByText(/review the category fields/i)).toBeVisible();
    expect(screen.getByText(/the category was updated/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /reload latest/i }));
    expect(onReloadLatest).toHaveBeenCalled();
  });

  it("maps duplicate category slug backend errors to the slug field", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => {
      throw {
        details: {
          code: "DUPLICATE_CATEGORY_SLUG",
          fieldErrors: [],
          message: "Category slug already exists.",
          path: "/api/v1/admin/category-systems/catalogue/categories",
          timestamp: "2026-06-04T00:00:00Z",
        },
      };
    });

    render(
      <CategoryFormView
        config={productCategoryAliasConfig}
        mode="create"
        onSubmit={onSubmit}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /^name/i }),
      "Duplicate category",
    );
    await user.click(screen.getByRole("button", { name: /create category/i }));

    expect(await screen.findByText("Category slug already exists.")).toBeVisible();
  });

  it("loads parent category options from the admin category API", async () => {
    const user = userEvent.setup();
    const customCalls: Array<
      Parameters<AdminFormOptionLoaderApi["custom"]>[0]
    > = [];
    const custom: AdminFormOptionLoaderApi["custom"] = async <TResponse,>(
      args: Parameters<AdminFormOptionLoaderApi["custom"]>[0],
    ) => {
      customCalls.push(args);
      return {
        data: [parentOption()],
        hasMore: false,
        nextCursor: null,
      } as TResponse;
    };
    const api: AdminFormOptionLoaderApi = {
      custom,
      loadOptions: vi.fn(),
    };

    render(
      <CategoryFormView
        config={productCategoryAliasConfig}
        api={api}
        initialValues={{
          ...emptyCategoryAdminFormValues,
          id: "1",
          name: "Laptops",
          slug: "laptops",
        }}
        mode="edit"
        onSubmit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /parent id/i }));

    expect(
      await screen.findByRole("option", { name: /accessories/i }),
    ).toBeVisible();
    await waitFor(() => {
      expect(customCalls).toContainEqual(
        expect.objectContaining({
          method: "get",
          query: {
            excludeSubtreeId: 1,
            limit: 25,
          },
          url: "/api/v1/admin/category-systems/catalogue/categories/parent-options",
        }),
      );
    });
  });

  it("loads Product Category parent options from the configured catalogue API", async () => {
    const user = userEvent.setup();
    const customCalls: Array<
      Parameters<AdminFormOptionLoaderApi["custom"]>[0]
    > = [];
    const api: AdminFormOptionLoaderApi = {
      custom: vi.fn(async <TResponse,>(
        args: Parameters<AdminFormOptionLoaderApi["custom"]>[0],
      ) => {
        customCalls.push(args);

        return {
          data: [parentOption()],
          hasMore: false,
          nextCursor: null,
        } as TResponse;
      }) as AdminFormOptionLoaderApi["custom"],
      loadOptions: vi.fn(),
    };

    render(
      <CategoryFormView
        config={productCategoryAliasConfig}
        api={api}
        initialValues={{
          ...emptyCategoryAdminFormValues,
          id: "1",
          name: "Laptops",
          slug: "laptops",
        }}
        mode="edit"
        onSubmit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /parent id/i }));

    expect(
      await screen.findByRole("option", { name: /accessories/i }),
    ).toBeVisible();
    await waitFor(() => {
      expect(customCalls).toContainEqual(
        expect.objectContaining({
          method: "get",
          query: {
            excludeSubtreeId: 1,
            limit: 25,
          },
          url: "/api/v1/admin/category-systems/catalogue/categories/parent-options",
        }),
      );
    });
  });

  it("hydrates the selected parent and submits a changed parent", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const customCalls: Array<
      Parameters<AdminFormOptionLoaderApi["custom"]>[0]
    > = [];
    const api: AdminFormOptionLoaderApi = {
      custom: vi.fn(async <TResponse,>(
        args: Parameters<AdminFormOptionLoaderApi["custom"]>[0],
      ) => {
        customCalls.push(args);

        return {
          data: [
            parentOption(),
            parentOption({
              id: 3,
              label: "Cameras",
              name: "Cameras",
              slug: "cameras",
            }),
          ],
          hasMore: false,
          nextCursor: null,
        } as TResponse;
      }) as AdminFormOptionLoaderApi["custom"],
      loadOptions: vi.fn(),
    };

    render(
      <CategoryFormView
        config={productCategoryAliasConfig}
        api={api}
        initialValues={{
          ...emptyCategoryAdminFormValues,
          id: "1",
          name: "Laptops",
          parentId: "2",
          slug: "laptops",
        }}
        mode="edit"
        onSubmit={onSubmit}
      />,
    );

    const parentSelect = screen.getByRole("combobox", { name: /parent id/i });

    await user.click(parentSelect);
    expect(
      await screen.findByRole("option", { name: /accessories/i }),
    ).toBeVisible();
    expect(customCalls).toContainEqual(
      expect.objectContaining({
        query: {
          excludeSubtreeId: 1,
          includeIds: [2],
          includeInactive: true,
          limit: 25,
        },
      }),
    );

    await user.click(await screen.findByRole("option", { name: /cameras/i }));
    expect(parentSelect).toHaveValue("Cameras");

    await user.click(screen.getByRole("button", { name: /save category/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: "3",
      }),
    );
  });
});

describe("ProductCategoryForm", () => {
  afterEach(() => {
    clearAdminIdentity();
  });

  it("renders a forbidden state for admin-role-only create and edit routes", () => {
    const { rerender } = renderProductCategoryForm({
      permissions: [],
      roles: ["ADMIN"],
    });

    expect(screen.getByText(/access denied/i)).toBeVisible();

    rerender(<ProductCategoryForm id="1" locale="en-CA" mode="edit" />);

    expect(screen.getByText(/access denied/i)).toBeVisible();
  });

  it("renders a forbidden state for read-only Product Category create and edit routes", () => {
    const { rerender } = renderProductCategoryForm({
      permissions: ["admin:catalogue-categories:read"],
      roles: ["ADMIN"],
    });

    expect(screen.getByText(/access denied/i)).toBeVisible();

    rerender(<ProductCategoryForm id="1" locale="en-CA" mode="edit" />);

    expect(screen.getByText(/access denied/i)).toBeVisible();
  });
});

function renderProductCategoryForm(identity: {
  permissions: string[];
  roles: string[];
}) {
  setAdminIdentity({
    id: "admin_1",
    permissions: identity.permissions,
    roles: identity.roles,
    sessionScope: "admin",
    username: "admin",
  });

  return render(<ProductCategoryForm locale="en-CA" mode="create" />);
}

function parentOption(
  overrides: Partial<AdminCategoryParentOptionDto> = {},
): AdminCategoryParentOptionDto {
  return {
    active: true,
    depth: 0,
    disabledReason: null,
    id: 2,
    label: "Accessories",
    name: "Accessories",
    parentId: null,
    path: [],
    selectable: true,
    slug: "accessories",
    ...overrides,
  };
}
