import type { SpringPageResponseDto } from "@tgp/contracts";

import { AdminApiClientError } from "../api-client-error";
import type { AdminFetchOptions } from "../admin/adminFetch";
import { adminOpenApiRequest } from "../admin/adminOpenApiDispatch";

export type AdminDataProviderBaseKey = string | number;

export interface AdminDataProviderBaseRecord {
  id?: AdminDataProviderBaseKey;
  [key: string]: unknown;
}

export interface AdminCrudSort {
  field: string;
  order: "asc" | "desc";
}

export interface AdminLogicalFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface AdminConditionalFilter {
  operator: "or" | "and";
  value: Array<AdminLogicalFilter | AdminConditionalFilter>;
}

export type AdminCrudFilter = AdminLogicalFilter | AdminConditionalFilter;

export interface AdminSpringResourceConfig {
  name: string;
  apiPath: `/api/v1/${string}`;
}

export interface AdminSpringDataProviderOptions {
  baseUrl: string | URL;
  resources: AdminSpringResourceConfig[];
  fetcher?: typeof fetch;
  defaultPageSize?: number;
  maxPageSize?: number;
}

export interface AdminGetListParams {
  meta?: { signal?: AbortSignal };
  resource: string;
  pagination?: {
    currentPage?: number;
    pageSize?: number;
  };
  sorters?: AdminCrudSort[];
  filters?: AdminCrudFilter[];
}

export interface AdminGetOneParams {
  meta?: { signal?: AbortSignal };
  resource: string;
  id: AdminDataProviderBaseKey;
}

export interface AdminCreateParams<TVariables = unknown> {
  meta?: { signal?: AbortSignal };
  resource: string;
  variables: TVariables;
}

export interface AdminUpdateParams<TVariables = unknown> {
  meta?: { signal?: AbortSignal };
  resource: string;
  id: AdminDataProviderBaseKey;
  variables: TVariables;
}

export interface AdminDeleteOneParams<TVariables = unknown> {
  meta?: { signal?: AbortSignal };
  resource: string;
  id: AdminDataProviderBaseKey;
  variables?: TVariables;
}

export interface AdminCustomParams<
  TQuery = Record<string, unknown>,
  TPayload = unknown,
> {
  url: string;
  method: "get" | "delete" | "head" | "options" | "post" | "put" | "patch";
  query?: TQuery;
  payload?: TPayload;
  meta?: {
    signal?: AbortSignal;
  };
}

export interface AdminGetListResponse<TData> {
  data: TData[];
  total: number;
  page?: SpringPageResponseDto<TData>["page"];
  links?: SpringPageResponseDto<TData>["links"];
}

export interface AdminRecordResponse<TData> {
  data: TData;
}

export interface AdminSpringDataProvider {
  getApiUrl(): string;
  getList<
    TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
  >(
    params: AdminGetListParams,
  ): Promise<AdminGetListResponse<TData>>;
  getOne<
    TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
  >(
    params: AdminGetOneParams,
  ): Promise<AdminRecordResponse<TData>>;
  create<
    TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
    TVariables = unknown,
  >(
    params: AdminCreateParams<TVariables>,
  ): Promise<AdminRecordResponse<TData>>;
  update<
    TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
    TVariables = unknown,
  >(
    params: AdminUpdateParams<TVariables>,
  ): Promise<AdminRecordResponse<TData>>;
  deleteOne<
    TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
    TVariables = unknown,
  >(
    params: AdminDeleteOneParams<TVariables>,
  ): Promise<AdminRecordResponse<TData>>;
  custom<
    TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
    TQuery = Record<string, unknown>,
    TPayload = unknown,
  >(
    params: AdminCustomParams<TQuery, TPayload>,
  ): Promise<AdminRecordResponse<TData>>;
}

