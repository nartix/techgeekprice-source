import type { components } from "../generated/spring";

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryListItemDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryListItemResponse"],
      | "id"
      | "parentId"
      | "sortRank"
      | "depth"
      | "hasChildren"
      | "name"
      | "slug"
      | "active"
      | "createdAt"
      | "updatedAt"
    >
  >,
  "parentId" | "sortRank"
> & {
  parentId?: NonNullable<
    components["schemas"]["AdminCategoryListItemResponse"]["parentId"]
  > | null;
  sortRank?: NonNullable<
    components["schemas"]["AdminCategoryListItemResponse"]["sortRank"]
  > | null;
};

export type AdminCategoryTreeItemDto = AdminCategoryListItemDto;

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryDetailDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryDetailResponse"],
      | "id"
      | "parentId"
      | "sortRank"
      | "name"
      | "slug"
      | "active"
      | "createdAt"
      | "updatedAt"
    >
  >,
  "parentId" | "sortRank"
> & {
  parentId?: NonNullable<
    components["schemas"]["AdminCategoryDetailResponse"]["parentId"]
  > | null;
  sortRank?: NonNullable<
    components["schemas"]["AdminCategoryDetailResponse"]["sortRank"]
  > | null;
};

export type AdminCategoryDto = AdminCategoryListItemDto;

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryBreadcrumbItemDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryBreadcrumbItemResponse"],
      | "id"
      | "parentId"
      | "sortRank"
      | "depth"
      | "name"
      | "slug"
      | "active"
      | "createdAt"
      | "updatedAt"
    >
  >,
  "parentId" | "sortRank"
> & {
  parentId?: NonNullable<
    components["schemas"]["AdminCategoryBreadcrumbItemResponse"]["parentId"]
  > | null;
  sortRank?: NonNullable<
    components["schemas"]["AdminCategoryBreadcrumbItemResponse"]["sortRank"]
  > | null;
};

export type AdminCategoryParentOptionDisabledReason =
  | "INACTIVE"
  | string
  | null;

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryParentOptionDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryParentOptionResponse"],
      | "id"
      | "parentId"
      | "name"
      | "slug"
      | "active"
      | "depth"
      | "label"
      | "path"
      | "selectable"
      | "disabledReason"
    >
  >,
  "parentId" | "path" | "disabledReason"
