import type { AdminCategoryOperation } from "@tgp/contracts";

import { catalogueCategorySystemDefinition } from "./catalogue-category-system.definition";
import type {
  CategoryRouteFamilyDefinition,
  CategoryRouteFamilyKey,
  CategorySystemDefinition,
  CategorySystemNavigationProjection,
  CategorySystemRegistry,
  CategorySystemResourceProjection,
} from "./category-system.types";

const systemKeyPattern = /^[a-z][a-z0-9-]*$/;

const screenOperations = {
  list: "list",
  tree: "tree",
  create: "create",
  detail: "get",
  edit: "patch",
} as const satisfies Record<keyof CategorySystemDefinition["screens"], AdminCategoryOperation>;

function deepFreeze<TValue>(value: TValue): TValue {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach((item) => deepFreeze(item));
    Object.freeze(value);
  }

  return value;
}

function isCanonicalAbsolutePath(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.endsWith("/") &&
    !value.includes("?") &&
    !value.includes("#") &&
    !value.includes("//")
  );
}

function getRouteFamilies<TResource extends string>(
  definition: CategorySystemDefinition<TResource>,
): readonly CategoryRouteFamilyDefinition[] {
  return [definition.routeFamilies.generic, ...definition.routeFamilies.aliases];
}

function assertRouteFamily<TResource extends string>(
  definition: CategorySystemDefinition<TResource>,
  family: CategoryRouteFamilyDefinition,
): void {
  if (!isCanonicalAbsolutePath(family.basePath)) {
    throw new TypeError("Category route-family path is invalid.");
  }

  const expectedGenericPath = `/admin/category-systems/${definition.systemKey}/categories`;

  if (
    (family.key === "generic" &&
      (family.kind !== "generic" || family.basePath !== expectedGenericPath)) ||
    (family.key !== "generic" && family.kind !== "alias")
  ) {
    throw new TypeError("Category route family is invalid.");
  }
}

function assertDefinition<TResource extends string>(
  definition: CategorySystemDefinition<TResource>,
): void {
  if (!systemKeyPattern.test(definition.systemKey) || !definition.resource) {
    throw new TypeError("Category system identity is required.");
  }

  const expectedApiPath = `/api/v1/admin/category-systems/${definition.systemKey}/categories`;

  if (
    definition.apiBasePath !== expectedApiPath ||
    !isCanonicalAbsolutePath(definition.apiBasePath)
  ) {
    throw new TypeError("Category system API path is invalid.");
  }

  if (
    definition.identifierProfile !== "NUMERIC_LONG_V1" ||
    definition.identifierAdapter.profile !== definition.identifierProfile
  ) {
    throw new TypeError("Category system identifier profile is invalid.");
  }

  if (definition.rootModel !== "IMPLICIT_NULL_PARENT") {
    throw new TypeError("Category system root model is invalid.");
  }

  const routeFamilies = getRouteFamilies(definition);
  const routeFamilyKeys = new Set(routeFamilies.map((family) => family.key));

  if (
    routeFamilies.length !== routeFamilyKeys.size ||
    !routeFamilyKeys.has(definition.routeFamilies.preferred)
  ) {
    throw new TypeError("Category route-family identity is invalid.");
  }

  routeFamilies.forEach((family) => assertRouteFamily(definition, family));

  const preferredRouteFamily = routeFamilies.find(
    (family) => family.key === definition.routeFamilies.preferred,
  );
  const serialized = definition.identifierAdapter.serialize(1);

  if (
    !preferredRouteFamily ||
    !serialized.ok ||
    definition.routes.base !== preferredRouteFamily.basePath ||
    definition.routes.list !== preferredRouteFamily.basePath ||
    definition.routes.tree !== `${preferredRouteFamily.basePath}/tree` ||
    definition.routes.create !== `${preferredRouteFamily.basePath}/create` ||
    definition.routes.detail(1) !==
      `${preferredRouteFamily.basePath}/${serialized.value}` ||
    definition.routes.edit(1) !==
      `${preferredRouteFamily.basePath}/${serialized.value}/edit` ||
    definition.routes.children(1) !==
      `${preferredRouteFamily.basePath}?parentId=${serialized.value}`
  ) {
    throw new TypeError("Category system routes are invalid.");
  }

  if (
    !Number.isSafeInteger(definition.preferredLimits.parentOptionPageSize) ||
    (definition.preferredLimits.parentOptionPageSize ?? 1) <= 0 ||
    !Number.isSafeInteger(definition.preferredLimits.treeSize) ||
    (definition.preferredLimits.treeSize ?? 1) <= 0
  ) {
    throw new TypeError("Category system preferred limits are invalid.");
  }

  const declaredOperations = new Set(definition.declaredOperations);
  const visibleOperations = new Set(definition.visibleOperations);

  if (
    declaredOperations.size !== definition.declaredOperations.length ||
    !declaredOperations.has("capabilities") ||
    visibleOperations.size !== definition.visibleOperations.length ||
    definition.visibleOperations.some(
      (operation) => !declaredOperations.has(operation),
    ) ||
    definition.declaredOperations.some(
      (operation) => !definition.operationPermissions[operation]?.trim(),
    )
  ) {
    throw new TypeError("Category system operations are invalid.");
  }

  if (
    Object.entries(definition.screens).some(
      ([screen, enabled]) =>
        enabled &&
        !declaredOperations.has(
          screenOperations[screen as keyof typeof screenOperations],
        ),
    )
  ) {
    throw new TypeError("Category system screens are invalid.");
  }

  if (
    definition.presentation.sectionKey !== definition.navigation.group ||
    definition.presentation.labelKey !== definition.navigation.labelKey ||
    definition.navigation.listPermission !==
      definition.operationPermissions.list ||
    !definition.navigation.listPermission.trim()
  ) {
    throw new TypeError("Category system presentation is invalid.");
  }
}

