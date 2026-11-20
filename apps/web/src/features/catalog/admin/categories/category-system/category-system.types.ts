import type {
  AdminCategoryCapabilitiesDto,
  AdminCategoryIdentifierProfile,
  AdminCategoryOperation,
} from "@tgp/contracts";

import type { CategoryIdentifierAdapter } from "./category-identifier-adapter";

export type DeepReadonly<TValue> = TValue extends (...args: never[]) => unknown
  ? TValue
  : TValue extends readonly (infer TItem)[]
    ? readonly DeepReadonly<TItem>[]
    : TValue extends object
      ? { readonly [TKey in keyof TValue]: DeepReadonly<TValue[TKey]> }
      : TValue;

export interface CategoryCapabilityIdentity {
  readonly systemKey: string;
  readonly apiBasePath: `/api/v1/admin/category-systems/${string}/categories`;
}

export type AdminCategoryCapabilityState =
  | {
      readonly status: "loading";
      readonly identity: CategoryCapabilityIdentity;
    }
  | {
      readonly status: "ready";
      readonly identity: CategoryCapabilityIdentity;
      readonly capabilities: DeepReadonly<AdminCategoryCapabilitiesDto>;
    }
  | {
      readonly status: "error";
      readonly identity: CategoryCapabilityIdentity;
      readonly error: unknown;
    };

export type CategoryScreen = "list" | "tree" | "create" | "detail" | "edit";

export type CategoryNavigationGroup = "products";

export type CategoryNavigationIcon = "productCategories";

export type CategoryRouteFamilyKey = "generic" | "product-categories";

export type CategoryRouteFamilyKind = "generic" | "alias";

export type CategoryTranslationNamespace =
  | "Admin.ProductCategories"
  | "Admin.CategoryShell";

export interface CategorySystemRoutes {
  readonly base: `/admin/${string}`;
  readonly list: string;
  readonly tree: string;
  readonly create: string;
  readonly detail: (id: string | number) => string;
  readonly edit: (id: string | number) => string;
  readonly children: (id: string | number) => string;
}

export interface CategoryRouteFamilyDefinition {
  readonly key: CategoryRouteFamilyKey;
  readonly kind: CategoryRouteFamilyKind;
  readonly basePath: `/admin/${string}`;
}

export interface CategorySystemPresentation {
  readonly sectionKey: CategoryNavigationGroup;
  readonly labelKey: "Admin.Navigation.productCategories";
  readonly metadataKey: "Admin.Metadata.productCategoriesTitle";
  readonly translationNamespace: "Admin.ProductCategories";
}

export interface CategorySystemNavigation {
  readonly group: CategoryNavigationGroup;
  readonly icon: CategoryNavigationIcon;
  readonly labelKey: "Admin.Navigation.productCategories";
  readonly listPermission: string;
}

export interface CategorySystemRouteFamilies {
  readonly generic: CategoryRouteFamilyDefinition;
  readonly aliases: readonly CategoryRouteFamilyDefinition[];
  readonly preferred: CategoryRouteFamilyKey;
}

export interface CategorySystemDefinition<
  TResource extends string = "productCategories",
> {
  readonly systemKey: string;
  readonly resource: TResource;
  readonly apiBasePath: `/api/v1/admin/category-systems/${string}/categories`;
  /** Temporary alias-only API; generic composition uses a resolved family. */
  readonly routes: CategorySystemRoutes;
  readonly routeFamilies: CategorySystemRouteFamilies;
  readonly presentation: CategorySystemPresentation;
  readonly navigation: CategorySystemNavigation;
  readonly identifierProfile: AdminCategoryIdentifierProfile;
  readonly identifierAdapter: CategoryIdentifierAdapter<number>;
  readonly rootModel: "IMPLICIT_NULL_PARENT";
  readonly preferredLimits: Readonly<{
    parentOptionPageSize?: number;
    treeSize?: number;
  }>;
  readonly declaredOperations: readonly AdminCategoryOperation[];
  readonly visibleOperations: readonly AdminCategoryOperation[];
  readonly operationPermissions: Readonly<
    Record<AdminCategoryOperation, string>
  >;
  readonly strictPermissions: true;
  readonly screens: Readonly<Record<CategoryScreen, boolean>>;
}

export interface CategorySystemResourceProjection {
  readonly resource: string;
  readonly routeFamily: CategoryRouteFamilyKey;
  readonly apiBasePath: `/api/v1/admin/category-systems/${string}/categories`;
  readonly group: CategoryNavigationGroup;
  readonly icon: CategoryNavigationIcon;
  readonly labelKey: "Admin.Navigation.productCategories";
  readonly strictPermissions: true;
  readonly operationPermissions: Readonly<
    Partial<Record<AdminCategoryOperation, string>>
  >;
}

export interface CategorySystemNavigationProjection {
  readonly resource: string;
  readonly routeFamily: CategoryRouteFamilyKey;
  readonly listPath: string;
  readonly group: CategoryNavigationGroup;
  readonly icon: CategoryNavigationIcon;
  readonly labelKey: "Admin.Navigation.productCategories";
  readonly listPermission: string;
}

export interface CategorySystemRegistry<TResource extends string = "productCategories"> {
  getBySystemKey(systemKey: string): CategorySystemDefinition<TResource> | undefined;
  getByResource(resource: string): CategorySystemDefinition<TResource> | undefined;
  getRouteFamily(
    systemKey: string,
    routeFamilyKey: CategoryRouteFamilyKey,
  ): CategoryRouteFamilyDefinition | undefined;
  list(): readonly CategorySystemDefinition<TResource>[];
  projectResources(): readonly CategorySystemResourceProjection[];
  projectNavigation(): readonly CategorySystemNavigationProjection[];
}
