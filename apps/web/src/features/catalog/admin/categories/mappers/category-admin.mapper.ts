import type {
  AdminCategoryDetailDto,
  AdminCategoryDto,
  AdminCategoryMutationDto,
} from "@tgp/contracts";

import type {
  AdminLocale,
  CategoryAdminFormValues,
  CategoryAdminListItem,
} from "../types/category-admin.types";

export const emptyCategoryAdminFormValues: CategoryAdminFormValues = {
  id: undefined,
  parentId: "",
  name: "",
  slug: "",
  slugManuallyEdited: false,
  active: true,
};

export function mapCategoryDtoToListItem(
  category: AdminCategoryDto,
  locale: AdminLocale,
): CategoryAdminListItem {
  return {
    id: categoryIdToString(category.id),
    parentId: nullableCategoryIdToString(category.parentId),
    sortRank: category.sortRank ?? null,
    depth: category.depth,
    hasChildren: category.hasChildren,
    name: category.name,
    slug: category.slug,
    active: category.active,
    createdAtLabel: formatDate(category.createdAt, locale),
    updatedAtLabel: formatDate(category.updatedAt, locale),
    dto: category,
  };
}

export function mapCategoryDtoToFormValues(
  category: AdminCategoryDetailDto,
): CategoryAdminFormValues {
  return {
    id: categoryIdToString(category.id),
    parentId:
      category.parentId == null ? "" : categoryIdToString(category.parentId),
    name: category.name,
    slug: category.slug,
    slugManuallyEdited: false,
    active: category.active,
  };
}

export function mapCategoryFormValuesToMutationDto(
  values: CategoryAdminFormValues,
): AdminCategoryMutationDto {
  return {
    parentId: categoryParentIdToMutationValue(values.parentId),
    name: values.name.trim(),
    slug: values.slug.trim(),
    active: values.active,
  };
}

export function categoryParentIdToMutationValue(
  value: string | null | undefined,
): number | null {
  const trimmed = (value ?? "").trim();

  if (trimmed.length === 0) {
    return null;
  }

  const numericValue = Number(trimmed);

  if (!Number.isSafeInteger(numericValue) || numericValue < 0) {
    throw new TypeError("Category parent ID must be a numeric identifier.");
  }

  return numericValue;
}

function formatDate(value: string, locale: AdminLocale): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function categoryIdToString(value: number): string {
  return String(value);
}

function nullableCategoryIdToString(
  value: number | null | undefined,
): string | null {
  return value == null ? null : categoryIdToString(value);
}
