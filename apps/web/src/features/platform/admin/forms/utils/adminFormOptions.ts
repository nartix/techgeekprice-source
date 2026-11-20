import type { DataProvider } from "@refinedev/core";

import type {
  AdminFieldOption,
  AdminFormOptionLoaderApi,
} from "../types/admin-form.types";

const EMPTY_ADMIN_FIELD_OPTIONS: AdminFieldOption[] = [];

export function normalizeAdminFieldOptions(
  options: AdminFieldOption[] | undefined,
): AdminFieldOption[] {
  return options ?? EMPTY_ADMIN_FIELD_OPTIONS;
}

export function preserveSelectedAdminFieldOptions(
  options: AdminFieldOption[],
  selectedValue: unknown,
): AdminFieldOption[] {
  const selectedValues = getSelectedAdminFieldOptionValues(selectedValue);

  if (selectedValues.length === 0) {
    return options;
  }

  const existingValues = new Set(options.map((option) => String(option.value)));
  let nextOptions = options;

  for (const value of selectedValues) {
    const stringValue = String(value);

    if (existingValues.has(stringValue)) {
      continue;
    }

    if (nextOptions === options) {
      nextOptions = [...options];
    }

    nextOptions.push({
      disabled: true,
      label: stringValue,
      value,
    });
    existingValues.add(stringValue);
  }

  return nextOptions;
}

export function createAdminFormOptionLoaderApi(
  dataProvider: DataProvider | undefined,
): AdminFormOptionLoaderApi {
  return {
    async loadOptions(args) {
      if (!dataProvider?.getList) {
        return [];
      }

      const response = await dataProvider.getList({
        resource: args.resource,
        ...(args.signal ? { meta: { signal: args.signal } } : {}),
        pagination: { currentPage: 1, pageSize: 50 },
        filters: toRefineFilters(args.filters, args.search),
      });

      return (response.data ?? []).map((record) =>
        recordToOption(record, args.labelField, args.valueField),
      );
    },
    async custom(args) {
      if (!dataProvider?.custom) {
        return {} as never;
      }

      const response = await dataProvider.custom({
        url: args.url,
        method: args.method ?? "get",
        query: args.query,
        payload: args.body,
        ...(args.signal ? { meta: { signal: args.signal } } : {}),
      });

      return response.data as never;
    },
  };
}

function recordToOption(
  record: Record<string, unknown>,
  labelField: string,
  valueField: string,
): AdminFieldOption {
  return {
    label: String(record[labelField] ?? record[valueField] ?? ""),
    value: String(record[valueField] ?? ""),
  };
}

function toRefineFilters(
  filters: Record<string, unknown> | undefined,
  search: string | undefined,
) {
  const refineFilters: Array<{
    field: string;
    operator: "eq" | "contains";
    value: unknown;
  }> = Object.entries(filters ?? {})
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([field, value]) => ({ field, operator: "eq" as const, value }));

  if (search) {
    refineFilters.push({
      field: "q",
      operator: "contains" as const,
      value: search,
    });
  }

  return refineFilters;
}

function getSelectedAdminFieldOptionValues(
  selectedValue: unknown,
): AdminFieldOption["value"][] {
  const values = Array.isArray(selectedValue) ? selectedValue : [selectedValue];

  return values.filter(
    (value): value is AdminFieldOption["value"] =>
      (typeof value === "string" && value.length > 0) ||
      typeof value === "number" ||
      typeof value === "boolean",
  );
}
