import type { AdminCategoryOperation } from "@tgp/contracts";

import { numericLongV1CategoryIdentifierAdapter } from "./category-identifier-adapter";
import type { CategorySystemDefinition } from "./category-system.types";

const declaredOperations: readonly AdminCategoryOperation[] = [
  "capabilities",
  "list",
  "tree",
  "parent-options",
  "get",
  "breadcrumb",
  "create",
  "replace",
  "patch",
  "delete",
  "move",
  "reorder",
  "activate",
  "deactivate",
];

const readPermission = "admin:catalogue-categories:read";
const writePermission = "admin:catalogue-categories:write";

export const catalogueCategorySystemDefinition: CategorySystemDefinition = {
  systemKey: "catalogue",
  resource: "productCategories",
  apiBasePath: "/api/v1/admin/category-systems/catalogue/categories",
  routes: {
    base: "/admin/products/categories",
    list: "/admin/products/categories",
    tree: "/admin/products/categories/tree",
    create: "/admin/products/categories/create",
    detail: (id) => `/admin/products/categories/${id}`,
    edit: (id) => `/admin/products/categories/${id}/edit`,
    children: (id) => `/admin/products/categories?parentId=${id}`,
  },
  routeFamilies: {
    generic: {
      key: "generic",
      kind: "generic",
      basePath: "/admin/category-systems/catalogue/categories",
    },
    aliases: [
      {
        key: "product-categories",
        kind: "alias",
        basePath: "/admin/products/categories",
      },
    ],
    preferred: "product-categories",
  },
  presentation: {
    sectionKey: "products",
    labelKey: "Admin.Navigation.productCategories",
    metadataKey: "Admin.Metadata.productCategoriesTitle",
    translationNamespace: "Admin.ProductCategories",
  },
  navigation: {
    group: "products",
    icon: "productCategories",
    labelKey: "Admin.Navigation.productCategories",
    listPermission: readPermission,
  },
  identifierProfile: "NUMERIC_LONG_V1",
  identifierAdapter: numericLongV1CategoryIdentifierAdapter,
  rootModel: "IMPLICIT_NULL_PARENT",
  preferredLimits: { parentOptionPageSize: 25, treeSize: 10_000 },
  declaredOperations,
  visibleOperations: declaredOperations.filter(
    (operation) => operation !== "reorder",
  ),
  operationPermissions: {
    capabilities: readPermission,
    list: readPermission,
    tree: readPermission,
    "parent-options": readPermission,
    get: readPermission,
    breadcrumb: readPermission,
    create: writePermission,
    replace: writePermission,
    patch: writePermission,
    delete: writePermission,
    move: writePermission,
    reorder: writePermission,
    activate: writePermission,
    deactivate: writePermission,
  },
  strictPermissions: true,
  screens: { list: true, tree: true, create: true, detail: true, edit: true },
};
