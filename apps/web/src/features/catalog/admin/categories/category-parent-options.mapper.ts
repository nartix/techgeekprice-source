import type { AdminCategoryParentOptionDto } from "@tgp/contracts";
import {
  CursorHierarchyInvalidResponseError,
  type CursorHierarchyOption,
  type CursorHierarchySlice,
} from "@tgp/admin-ui/inputs/hierarchy-picker";

import {
  CATEGORY_PARENT_ROOT_VALUE,
  type CategoryParentOptionSource,
  type CategoryParentUiOption,
} from "./types/category-parent-options.types";

export function createRootCategoryParentOption(
  label: string,
): CategoryParentUiOption {
  return {
    disabled: false,
    disabledReason: null,
    label,
    source: "root",
    value: CATEGORY_PARENT_ROOT_VALUE,
  };
}

export function mapCategoryParentOptionDto(
  dto: AdminCategoryParentOptionDto,
  source: CategoryParentOptionSource = "remote",
): CategoryParentUiOption {
  return {
    disabled: !dto.selectable || dto.disabledReason === "INACTIVE",
    disabledReason: dto.disabledReason,
    dto,
    label: dto.label,
    slug: dto.slug,
    source,
    value: String(dto.id),
  };
}

export function mapCategoryParentOptionDtos(
  dtos: AdminCategoryParentOptionDto[],
  source: CategoryParentOptionSource = "remote",
): CategoryParentUiOption[] {
  return dtos.map((dto) => mapCategoryParentOptionDto(dto, source));
}

export function composeCategoryParentOptions(args: {
  rootOption: CategoryParentUiOption;
  selectedOption?: CategoryParentUiOption | null;
  remoteOptions: CategoryParentUiOption[];
}): CategoryParentUiOption[] {
  const options: CategoryParentUiOption[] = [args.rootOption];
  const seenValues = new Set([args.rootOption.value]);

  if (args.selectedOption && !seenValues.has(args.selectedOption.value)) {
    options.push(args.selectedOption);
    seenValues.add(args.selectedOption.value);
  }

  for (const option of args.remoteOptions) {
    if (seenValues.has(option.value)) {
      continue;
    }

    options.push(option);
    seenValues.add(option.value);
  }

  return options;
}

export function mergeRemoteCategoryParentOptions(
  currentOptions: CategoryParentUiOption[],
  nextOptions: CategoryParentUiOption[],
): CategoryParentUiOption[] {
  const merged = [...currentOptions];
  const seenValues = new Set(currentOptions.map((option) => option.value));

  for (const option of nextOptions) {
    if (seenValues.has(option.value)) {
      continue;
    }

    merged.push(option);
    seenValues.add(option.value);
  }

  return merged;
}

export function findSelectedCategoryParentOption(args: {
  dtos: AdminCategoryParentOptionDto[];
  selectedParentId: number | null;
}): CategoryParentUiOption | null {
  if (args.selectedParentId == null) {
    return null;
  }

  const dto = args.dtos.find((option) => option.id === args.selectedParentId);

  return dto ? mapCategoryParentOptionDto(dto, "selected") : null;
}

export function mapRemoteCategoryParentOptions(args: {
  dtos: AdminCategoryParentOptionDto[];
  selectedParentId: number | null;
}): CategoryParentUiOption[] {
  return args.dtos
    .filter((option) => option.id !== args.selectedParentId)
    .map((option) => mapCategoryParentOptionDto(option, "remote"));
}

/** Maps the catalogue transport contract into the generic picker contract. */
export function mapCategoryParentOptionSlice(
  value: unknown,
  selectedParentId: number | null,
): CursorHierarchySlice {
  if (!isCategoryParentOptionSlice(value)) {
    throw new CursorHierarchyInvalidResponseError(value);
  }

  return {
    hasMore: value.hasMore,
    nextCursor: value.nextCursor,
    options: value.data.map((dto) => {
      const option = mapCategoryParentOptionDto(
        dto,
        dto.id === selectedParentId ? "selected" : "remote",
      );

      return mapCategoryParentUiOption(option);
    }),
  };
}

export function mapCategoryParentUiOption(
  option: CategoryParentUiOption,
): CursorHierarchyOption {
  return {
    disabled: option.disabled,
    id: option.value,
    label: option.label,
    metadata: option,
    source: option.source,
  };
}

export function getCategoryParentUiOption(
  option: CursorHierarchyOption,
): CategoryParentUiOption {
  if (isCategoryParentUiOption(option.metadata)) {
    return option.metadata;
  }

  return {
    disabled: Boolean(option.disabled),
    disabledReason: null,
    label: option.label,
    source: option.source,
    value: option.id,
  };
}

function isCategoryParentOptionSlice(
  value: unknown,
): value is {
  data: AdminCategoryParentOptionDto[];
  hasMore: boolean;
  nextCursor: string | null;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const slice = value as Record<string, unknown>;
  return (
    Array.isArray(slice.data) &&
    slice.data.every(isCategoryParentOptionDto) &&
    typeof slice.hasMore === "boolean" &&
    (slice.nextCursor === null || typeof slice.nextCursor === "string")
  );
}

function isCategoryParentOptionDto(
  value: unknown,
): value is AdminCategoryParentOptionDto {
  if (!value || typeof value !== "object") {
    return false;
  }

  const option = value as Record<string, unknown>;
  return (
    typeof option.id === "number" &&
    Number.isSafeInteger(option.id) &&
    typeof option.label === "string" &&
    typeof option.selectable === "boolean" &&
    (option.disabledReason === null || typeof option.disabledReason === "string")
  );
}

function isCategoryParentUiOption(
  value: unknown,
): value is CategoryParentUiOption {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "value" in value && "label" in value && "source" in value;
}