function projectResources<TResource extends string>(
  definitions: readonly CategorySystemDefinition<TResource>[],
): readonly CategorySystemResourceProjection[] {
  return Object.freeze(
    definitions.map((definition) =>
      Object.freeze({
        resource: definition.resource,
        routeFamily: definition.routeFamilies.preferred,
        apiBasePath: definition.apiBasePath,
        group: definition.navigation.group,
        icon: definition.navigation.icon,
        labelKey: definition.navigation.labelKey,
        strictPermissions: definition.strictPermissions,
        operationPermissions: definition.operationPermissions,
      }),
    ),
  );
}

function projectNavigation<TResource extends string>(
  definitions: readonly CategorySystemDefinition<TResource>[],
): readonly CategorySystemNavigationProjection[] {
  return Object.freeze(
    definitions.map((definition) => {
      const routeFamily = getRouteFamilies(definition).find(
        (family) => family.key === definition.routeFamilies.preferred,
      );

      if (!routeFamily) {
        throw new TypeError("Category route-family projection is invalid.");
      }

      return Object.freeze({
        resource: definition.resource,
        routeFamily: definition.routeFamilies.preferred,
        listPath: routeFamily.basePath,
        group: definition.navigation.group,
        icon: definition.navigation.icon,
        labelKey: definition.navigation.labelKey,
        listPermission: definition.navigation.listPermission,
      });
    }),
  );
}

export function createCategorySystemRegistry<TResource extends string>(
  definitions: Iterable<CategorySystemDefinition<TResource>>,
): CategorySystemRegistry<TResource> {
  const registrations = [...definitions];
  const systemKeys = new Set<string>();
  const resources = new Set<string>();
  const routePaths = new Set<string>();

  for (const definition of registrations) {
    assertDefinition(definition);

    if (systemKeys.has(definition.systemKey) || resources.has(definition.resource)) {
      throw new TypeError("Duplicate category system registration.");
    }

    for (const family of getRouteFamilies(definition)) {
      if (routePaths.has(family.basePath)) {
        throw new TypeError("Duplicate category route-family registration.");
      }

      routePaths.add(family.basePath);
    }

    systemKeys.add(definition.systemKey);
    resources.add(definition.resource);
  }

  const frozenRegistrations = Object.freeze(registrations.map(deepFreeze));
  const bySystemKey = new Map(
    frozenRegistrations.map((definition) => [definition.systemKey, definition]),
  );
  const byResource = new Map<string, CategorySystemDefinition<TResource>>(
    frozenRegistrations.map((definition) => [definition.resource, definition]),
  );
  const resourcesProjection = projectResources(frozenRegistrations);
  const navigationProjection = projectNavigation(frozenRegistrations);

  return Object.freeze({
    getBySystemKey: (systemKey: string) => bySystemKey.get(systemKey),
    getByResource: (resource: string) => byResource.get(resource),
    getRouteFamily: (
      systemKey: string,
      routeFamilyKey: CategoryRouteFamilyKey,
    ) => {
      const definition = bySystemKey.get(systemKey);

      return definition
        ? getRouteFamilies(definition).find(
            (family) => family.key === routeFamilyKey,
          )
        : undefined;
    },
    list: () => frozenRegistrations,
    projectResources: () => resourcesProjection,
    projectNavigation: () => navigationProjection,
  });
}

export const categorySystemRegistry = createCategorySystemRegistry([
  catalogueCategorySystemDefinition,
]);
