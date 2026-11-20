import type { CategorySystemDefinition } from "../category-system/category-system.types";
import { createCategoryListingConfig } from "../admin-category-listing.config";
import { catalogueCategorySystemDefinition } from "../category-system/catalogue-category-system.definition";

export const productCategoryAliasConfig = createCategoryListingConfig(
  catalogueCategorySystemDefinition,
  "product-categories",
);

const numericIdentifierAdapter = {
  profile: "NUMERIC_LONG_V1" as const,
  serialize(value: number) {
    return Number.isSafeInteger(value) && value > 0
      ? { ok: true as const, value: String(value) }
      : { ok: false as const, reason: "invalid-identifier" as const };
  },
  parse(value: string) {
    if (!/^[1-9]\d*$/.test(value)) {
      return { ok: false as const, reason: "invalid-identifier" as const };
    }

    const parsed = Number(value);

    return Number.isSafeInteger(parsed) && parsed > 0
      ? { ok: true as const, value: parsed }
      : { ok: false as const, reason: "invalid-identifier" as const };
  },
};

export function createRestrictedCategorySystemDefinition(
  systemKey: "flat-restricted" | "secondary-restricted",
): CategorySystemDefinition<string> {
  const basePath = `/admin/category-systems/${systemKey}/categories` as const;
  const readPermission = `admin:${systemKey}:read`;

  return {
    systemKey,
    resource: `${systemKey}-categories`,
    apiBasePath: `/api/v1/admin/category-systems/${systemKey}/categories`,
    routes: {
      base: basePath,
      list: basePath,
      tree: `${basePath}/tree`,
      create: `${basePath}/create`,
      detail: (id) => `${basePath}/${id}`,
      edit: (id) => `${basePath}/${id}/edit`,
      children: (id) => `${basePath}?parentId=${id}`,
    },
    routeFamilies: {
      generic: { key: "generic", kind: "generic", basePath },
      aliases: [],
      preferred: "generic",
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
    identifierAdapter: numericIdentifierAdapter,
    rootModel: "IMPLICIT_NULL_PARENT",
    preferredLimits: { parentOptionPageSize: 25, treeSize: 100 },
    declaredOperations: ["capabilities", "list", "get"],
    visibleOperations: ["list", "get"],
    operationPermissions: {
      capabilities: readPermission,
      list: readPermission,
      get: readPermission,
      tree: readPermission,
      "parent-options": readPermission,
      breadcrumb: readPermission,
      create: readPermission,
      replace: readPermission,
      patch: readPermission,
      delete: readPermission,
      move: readPermission,
      reorder: readPermission,
      activate: readPermission,
      deactivate: readPermission,
    },
    strictPermissions: true,
    screens: {
      list: true,
      tree: false,
      create: false,
      detail: true,
      edit: false,
    },
  };
}
