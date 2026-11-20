import type { AdminCategoryDto } from "@tgp/contracts";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import type { AdminIdentity } from "../../../../platform/admin/types/admin.types";
import { productCategoryAliasConfig } from "./category-system.fixtures";
import { CategoryListView } from "../components/CategoryList";
import { parseCategoryListingScope } from "../category-listing-scope";
import { mapCategoryDtoToListItem } from "../mappers/category-admin.mapper";
import type { CategoryAdminPageMetadata } from "../types/category-admin.types";

describe("CategoryListView", () => {
  it("renders states, flat context, out-of-range metadata, and sorting", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const baseProps = listProps({ items: [] });
    const { rerender } = render(<CategoryListView {...baseProps} loading />);

    expect(screen.getByText(/loading admin dashboard/i)).toBeVisible();

    rerender(
      <CategoryListView {...baseProps} page={pageMetadata({ number: 3 })} />,
    );
    expect(screen.getByText(/page 4 of 2 - 22 total/i)).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /all categories/i }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /open full tree/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories/tree");

    rerender(<CategoryListView {...baseProps} error onRetry={vi.fn()} />);
    expect(screen.getByText(/something went wrong/i)).toBeVisible();

    rerender(
      <CategoryListView
        {...listProps({
          onPageSizeChange,
          onSortChange,
          sortField: "name",
          sortOrder: "desc",
        })}
      />,
    );
    expect(screen.getAllByText("Computers")[0]).toBeVisible();
    expect(screen.getByText("Laptops")).toBeVisible();
    expect(screen.queryByText("1 / Laptops")).toBeNull();
    expect(
      screen.getByRole("link", { name: /create category/i }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /sort by slug/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /sort by updated/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /created/i })).toBeNull();
    await user.click(
      screen.getByRole("button", { name: /name sorted descending/i }),
    );
    expect(onSortChange).toHaveBeenCalledWith("name", "asc");

    await user.click(screen.getByRole("combobox", { name: /rows per page/i }));
    await user.click(screen.getByRole("option", { name: "50" }));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("preserves rows while showing refetching status", () => {
    render(<CategoryListView {...listProps({ fetching: true })} />);

    expect(screen.getByText("Laptops")).toBeVisible();
    expect(screen.getByText(/refreshing table data/i)).toBeVisible();
  });

  it("preserves category-specific cells and flat empty behavior", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CategoryListView
        {...listProps({
          items: [
            mapCategoryDtoToListItem(
              categoryDto({ active: false, parentId: null }),
              "en-CA",
            ),
          ],
        })}
      />,
    );

    expect(screen.getAllByText("Computers")[0]).toBeVisible();
    expect(screen.getByText("computers")).toBeVisible();
    expect(screen.getByText("Root category")).toBeVisible();
    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
    expect(screen.getByText(/may 30, 2026/i)).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: /more actions for computers/i }),
    );
    expect(
      screen.getByRole("menuitem", { name: /view details/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories/1");
    await user.keyboard("{Escape}");

    rerender(<CategoryListView {...listProps({ items: [] })} />);

    expect(screen.getByText(/no records found/i)).toBeVisible();
    expect(screen.queryByText(/category hierarchy/i)).toBeNull();
  });

  it("links child-capable root rows and keeps leaf rows plain", () => {
    render(
      <CategoryListView
        {...listProps({
          scope: parseCategoryListingScope(
            new URLSearchParams("parentId=0"),
            productCategoryAliasConfig.listHref,
          ).scope,
          items: [
            mapCategoryDtoToListItem(
              categoryDto({ id: 1, name: "Computers", hasChildren: true }),
              "en-CA",
            ),
            mapCategoryDtoToListItem(
              categoryDto({ id: 2, name: "Chargers", hasChildren: false }),
              "en-CA",
            ),
          ],
        })}
      />,
    );

    expect(
      screen.getByRole("link", { name: /view children for computers/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories?parentId=1");
    expect(screen.queryByRole("link", { name: /chargers/i })).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Root categories" }),
    ).toBeVisible();
  });

  it("hides write actions for read-only users", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CategoryListView
        {...listProps({
          identity: identity({ permissions: ["admin:catalogue-categories:read"] }),
          items: [mapCategoryDtoToListItem(categoryDto(), "en-CA")],
        })}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /more actions for computers/i }),
    );
    expect(
      screen.getByRole("menuitem", { name: /view details/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories/1");
    expect(screen.queryByRole("link", { name: /create category/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /edit/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /delete/i })).toBeNull();
    await user.keyboard("{Escape}");

    rerender(
      <CategoryListView
        {...listProps({
          identity: identity({
            permissions: ["admin:catalogue-categories:read", "admin:catalogue-categories:write"],
          }),
          items: [mapCategoryDtoToListItem(categoryDto(), "en-CA")],
        })}
      />,
    );

    expect(screen.getByRole("link", { name: /create category/i })).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: /more actions for computers/i }),
    );
    expect(screen.getByRole("menuitem", { name: /edit/i })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeVisible();
    expect(
      screen.getByRole("menuitem", { name: /deactivate/i }),
    ).toBeVisible();
    await user.keyboard("{Escape}");

    rerender(
      <CategoryListView
        {...listProps({
          identity: identity({
            permissions: ["admin:catalogue-categories:read", "admin:catalogue-categories:write"],
          }),
          items: [mapCategoryDtoToListItem(categoryDto(), "en-CA")],
          stateActionsAvailable: false,
        })}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /more actions for computers/i }),
    );
    expect(screen.queryByRole("menuitem", { name: /deactivate/i })).toBeNull();
  });

  it("derives Product Categories table links and actions from config", async () => {
    const user = userEvent.setup();
    const productConfig = productCategoryAliasConfig;

    render(
      <CategoryListView
        {...listProps({
          config: productConfig,
          identity: identity({
            permissions: [
              "admin:catalogue-categories:read",
              "admin:catalogue-categories:write",
            ],
          }),
          scope: parseCategoryListingScope(
            new URLSearchParams("parentId=0"),
            productConfig.listHref,
          ).scope,
          items: [
            mapCategoryDtoToListItem(
              categoryDto({ id: 1, name: "Computers", hasChildren: true }),
              "en-CA",
            ),
          ],
        })}
      />,
    );

    expect(
      screen.getByRole("link", { name: /open full tree/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories/tree");
    expect(
      screen.getByRole("link", { name: /create category/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories/create");
    expect(
      screen.getByRole("link", { name: /view children for computers/i }),
    ).toHaveAttribute(
      "href",
      "/en-CA/admin/products/categories?parentId=1",
    );

    await user.click(
      screen.getByRole("button", { name: /more actions for computers/i }),
    );
    expect(
      screen.getByRole("menuitem", { name: /view details/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories/1");
    expect(screen.getByRole("menuitem", { name: /edit/i })).toHaveAttribute(
      "href",
      "/en-CA/admin/products/categories/1/edit",
    );
  });

  it("requires explicit Product Category permissions for list write controls", async () => {
    const user = userEvent.setup();
    const productConfig = productCategoryAliasConfig;
    const { rerender } = render(
      <CategoryListView
        {...listProps({
          config: productConfig,
          identity: identity({ roles: ["ADMIN"] }),
          items: [
            mapCategoryDtoToListItem(
              categoryDto({ id: 1, name: "Computers", hasChildren: true }),
              "en-CA",
            ),
          ],
        })}
      />,
    );

    expect(
      screen.queryByRole("link", { name: /create category/i }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /more actions/i })).toBeNull();

    rerender(
      <CategoryListView
        {...listProps({
          config: productConfig,
          identity: identity({
            roles: ["ADMIN"],
            permissions: ["admin:catalogue-categories:read"],
          }),
          items: [
            mapCategoryDtoToListItem(
              categoryDto({ id: 1, name: "Computers", hasChildren: true }),
              "en-CA",
            ),
          ],
        })}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /more actions for computers/i }),
    );
    expect(
      screen.getByRole("menuitem", { name: /view details/i }),
    ).toHaveAttribute("href", "/en-CA/admin/products/categories/1");
    expect(screen.queryByRole("link", { name: /create category/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /edit/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /delete/i })).toBeNull();
  });
});

function listProps(
  overrides: Partial<Parameters<typeof CategoryListView>[0]> = {},
) {
  return {
    identity: identity({
      permissions: [
        "admin:catalogue-categories:read",
        "admin:catalogue-categories:write",
      ],
    }),
    locale: "en-CA" as const,
    items: [
      mapCategoryDtoToListItem(
        categoryDto({
          id: 1,
          name: "Computers",
          parentId: null,
          hasChildren: true,
        }),
        "en-CA",
      ),
      mapCategoryDtoToListItem(
        categoryDto({ id: 2, name: "Laptops", parentId: 1 }),
        "en-CA",
      ),
    ],
    currentPage: 1,
    pageSize: 20,
    sortField: "updatedAt" as const,
    sortOrder: "desc" as const,
    ...overrides,
    config: overrides.config ?? productCategoryAliasConfig,
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

function pageMetadata(
  overrides: Partial<CategoryAdminPageMetadata> = {},
): CategoryAdminPageMetadata {
  return {
    number: 0,
    size: 20,
    totalElements: 22,
    totalPages: 2,
    numberOfElements: 20,
    first: true,
    last: false,
    ...overrides,
  };
}

function categoryDto(
  overrides: Partial<AdminCategoryDto> = {},
): AdminCategoryDto {
  return {
    id: 1,
    parentId: null,
    sortRank: null,
    depth: overrides.parentId == null ? 0 : 1,
    hasChildren: false,
    name: "Computers",
    slug: "computers",
    active: true,
    createdAt: "2026-05-29T12:00:00.000Z",
    updatedAt: "2026-05-30T12:00:00.000Z",
    ...overrides,
  };
}
