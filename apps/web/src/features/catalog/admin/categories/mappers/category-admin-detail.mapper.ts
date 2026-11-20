import type { AdminCategoryDetailDto } from "@tgp/contracts";

import type { AdminLocale } from "../types/category-admin.types";
import type { CategoryAdminDetailViewModel } from "../types/category-admin-detail.types";

export function mapCategoryDtoToDetailViewModel(
  category: AdminCategoryDetailDto,
  locale: AdminLocale,
): CategoryAdminDetailViewModel {
  return {
    id: String(category.id),
    parentId: category.parentId == null ? null : String(category.parentId),
    name: category.name,
    slug: category.slug,
    active: category.active,
    createdAtLabel: formatDate(category.createdAt, locale),
    updatedAtLabel: formatDate(category.updatedAt, locale),
  };
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
