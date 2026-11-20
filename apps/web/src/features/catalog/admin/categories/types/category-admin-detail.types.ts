import type { AdminCategoryDetailDto } from "@tgp/contracts";

export interface CategoryAdminDetailViewModel {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  active: boolean;
  createdAtLabel: string;
  updatedAtLabel: string;
}

export interface CategoryAdminDetailActionRecord {
  id: string;
  name: string;
  active: boolean;
}

export type AdminCategoryDetailRecord = AdminCategoryDetailDto;
