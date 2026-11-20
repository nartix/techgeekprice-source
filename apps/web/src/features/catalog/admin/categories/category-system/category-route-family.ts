import type {
  CategoryRouteFamilyDefinition,
  CategoryRouteFamilyKey,
  CategorySystemDefinition,
} from "./category-system.types";

export interface CategoryRouteFamily {
  readonly definition: CategoryRouteFamilyDefinition;
  list(): string;
  tree(): string;
  create(): string;
  detail(id: string | number): string;
  edit(id: string | number): string;
  children(id: string | number): string;
}

function getRouteFamilyDefinition(
  definition: CategorySystemDefinition<string>,
  routeFamilyKey: CategoryRouteFamilyKey,
): CategoryRouteFamilyDefinition {
  const routeFamily = [
    definition.routeFamilies.generic,
    ...definition.routeFamilies.aliases,
  ].find((candidate) => candidate.key === routeFamilyKey);

  if (!routeFamily) {
    throw new TypeError("unknown-route-family");
  }

  return routeFamily;
}

function serializeIdentifier(
  definition: CategorySystemDefinition<string>,
  id: string | number,
): string {
  const parsed =
    typeof id === "number"
      ? { ok: true as const, value: id }
      : definition.identifierAdapter.parse(id);

  if (!parsed.ok) {
    throw new TypeError("invalid-identifier");
  }

  const serialized = definition.identifierAdapter.serialize(parsed.value);

  if (!serialized.ok) {
    throw new TypeError("invalid-identifier");
  }

  return serialized.value;
}

export function createCategoryRouteFamily(
  definition: CategorySystemDefinition<string>,
  routeFamilyKey: CategoryRouteFamilyKey,
): CategoryRouteFamily {
  const routeFamily = getRouteFamilyDefinition(definition, routeFamilyKey);
  const basePath = routeFamily.basePath;

  return Object.freeze({
    definition: routeFamily,
    list: () => basePath,
    tree: () => `${basePath}/tree`,
    create: () => `${basePath}/create`,
    detail: (id: string | number) =>
      `${basePath}/${serializeIdentifier(definition, id)}`,
    edit: (id: string | number) =>
      `${basePath}/${serializeIdentifier(definition, id)}/edit`,
    children: (id: string | number) =>
      `${basePath}?parentId=${serializeIdentifier(definition, id)}`,
  });
}
