import type {
  AdminFieldOption,
  AdminFormOptionLoaderApi,
} from "../../../platform/admin/forms";
import { loadCategoryParentOptionSlice } from "./category-parent-options.api";
import {
  mapCategoryParentOptionDto,
} from "./category-parent-options.mapper";

interface LoadCategoryParentOptionsArgs {
  api: AdminFormOptionLoaderApi;
  excludeId?: string | number | null;
  search?: string;
}

export async function loadCategoryParentOptions({
  api,
  excludeId,
  search,
}: LoadCategoryParentOptionsArgs): Promise<AdminFieldOption[]> {
  const response = await loadCategoryParentOptionSlice({
    api,
    excludeSubtreeId: excludeId,
    q: search,
  });

  return response.data.map((option) => {
    const uiOption = mapCategoryParentOptionDto(option);

    return {
      disabled: uiOption.disabled,
      label: uiOption.label,
      meta: {
        active: option.active,
        disabledReason: option.disabledReason,
        parentId: option.parentId == null ? null : String(option.parentId),
        selectable: option.selectable,
        slug: option.slug,
      },
      value: uiOption.value,
    };
  });
}
