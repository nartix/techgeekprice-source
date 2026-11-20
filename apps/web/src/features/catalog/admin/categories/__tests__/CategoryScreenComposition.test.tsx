import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "../../../../../../tests/test-utils/render";
import {
  clearAdminIdentity,
  setAdminIdentity,
} from "../../../../platform/admin/session/adminIdentityStore";
import { createRestrictedCategorySystemDefinition } from "./category-system.fixtures";

vi.mock("../components/CategoryList", () => ({
  AdminCategoryList: ({ config }: { config: { listHref: string } }) => (
    <output data-testid="category-list">{config.listHref}</output>
  ),
}));

vi.mock("../components/CategoryDetail", () => ({
  CategoryDetail: ({
    config,
    id,
  }: {
    config: { showHref: (id: string) => string };
    id: string;
  }) => <output data-testid="category-detail">{config.showHref(id)}</output>,
}));

vi.mock("../components/CategoryForm", () => ({
  CategoryForm: ({
    config,
    mode,
  }: {
    config: { createHref: string };
    mode: string;
  }) => (
    <output data-testid="category-form">{`${mode}:${config.createHref}`}</output>
  ),
}));

vi.mock("../tree/components/SmallCategoryTreePage", () => ({
  SmallCategoryTreePage: ({ config }: { config: { treeHref: string } }) => (
    <output data-testid="category-tree">{config.treeHref}</output>
  ),
}));

vi.mock("../category-system/CategorySystemRuntimeProvider", () => ({
  CategorySystemRuntimeProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="category-runtime">{children}</div>,
}));

import { CategoryScreenComposition } from "../category-system/CategoryScreenComposition";

describe("CategoryScreenComposition", () => {
  beforeEach(() => {
    setAdminIdentity({
      id: "admin_1",
      permissions: [
        "admin:catalogue-categories:read",
        "admin:catalogue-categories:write",
      ],
      roles: [],
      sessionScope: "admin",
      username: "admin",
    });
  });

  afterEach(() => {
    clearAdminIdentity();
  });

  it("mounts the resolved generic category screen inside one runtime provider", () => {
    render(
      <CategoryScreenComposition
        locale="en-CA"
        routeFamilyKey="generic"
        screen="list"
        systemKey="catalogue"
      />,
    );

    expect(screen.getByTestId("category-runtime")).toBeVisible();
    expect(screen.getByTestId("category-list")).toHaveTextContent(
      "/admin/category-systems/catalogue/categories",
    );
  });

  it("keeps generic detail links in the selected route family", () => {
    render(
      <CategoryScreenComposition
        id="42"
        locale="en-CA"
        routeFamilyKey="generic"
        screen="detail"
        systemKey="catalogue"
      />,
    );

    expect(screen.getByTestId("category-detail")).toHaveTextContent(
      "/admin/category-systems/catalogue/categories/42",
    );
  });

  it("uses an explicitly resolved restricted definition without registering it", () => {
    setAdminIdentity({
      id: "admin_1",
      permissions: ["admin:flat-restricted:read"],
      roles: [],
      sessionScope: "admin",
      username: "admin",
    });
    const RestrictedComposition = CategoryScreenComposition as unknown as (
      props: React.ComponentProps<typeof CategoryScreenComposition> & {
        definition: ReturnType<typeof createRestrictedCategorySystemDefinition>;
      },
    ) => React.ReactNode;

    render(
      <RestrictedComposition
        definition={createRestrictedCategorySystemDefinition("flat-restricted")}
        locale="en-CA"
        routeFamilyKey="generic"
        screen="list"
        systemKey="flat-restricted"
      />,
    );

    expect(screen.getByTestId("category-list")).toHaveTextContent(
      "/admin/category-systems/flat-restricted/categories",
    );
  });

  it("does not mount disabled restricted screens", () => {
    setAdminIdentity({
      id: "admin_1",
      permissions: ["admin:flat-restricted:read"],
      roles: [],
      sessionScope: "admin",
      username: "admin",
    });

    render(
      <CategoryScreenComposition
        definition={createRestrictedCategorySystemDefinition("flat-restricted")}
        locale="en-CA"
        routeFamilyKey="generic"
        screen="tree"
        systemKey="flat-restricted"
      />,
    );

    expect(screen.queryByTestId("category-runtime")).toBeNull();
    expect(screen.queryByTestId("category-tree")).toBeNull();
  });
});
