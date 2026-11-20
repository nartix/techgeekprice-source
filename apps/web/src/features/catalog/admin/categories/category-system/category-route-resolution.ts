import type {
  CategoryRouteFamilyDefinition,
  CategoryRouteFamilyKey,
  CategoryScreen,
  CategorySystemDefinition,
} from "./category-system.types";
import { categorySystemRegistry } from "./category-system.registry";

const supportedLocales = ["en-CA", "en-US", "fr-CA"] as const;

const screenOperations = {
  list: "list",
  tree: "tree",
  create: "create",
  detail: "get",
  edit: "patch",
} as const;

export type CategoryRouteLocale = (typeof supportedLocales)[number];

export interface CategoryRouteRequest {
  readonly systemKey: string;
  readonly routeFamilyKey: CategoryRouteFamilyKey;
  readonly screen: CategoryScreen;
  readonly locale: string;
  readonly id?: string;
  readonly parentId?: string;
  readonly permissions?: readonly string[];
}

export type CategoryRouteResolution =
  | { readonly status: "not-found" }
  | { readonly status: "forbidden" }
  | {
      readonly status: "ready";
      readonly definition: CategorySystemDefinition;
      readonly routeFamily: CategoryRouteFamilyDefinition;
      readonly screen: CategoryScreen;
      readonly locale: CategoryRouteLocale;
      readonly identifier?: number;
      readonly parentId?: number;
    };

export function resolveCategoryRouteMetadata(systemKey: string): {
  readonly metadataKey: CategorySystemDefinition["presentation"]["metadataKey"];
} | null {
  const definition = categorySystemRegistry.getBySystemKey(systemKey);

  return definition
    ? { metadataKey: definition.presentation.metadataKey }
    : null;
}

function isSupportedLocale(locale: string): locale is CategoryRouteLocale {
  return supportedLocales.includes(locale as CategoryRouteLocale);
}

function resolveRouteFamily(
  definition: CategorySystemDefinition,
  routeFamilyKey: CategoryRouteFamilyKey,
): CategoryRouteFamilyDefinition | undefined {
  return [
    definition.routeFamilies.generic,
    ...definition.routeFamilies.aliases,
  ].find((family) => family.key === routeFamilyKey);
}

function hasScreenPermission(
  definition: CategorySystemDefinition,
  screen: CategoryScreen,
  permissions: readonly string[],
): boolean {
  const permission = definition.operationPermissions[screenOperations[screen]];

  return Boolean(permission && permissions.includes(permission));
}

export function resolveCategoryRoute(
  request: CategoryRouteRequest,
): CategoryRouteResolution {
  const definition = categorySystemRegistry.getBySystemKey(request.systemKey);

  if (!definition || !isSupportedLocale(request.locale)) {
    return { status: "not-found" };
  }

  const routeFamily = resolveRouteFamily(definition, request.routeFamilyKey);

  if (!routeFamily || !definition.screens[request.screen]) {
    return { status: "not-found" };
  }

  if (
    request.permissions &&
    !hasScreenPermission(definition, request.screen, request.permissions)
  ) {
    return { status: "forbidden" };
  }

  const requiresIdentifier =
    request.screen === "detail" || request.screen === "edit";
  const identifier = requiresIdentifier
    ? request.id
      ? definition.identifierAdapter.parse(request.id)
      : undefined
    : undefined;

  if (requiresIdentifier && (!identifier || !identifier.ok)) {
    return { status: "not-found" };
  }

  const parentId =
    request.screen === "list" && request.parentId
      ? definition.identifierAdapter.parse(request.parentId)
      : undefined;

  if (parentId && !parentId.ok) {
    return { status: "not-found" };
  }

  return {
    status: "ready",
    definition,
    routeFamily,
    screen: request.screen,
    locale: request.locale,
    ...(identifier?.ok ? { identifier: identifier.value } : {}),
    ...(parentId?.ok ? { parentId: parentId.value } : {}),
  };
}
