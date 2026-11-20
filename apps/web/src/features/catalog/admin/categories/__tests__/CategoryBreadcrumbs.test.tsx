import type { AdminCategoryBreadcrumbItemDto } from "@tgp/contracts";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import { CategoryBreadcrumbs } from "../components/CategoryBreadcrumbs";
import { parseCategoryListingScope } from "../category-listing-scope";

describe("CategoryBreadcrumbs", () => {
  it("renders semantic ancestor navigation and current parent state", () => {
    render(
      <CategoryBreadcrumbs
        locale="en-CA"
        scope={scope("parentId=123")}
        state={{ status: "ready", items: breadcrumbItems() }}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: /category breadcrumb/i }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /root categories/i })).toHaveAttribute(
      "href",
      "/en-CA/admin/products/categories?parentId=0",
    );
    expect(screen.getByRole("link", { name: "Computers" })).toHaveAttribute(
      "href",
      "/en-CA/admin/products/categories?parentId=10",
    );
    expect(screen.getByText("Laptops")).toBeVisible();
  });

  it("renders loading, retryable error, and not-found recovery states", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(
      <CategoryBreadcrumbs
        locale="en-CA"
        scope={scope("parentId=123")}
        state={{ status: "loading" }}
      />,
    );

    expect(screen.getByText(/loading category breadcrumb/i)).toBeVisible();

    rerender(
      <CategoryBreadcrumbs
        locale="en-CA"
        onRetry={onRetry}
        scope={scope("parentId=123")}
        state={{ status: "error", error: new Error("failed") }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /retry breadcrumb/i }));
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(
      <CategoryBreadcrumbs
        locale="en-CA"
        scope={scope("parentId=123")}
        state={{ status: "not-found", error: { status: 404 } }}
      />,
    );
    expect(screen.getByText(/selected parent category was not found/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /all categories/i })).toBeVisible();
  });
});

function scope(query: string) {
  return parseCategoryListingScope(
    new URLSearchParams(query),
    "/admin/products/categories",
  ).scope;
}

function breadcrumbItems(): AdminCategoryBreadcrumbItemDto[] {
  return [
    {
      id: 10,
      parentId: null,
      sortRank: 1,
      depth: 0,
      name: "Computers",
      slug: "computers",
      active: true,
      createdAt: "2026-05-29T12:00:00.000Z",
      updatedAt: "2026-05-30T12:00:00.000Z",
    },
    {
      id: 123,
      parentId: 10,
      sortRank: 2,
      depth: 1,
      name: "Laptops",
      slug: "laptops",
      active: true,
      createdAt: "2026-05-29T12:00:00.000Z",
      updatedAt: "2026-05-30T12:00:00.000Z",
    },
  ];
}