export function adminSpringDataProvider(
  options: AdminSpringDataProviderOptions,
): AdminSpringDataProvider {
  const defaultPageSize = options.defaultPageSize ?? 20;
  const maxPageSize = options.maxPageSize ?? 100;
  const resourcesByName = new Map(
    options.resources.map((resource) => [resource.name, resource]),
  );

  function getResource(resourceName: string): AdminSpringResourceConfig {
    const resource = resourcesByName.get(resourceName);

    if (!resource) {
      throw new AdminApiClientError({
        code: "api_client.admin.path_forbidden",
        message: `Unknown admin resource: ${resourceName}`,
      });
    }

    return resource;
  }

  function fetchJson<TResponse>(
    path: string,
    init?: Omit<AdminFetchOptions, "baseUrl" | "fetcher">,
  ) {
    return adminOpenApiRequest<TResponse>(path, {
      ...init,
      baseUrl: options.baseUrl,
      fetcher: options.fetcher,
    });
  }

  return {
    getApiUrl() {
      return String(options.baseUrl);
    },
    async getList<
      TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
    >(params: AdminGetListParams): Promise<AdminGetListResponse<TData>> {
      const resource = getResource(params.resource);
      const pageSize = params.pagination?.pageSize ?? defaultPageSize;

      if (pageSize > maxPageSize) {
        throw new AdminApiClientError({
          code: "api_client.admin.page_size_exceeded",
          message: `Admin page size must not exceed ${maxPageSize}.`,
          details: { pageSize, maxPageSize },
        });
      }

      const currentPage = params.pagination?.currentPage ?? 1;
      const query = new URLSearchParams({
        page: String(Math.max(currentPage - 1, 0)),
        size: String(pageSize),
      });

      for (const sorter of params.sorters ?? []) {
        query.append("sort", `${sorter.field},${sorter.order}`);
      }

      appendFilters(query, params.filters);

      const response = await fetchJson<SpringPageResponseDto<TData>>(
        `${resource.apiPath}?${query.toString()}`,
        { signal: params.meta?.signal },
      );

      return {
        data: response.data,
        total: response.page.totalElements,
        page: response.page,
        links: response.links,
      };
    },
    async getOne<
      TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
    >(params: AdminGetOneParams): Promise<AdminRecordResponse<TData>> {
      const resource = getResource(params.resource);
      const data = await fetchJson<TData>(`${resource.apiPath}/${params.id}`, {
        signal: params.meta?.signal,
      });
      return { data };
    },
    async create<
      TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
      TVariables = unknown,
    >(
      params: AdminCreateParams<TVariables>,
    ): Promise<AdminRecordResponse<TData>> {
      const resource = getResource(params.resource);
      const data = await fetchJson<TData>(resource.apiPath, {
        method: "POST",
        signal: params.meta?.signal,
        body: params.variables as AdminFetchOptions["body"],
      });
      return { data };
    },
    async update<
      TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
      TVariables = unknown,
    >(
      params: AdminUpdateParams<TVariables>,
    ): Promise<AdminRecordResponse<TData>> {
      const resource = getResource(params.resource);
      const data = await fetchJson<TData>(`${resource.apiPath}/${params.id}`, {
        method: "PUT",
        signal: params.meta?.signal,
        body: params.variables as AdminFetchOptions["body"],
      });
      return { data };
    },
    async deleteOne<
      TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
      TVariables = unknown,
    >(
      params: AdminDeleteOneParams<TVariables>,
    ): Promise<AdminRecordResponse<TData>> {
      const resource = getResource(params.resource);
      const data = await fetchJson<TData>(`${resource.apiPath}/${params.id}`, {
        method: "DELETE",
        signal: params.meta?.signal,
        body: params.variables as AdminFetchOptions["body"],
      });
      return { data };
    },
    async custom<
      TData extends AdminDataProviderBaseRecord = AdminDataProviderBaseRecord,
      TQuery = Record<string, unknown>,
      TPayload = unknown,
    >(
      params: AdminCustomParams<TQuery, TPayload>,
    ): Promise<AdminRecordResponse<TData>> {
      const query = params.query ? toSearchParams(params.query) : "";
      const path = query ? `${params.url}?${query}` : params.url;
      const data = await fetchJson<TData>(path, {
        method: params.method.toUpperCase(),
        body: params.payload as AdminFetchOptions["body"],
        signal: params.meta?.signal,
      });
      return { data };
    },
  };
}

function appendFilters(
  query: URLSearchParams,
  filters: AdminCrudFilter[] | undefined,
): void {
  if (!filters || filters.length === 0) {
    return;
  }

  for (const filter of filters) {
    appendFilter(query, filter);
  }
}

function appendFilter(query: URLSearchParams, filter: AdminCrudFilter): void {
  if (isConditionalFilter(filter)) {
    if (filter.operator !== "and") {
      throwUnsupportedFilter(filter);
    }

    for (const childFilter of filter.value) {
      appendFilter(query, childFilter);
    }

    return;
  }

  if (filter.operator !== "eq" && filter.operator !== "contains") {
    throwUnsupportedFilter(filter);
  }

  appendQueryValue(query, filter.field, filter.value);
}

function appendQueryValue(
  query: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryValue(query, key, item);
    }
    return;
  }

  query.append(key, String(value));
}

function isConditionalFilter(
  filter: AdminCrudFilter,
): filter is AdminConditionalFilter {
  return (
    "value" in filter &&
    Array.isArray(filter.value) &&
    (filter.operator === "and" || filter.operator === "or")
  );
}

function throwUnsupportedFilter(filter: AdminCrudFilter): never {
  throw new AdminApiClientError({
    code: "api_client.admin.unsupported_filter",
    message: "Admin resource filter is not supported by the Spring API client.",
    details: { filter },
  });
}

function toSearchParams(query: unknown): string {
  const params = new URLSearchParams();

  if (!query || typeof query !== "object") {
    return params.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}