> & {
  parentId: NonNullable<
    components["schemas"]["AdminCategoryParentOptionResponse"]["parentId"]
  > | null;
  path: AdminCategoryBreadcrumbItemDto[];
  disabledReason: AdminCategoryParentOptionDisabledReason;
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryParentOptionSliceDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryParentOptionSliceResponse"],
      "data" | "hasMore" | "nextCursor"
    >
  >,
  "data" | "nextCursor"
> & {
  data: AdminCategoryParentOptionDto[];
  nextCursor: NonNullable<
    components["schemas"]["AdminCategoryParentOptionSliceResponse"]["nextCursor"]
  > | null;
};

export type AdminCategoryOperation =
  | "capabilities"
  | "list"
  | "tree"
  | "parent-options"
  | "get"
  | "breadcrumb"
  | "create"
  | "replace"
  | "patch"
  | "delete"
  | "move"
  | "reorder"
  | "activate"
  | "deactivate";

export type AdminCategoryPlacementMode =
  | "APPEND"
  | "BEFORE_ID"
  | "AFTER_ID"
  | "TARGET_INDEX";

export type AdminCategoryLogicalField =
  | "identifier"
  | "parent"
  | "name"
  | "slug"
  | "active"
  | "created-at"
  | "updated-at"
  | "rank"
  | "hierarchy-context";

export type AdminCategoryPublicProperty =
  | "id"
  | "parentId"
  | "name"
  | "slug"
  | "active"
  | "createdAt"
  | "updatedAt"
  | "sortRank";

export type AdminCategoryLifecycleState = "ACTIVE" | "INACTIVE";
export type AdminCategoryLifecycleAction = "activate" | "deactivate";
export type AdminCategoryIdentifierProfile = "NUMERIC_LONG_V1";
export type AdminCategoryHierarchyRootModel = "IMPLICIT_NULL_PARENT";
export type AdminCategorySortDirection = "ASC" | "DESC";

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryFallbackOrderDto = Omit<
  Required<
    Pick<
      components["schemas"]["FallbackOrderResponse"],
      "property" | "direction"
    >
  >,
  "property" | "direction"
> & {
  property: AdminCategoryPublicProperty;
  direction: AdminCategorySortDirection;
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryHierarchyCapabilityDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryHierarchyCapabilityResponse"],
      "enabled" | "readOperations" | "mutationOperations" | "rootModel"
    >
  >,
  "readOperations" | "mutationOperations" | "rootModel"
> & {
  readOperations: AdminCategoryOperation[];
  mutationOperations: AdminCategoryOperation[];
  rootModel: AdminCategoryHierarchyRootModel | null;
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryOperationalLimitsDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryOperationalLimitsResponse"],
      | "pageSize"
      | "searchInputLength"
      | "filterSelections"
      | "sortSelections"
      | "treeSize"
      | "parentOptionPageSize"
      | "includeIdCount"
      | "hierarchyDepth"
    >
  >,
  | "pageSize"
  | "searchInputLength"
  | "filterSelections"
  | "sortSelections"
  | "treeSize"
  | "parentOptionPageSize"
  | "includeIdCount"
  | "hierarchyDepth"
> & {
  pageSize: NonNullable<
    components["schemas"]["AdminCategoryOperationalLimitsResponse"]["pageSize"]
  > | null;
  searchInputLength: NonNullable<
    components["schemas"]["AdminCategoryOperationalLimitsResponse"]["searchInputLength"]
  > | null;
  filterSelections: NonNullable<
    components["schemas"]["AdminCategoryOperationalLimitsResponse"]["filterSelections"]
  > | null;
  sortSelections: NonNullable<
    components["schemas"]["AdminCategoryOperationalLimitsResponse"]["sortSelections"]
  > | null;
  treeSize: NonNullable<
    components["schemas"]["AdminCategoryOperationalLimitsResponse"]["treeSize"]
  > | null;
  parentOptionPageSize: NonNullable<
    components["schemas"]["AdminCategoryOperationalLimitsResponse"]["parentOptionPageSize"]
  > | null;
  includeIdCount: NonNullable<
    components["schemas"]["AdminCategoryOperationalLimitsResponse"]["includeIdCount"]
  > | null;
  hierarchyDepth: NonNullable<
    components["schemas"]["AdminCategoryOperationalLimitsResponse"]["hierarchyDepth"]
  > | null;
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryLifecycleCapabilityDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryLifecycleCapabilityResponse"],
      "enabled" | "states" | "actions"
    >
  >,
  "states" | "actions"
> & {
  states: AdminCategoryLifecycleState[];
  actions: AdminCategoryLifecycleAction[];
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryOrderingCapabilityDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryOrderingCapabilityResponse"],
      | "orderingEnabled"
      | "rankingEnabled"
      | "rankExposed"
      | "reorderSupported"
      | "placementModes"
      | "fallbackOrder"
    >
  >,
  "placementModes" | "fallbackOrder"
> & {
  placementModes: AdminCategoryPlacementMode[];
  fallbackOrder: AdminCategoryFallbackOrderDto[];
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryCapabilityDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryCapabilityResponse"],
      | "rankingEnabled"
      | "placementModes"
      | "sortRankExposed"
      | "fallbackOrder"
      | "supportedOperations"
      | "hierarchy"
      | "limits"
      | "lifecycle"
      | "identifierProfile"
      | "fields"
      | "searchableFields"
      | "allowedFilters"
      | "allowedSorts"
      | "ordering"
    >
  >,
  | "placementModes"
  | "fallbackOrder"
  | "supportedOperations"
  | "hierarchy"
  | "limits"
  | "lifecycle"
  | "identifierProfile"
  | "fields"
  | "searchableFields"
  | "allowedFilters"
  | "allowedSorts"
  | "ordering"
> & {
  placementModes: AdminCategoryPlacementMode[];
  fallbackOrder: AdminCategoryFallbackOrderDto[];
  supportedOperations: AdminCategoryOperation[];
  hierarchy: AdminCategoryHierarchyCapabilityDto;
  limits: AdminCategoryOperationalLimitsDto;
  lifecycle: AdminCategoryLifecycleCapabilityDto;
  identifierProfile: AdminCategoryIdentifierProfile;
  fields: AdminCategoryLogicalField[];
  searchableFields: AdminCategoryLogicalField[];
  allowedFilters: AdminCategoryLogicalField[];
  allowedSorts: AdminCategoryLogicalField[];
  ordering: AdminCategoryOrderingCapabilityDto;
};

export type AdminCategoryCapabilitiesDto = AdminCategoryCapabilityDto;

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryCreateDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryCreateRequest"],
      | "parentId"
      | "beforeId"
      | "afterId"
      | "targetIndex"
      | "name"
      | "slug"
      | "active"
    >
  >,
  "parentId" | "beforeId" | "afterId" | "targetIndex" | "active"
> & {
  parentId?: NonNullable<
    components["schemas"]["AdminCategoryCreateRequest"]["parentId"]
  > | null;
  beforeId?: NonNullable<
    components["schemas"]["AdminCategoryCreateRequest"]["beforeId"]
  > | null;
  afterId?: NonNullable<
    components["schemas"]["AdminCategoryCreateRequest"]["afterId"]
  > | null;
  targetIndex?: NonNullable<
    components["schemas"]["AdminCategoryCreateRequest"]["targetIndex"]
  > | null;
  active?: NonNullable<
    components["schemas"]["AdminCategoryCreateRequest"]["active"]
  > | null;
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryUpdateDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryUpdateRequest"],
      "parentId" | "name" | "slug" | "active"
    >
  >,
  "parentId"
> & {
  parentId?: NonNullable<
    components["schemas"]["AdminCategoryUpdateRequest"]["parentId"]
  > | null;
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryMoveDto = Omit<
  Required<
    Pick<components["schemas"]["AdminCategoryMoveRequest"], "newParentId">
  >,
  "newParentId"
> & {
  newParentId?: NonNullable<
    components["schemas"]["AdminCategoryMoveRequest"]["newParentId"]
  > | null;
};

/** Generated fields with documented compatibility refinements; see openapi/README.md. */
export type AdminCategoryReorderDto = Omit<
  Required<
    Pick<
      components["schemas"]["AdminCategoryReorderRequest"],
      "parentId" | "beforeId" | "afterId" | "targetIndex"
    >
  >,
  "parentId" | "beforeId" | "afterId" | "targetIndex"
> & {
  parentId?: NonNullable<
    components["schemas"]["AdminCategoryReorderRequest"]["parentId"]
  > | null;
  beforeId?: NonNullable<
    components["schemas"]["AdminCategoryReorderRequest"]["beforeId"]
  > | null;
  afterId?: NonNullable<
    components["schemas"]["AdminCategoryReorderRequest"]["afterId"]
  > | null;
  targetIndex?: NonNullable<
    components["schemas"]["AdminCategoryReorderRequest"]["targetIndex"]
  > | null;
};

export type AdminCategoryMutationDto = AdminCategoryUpdateDto;

type AssertAssignable<TValue extends TTarget, TTarget> = true;
type IsExact<TLeft, TRight> =
  (<TValue>() => TValue extends TLeft ? 1 : 2) extends <
    TValue,
  >() => TValue extends TRight ? 1 : 2
    ? true
    : false;
type AssertFalse<TValue extends false> = TValue;

type _AdminCategoryDtoAliasCompatibility = AssertAssignable<
  AdminCategoryDto,
  AdminCategoryListItemDto
>;
type _AdminCategoryCapabilitiesAliasCompatibility = AssertAssignable<
  AdminCategoryCapabilitiesDto,
  AdminCategoryCapabilityDto
>;
type _AdminCategoryMutationAliasCompatibility = AssertAssignable<
  AdminCategoryMutationDto,
  AdminCategoryUpdateDto
>;
type _AdminCategoryDetailStaysDistinct = AssertFalse<
  IsExact<AdminCategoryDetailDto, AdminCategoryListItemDto>
>;
