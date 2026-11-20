import type { AdminResourceMetadata } from "../types/admin.types";
import { categorySystemRegistry } from "../../../catalog/admin/categories/category-system/category-system.registry";

const categoryResources: AdminResourceMetadata[] = categorySystemRegistry
  .projectResources()
  .map((projection) => {
    const navigation = categorySystemRegistry
      .projectNavigation()
      .find((candidate) => candidate.resource === projection.resource);

    if (!navigation) {
      throw new Error(
        `Missing category navigation projection: ${projection.resource}`,
      );
    }

    return {
      name: projection.resource as AdminResourceMetadata["name"],
      list: navigation.listPath,
      create: `${navigation.listPath}/create`,
      show: `${navigation.listPath}/:id`,
      edit: `${navigation.listPath}/:id/edit`,
      apiPath: projection.apiBasePath,
      groupKey: projection.group,
      labelKey: projection.labelKey,
      icon: projection.icon,
      strictPermissions: projection.strictPermissions,
      permissions: {
        list: projection.operationPermissions.list,
        show: projection.operationPermissions.get,
        create: projection.operationPermissions.create,
        edit: projection.operationPermissions.patch,
        delete: projection.operationPermissions.delete,
        move: projection.operationPermissions.move,
        state: projection.operationPermissions.activate,
      },
      capabilities: { filters: [], search: [], optionalActions: [] },
    };
  });

export const adminResources: AdminResourceMetadata[] = [
  ...categoryResources,
  {
    name: "users",
    list: "/admin/users",
    create: "/admin/users/create",
    show: "/admin/users/:id",
    edit: "/admin/users/:id/edit",
    apiPath: "/api/v1/admin/users",
    groupKey: "pages",
    labelKey: "Admin.Navigation.users",
    icon: "users",
    permissions: {
      list: "admin:users:read",
      show: "admin:users:read",
      create: "admin:users:write",
      edit: "admin:users:write",
      delete: "admin:users:write",
      state: "admin:users:status",
    },
    capabilities: {
      filters: [],
      search: [],
      optionalActions: [],
    },
  },
];

export function getAdminResourceMetadata(
  name: AdminResourceMetadata["name"],
): AdminResourceMetadata {
  const resource = adminResources.find((item) => item.name === name);

  if (!resource) {
    throw new Error(`Unknown admin resource: ${name}`);
  }

  return resource;
}
