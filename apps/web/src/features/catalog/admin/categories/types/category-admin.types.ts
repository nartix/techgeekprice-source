import type {
  AdminCategoryBreadcrumbItemDto,
  AdminCategoryCapabilityDto,
  AdminCategoryListItemDto,
} from "@tgp/contracts";

import type { AdminCategoryListingConfig } from "../admin-category-listing.config";
import type { DeepReadonly } from "../category-system/category-system.types";

export type { AdminCategoryListingConfig };

export type AdminLocale = "en-CA" | "en-US" | "fr-CA";

export type CategoryAdminSortField =
  | "id"
  | "parentId"
  | "name"
  | "slug"
  | "sortRank"
  | "active"
  | "updatedAt"
  | "createdAt";

export type CategoryAdminSortOrder = "asc" | "desc";

export interface CategoryAdminPageMetadata {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

export interface CategoryAdminListItem {
  id: string;
  parentId: string | null;
  sortRank: number | null;
  depth: number;
  hasChildren: boolean;
  name: string;
  slug: string;
  active: boolean;
  createdAtLabel: string;
  updatedAtLabel: string;
  dto: AdminCategoryListItemDto;
  [key: string]: unknown;
}

export interface CategoryAdminFormValues {
  id?: string;
  parentId: string;
  name: string;
  slug: string;
  slugManuallyEdited: boolean;
  active: boolean;
}

export interface CategoryActionRecord {
  id: string;
  parentId?: string | null;
  name: string;
  active: boolean;
}

export type CategoryListingScope =
  | {
      mode: "all";
      parentId?: undefined;
      canonicalHref: string;
      resetKey: "all";
    }
  | {
      mode: "root";
      parentId: 0;
      canonicalHref: string;
      resetKey: "root:0";
    }
  | {
      mode: "children";
      parentId: number;
      canonicalHref: string;
      resetKey: `children:${number}`;
    };

export interface CategoryListingScopeResult {
  scope: CategoryListingScope;
  invalid: boolean;
}

export interface CategoryListFilters {
  q: string;
  slug: string;
  active: "all" | "active" | "inactive";
}

export type CategoryRefineFilter = {
  field: "q" | "slug" | "active" | "parentId";
  operator: "eq" | "contains";
  value: string | number | boolean;
};

export type CategoryCapabilitiesState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | {
      status: "ready";
      capabilities: DeepReadonly<AdminCategoryCapabilityDto>;
    };

export type CategoryBreadcrumbState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "not-found"; error: unknown }
  | { status: "ready"; items: AdminCategoryBreadcrumbItemDto[] };
