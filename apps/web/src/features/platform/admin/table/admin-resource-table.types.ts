import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Table as TanStackTable,
} from "@tanstack/react-table";
import type { ComponentType, ReactNode } from "react";

import type {
  AdminIdentity,
  AdminResourceMetadata,
} from "../types/admin.types";
import type { routing } from "../../../../i18n/routing";

export type AdminResourceTableResource = AdminResourceMetadata["name"];
export type AdminResourceTableLocale = (typeof routing.locales)[number];

export type AdminResourceTableSortOrder = "asc" | "desc";

export interface AdminResourceTableSort {
  field: string;
  order: AdminResourceTableSortOrder;
}

export type AdminResourceTableDefaultSort =
  | AdminResourceTableSort
  | AdminResourceTableSort[];

export interface AdminResourceTableExternalFilter {
  field: string;
  operator: "eq" | "contains";
  value: unknown;
}

export interface AdminResourceTableSortResolverContext {
  sorting: SortingState;
  defaultSort: AdminResourceTableSort[];
}

export type AdminResourceTableSortResolver = (
  context: AdminResourceTableSortResolverContext,
) => AdminResourceTableSort[];

export interface AdminResourceTablePageMetadata {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

export interface AdminResourceTableDisplayMetadata {
  page: number;
  totalPages: number;
  total: number;
  numberOfElements: number;
  outOfRange: boolean;
}

export interface AdminResourceTableLabels {
  title: string;
  description?: string;
  loading: string;
  empty: string;
  errorTitle: string;
  errorMessage: string;
  forbiddenTitle: string;
  forbiddenMessage: string;
  retry: string;
  refetching?: string;
  pageMetadata: (metadata: AdminResourceTableDisplayMetadata) => string;
  pageSizeLabel: string;
  paginationLabel: string;
  hydrationErrorTitle: string;
  hydrationErrorMessage: string;
}

export interface AdminResourceTableCreateAction {
  href: string;
  label: string;
  visible: boolean;
}

export interface AdminResourceTableMapContext {
  identity: AdminIdentity | null;
  locale: AdminResourceTableLocale;
  resource: AdminResourceTableResource;
  metadata: AdminResourceMetadata;
}

export interface AdminResourceTableHydrationContext<TDto, TRow> {
  identity: AdminIdentity | null;
  locale: AdminResourceTableLocale;
  resource: AdminResourceTableResource;
  metadata: AdminResourceMetadata;
  dtos: TDto[];
  rows: TRow[];
}

export interface AdminResourceTableDisplayContext<TRow> {
  identity: AdminIdentity | null;
  locale: AdminResourceTableLocale;
  resource: AdminResourceTableResource;
  metadata: AdminResourceMetadata;
  rows: TRow[];
}

export interface AdminResourceTableRenderContext<TRow> {
  identity: AdminIdentity | null;
  locale: AdminResourceTableLocale;
  resource: AdminResourceTableResource;
  table: TanStackTable<TRow>;
  rows: TRow[];
  page: AdminResourceTablePageMetadata;
  displayMetadata: AdminResourceTableDisplayMetadata;
  pagination: PaginationState;
  sorting: SortingState;
  labels: AdminResourceTableLabels;
  createAction?: AdminResourceTableCreateAction;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isForbidden: boolean;
  onRetry?: () => void;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
}

export interface AdminResourceTableComponents<TRow> {
  Toolbar?: ComponentType<AdminResourceTableRenderContext<TRow>>;
  AboveTable?: ComponentType<AdminResourceTableRenderContext<TRow>>;
  EmptyState?: ComponentType<AdminResourceTableRenderContext<TRow>>;
}

export interface AdminResourceTableConfig<TDto, TRow> {
  resource: AdminResourceTableResource;
  getRowId: (row: TRow) => string;
  defaultSort: AdminResourceTableDefaultSort;
  minWidth?: number;
  columns: Array<ColumnDef<TRow, unknown>>;
  mapDtoToRow: (dto: TDto, context: AdminResourceTableMapContext) => TRow;
  hydrateRows?: (
    rows: TRow[],
    context: AdminResourceTableHydrationContext<TDto, TRow>,
  ) => Promise<TRow[]> | TRow[];
  beforeDisplayRow?: (
    row: TRow,
    context: AdminResourceTableDisplayContext<TRow>,
  ) => TRow | null;
  labels: AdminResourceTableLabels;
  createAction?: AdminResourceTableCreateAction;
  components?: AdminResourceTableComponents<TRow>;
}

export type AdminResourceTableState =
  | "forbidden"
  | "loading"
  | "error"
  | "empty"
  | "ready";

export interface AdminResourceTableResult<TDto, TRow> {
  config: AdminResourceTableConfig<TDto, TRow>;
  identity: AdminIdentity | null;
  locale: AdminResourceTableLocale;
  labels: AdminResourceTableLabels;
  table: TanStackTable<TRow>;
  rows: TRow[];
  page: AdminResourceTablePageMetadata;
  displayMetadata: AdminResourceTableDisplayMetadata;
  pagination: PaginationState;
  sorting: SortingState;
  state: AdminResourceTableState;
  isLoading: boolean;
  isFetching: boolean;
  isHydrating: boolean;
  isForbidden: boolean;
  error: unknown;
  errorSource?: "list" | "hydration";
  onRetry: () => void;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
}

export interface AdminResourceTableOverrideProps<TRow> {
  context: AdminResourceTableRenderContext<TRow>;
  children?: ReactNode;
}
