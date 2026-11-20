import type { AdminResourceName } from "../../../platform/admin/types/admin.types";
import { createCategoryRouteFamily } from "./category-system/category-route-family";
import type {
  CategoryRouteFamilyKey,
  CategorySystemDefinition,
} from "./category-system/category-system.types";

export type AdminCategoryListingResource = Extract<
  AdminResourceName,
  "productCategories"
>;

export interface AdminCategoryListingConfig {
  sectionKey: string;
  systemKey: string;
  resource: AdminCategoryListingResource;
  permissionResource: AdminCategoryListingResource;
  listHref: string;
  treeHref: string;
  createHref: string;
  showHref: (id: string | number) => string;
  editHref: (id: string | number) => string;
  childrenHref: (parentId: string | number) => string;
  apiBasePath: `/api/v1/${string}`;
  labelKey: string;
  translationNamespace: "Admin.ProductCategories";
  enabled: boolean;
  readPermission: string;
  writePermission: string;
}

export function createAdminCategoryApiBasePath(
  systemKey: string,
): `/api/v1/admin/category-systems/${string}/categories` {
  return `/api/v1/admin/category-systems/${systemKey}/categories`;
}

export function categorySystemReadPermission(systemKey: string): string {
  return `admin:${systemKey}-categories:read`;
}

export function categorySystemWritePermission(systemKey: string): string {
  return `admin:${systemKey}-categories:write`;
}

export function createCategoryListingConfig(
  definition: CategorySystemDefinition<string>,
  routeFamilyKey: CategoryRouteFamilyKey,
): AdminCategoryListingConfig {
  const routes = createCategoryRouteFamily(definition, routeFamilyKey);

  return Object.freeze({
    sectionKey: definition.presentation.sectionKey,
    systemKey: definition.systemKey,
    resource: definition.resource as AdminCategoryListingResource,
    permissionResource: definition.resource as AdminCategoryListingResource,
    listHref: routes.list(),
    treeHref: routes.tree(),
    createHref: routes.create(),
    showHref: routes.detail,
    editHref: routes.edit,
    childrenHref: routes.children,
    apiBasePath: definition.apiBasePath,
    labelKey: definition.presentation.labelKey,
    translationNamespace: definition.presentation.translationNamespace,
    enabled: definition.screens.list,
    readPermission: definition.operationPermissions.list,
    writePermission: definition.operationPermissions.create,
  });
}
