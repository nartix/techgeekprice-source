export type SpringApiDto = Record<string, unknown>;

export const springApiContractsBoundary = {
  packageName: "@tgp/contracts",
  backendRepository: "nartix/spring-api-source",
} as const;

export type {
  ApiFieldErrorDto,
  ApiErrorFieldDto,
  ApiErrorPayloadDto,
  ApiErrorResponseDto,
} from "./shared/api-error.dto";
export type {
  SpringPageLinksDto,
  SpringPageMetadataDto,
  SpringPageResponseDto,
  SpringSortDto,
} from "./shared/page.dto";
export type {
  AdminCsrfTokenDto,
  AdminIdentityDto,
  AdminLoginRequestDto,
  AdminLoginResponseDto,
  AdminLogoutResponseDto,
  AdminPermissionDto,
  AdminRoleDto,
} from "./admin/auth.dto";
export type {
  AdminPermissionOptionDto,
  AdminRoleOptionDto,
} from "./admin/access-option.dto";
export type {
  AdminUserCreateDto,
  AdminUserDto,
  AdminUserMutationDto,
} from "./admin/user.dto";
export type {
  AdminProductDto,
  AdminProductIdentifierDto,
  AdminProductMutationDto,
  AdminProductPriceDto,
  AdminProductReferenceDto,
  ProductIdentifierRequestDto,
} from "./admin/product.dto";
export type {
  AdminCategoryBreadcrumbItemDto,
  AdminCategoryCapabilityDto,
  AdminCategoryCapabilitiesDto,
  AdminCategoryFallbackOrderDto,
  AdminCategoryHierarchyCapabilityDto,
  AdminCategoryHierarchyRootModel,
  AdminCategoryIdentifierProfile,
  AdminCategoryLifecycleAction,
  AdminCategoryLifecycleCapabilityDto,
  AdminCategoryLifecycleState,
  AdminCategoryLogicalField,
  AdminCategoryOperation,
  AdminCategoryOperationalLimitsDto,
  AdminCategoryOrderingCapabilityDto,
  AdminCategoryPlacementMode,
  AdminCategoryPublicProperty,
  AdminCategorySortDirection,
  AdminCategoryCreateDto,
  AdminCategoryDetailDto,
  AdminCategoryDto,
  AdminCategoryListItemDto,
  AdminCategoryMoveDto,
  AdminCategoryMutationDto,
  AdminCategoryParentOptionDisabledReason,
  AdminCategoryParentOptionDto,
  AdminCategoryParentOptionSliceDto,
  AdminCategoryReorderDto,
  AdminCategoryTreeItemDto,
  AdminCategoryUpdateDto,
} from "./admin/category.dto";

export type { paths, components, operations } from "./generated/spring";
