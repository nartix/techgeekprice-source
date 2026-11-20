import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FieldValues } from "react-hook-form";

import type {
  AdminFieldOption,
  AdminFieldOptionState,
  AdminFormAction,
  AdminFormField,
  AdminFormOptionLoaderApi,
} from "../types/admin-form.types";
import {
  normalizeAdminFieldOptions,
  preserveSelectedAdminFieldOptions,
} from "../utils/adminFormOptions";

export function useAdminFieldOptions<TValues extends FieldValues>(args: {
  field: AdminFormField<TValues>;
  values: TValues;
  mode: AdminFormAction;
  api?: AdminFormOptionLoaderApi;
  enabled: boolean;
}): AdminFieldOptionState {
  const { api, enabled, field, mode, values } = args;
  const loadOptions = field.loadOptions;
  const fieldName = field.name;
  const preservesSelectedValues = hasAdminFieldOptions(field);
  const staticOptions = useMemo(
    () => normalizeAdminFieldOptions(field.options),
    [field.options],
  );
  const dependencyKey = getAdminFieldOptionDependencyKey(
    field.dependsOn,
    values,
  );
  const selectedValue = preservesSelectedValues
    ? getAdminFormValueByPath(values, fieldName)
    : undefined;
  const staticOptionsWithSelectedValue = useMemo(
    () => preserveSelectedAdminFieldOptions(staticOptions, selectedValue),
    [selectedValue, staticOptions],
  );
  const latestValues = useRef(values);
  const [options, setOptions] = useState(staticOptionsWithSelectedValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const requestId = useRef(0);
  const loaderSearch = getAdminFieldLoaderSearch({
    options,
    search,
    selectedValue: preservesSelectedValues ? selectedValue : undefined,
  });

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const setStableOptions = useCallback((nextOptions: AdminFieldOption[]) => {
    setOptions((currentOptions) =>
      areAdminFieldOptionsEqual(currentOptions, nextOptions)
        ? currentOptions
        : nextOptions,
    );
  }, []);

  useEffect(() => {
    latestValues.current = values;
  }, [values]);

  useEffect(() => {
    if (enabled) {
      return;
    }

    requestId.current += 1;
    setLoading(false);
    setError(null);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || loadOptions) {
      return;
    }

    setStableOptions(staticOptionsWithSelectedValue);
    setLoading(false);
    setError(null);
  }, [enabled, loadOptions, setStableOptions, staticOptionsWithSelectedValue]);

  useEffect(() => {
    if (!enabled || !loadOptions) {
      return;
    }

    if (!api) {
      setStableOptions(
        preserveSelectedAdminFieldOptions(
          staticOptions,
          preservesSelectedValues
            ? getAdminFormValueByPath(latestValues.current, fieldName)
            : undefined,
        ),
      );
      setLoading(false);
      setError(null);
      return;
    }

    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    const controller = new AbortController();
    const currentSelectedValue = preservesSelectedValues
      ? getAdminFormValueByPath(latestValues.current, fieldName)
      : undefined;

    setOptions((currentOptions) => {
      const nextOptions = preserveSelectedAdminFieldOptions(
        currentOptions,
        currentSelectedValue,
      );

      return areAdminFieldOptionsEqual(currentOptions, nextOptions)
        ? currentOptions
        : nextOptions;
    });
    setLoading(true);
    setError(null);

    void loadOptions({
      api,
      mode,
      search: loaderSearch,
      signal: controller.signal,
      values: latestValues.current,
    })
      .then((loadedOptions) => {
        if (
          !controller.signal.aborted &&
          requestId.current === currentRequestId
        ) {
          setStableOptions(
            preserveSelectedAdminFieldOptions(
              loadedOptions,
              preservesSelectedValues
                ? getAdminFormValueByPath(latestValues.current, fieldName)
                : undefined,
            ),
          );
        }
      })
      .catch((loadError: unknown) => {
        if (
          !controller.signal.aborted &&
          requestId.current === currentRequestId
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Options could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (
          !controller.signal.aborted &&
          requestId.current === currentRequestId
        ) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    api,
    dependencyKey,
    enabled,
    fieldName,
    loadOptions,
    loaderSearch,
    mode,
    preservesSelectedValues,
    reloadToken,
    setStableOptions,
    staticOptions,
  ]);

  return useMemo(
    () => ({
      error,
      loading,
      options,
      reload,
      search,
      setSearch,
    }),
    [error, loading, options, reload, search],
  );
}

function hasAdminFieldOptions<TValues extends FieldValues>(
  field: AdminFormField<TValues>,
): boolean {
  return (
    field.type === "select" ||
    field.type === "multi-select" ||
    field.type === "relation-select"
  );
}

function getAdminFieldOptionDependencyKey<TValues extends FieldValues>(
  dependsOn: AdminFormField<TValues>["dependsOn"],
  values: TValues,
): string {
  if (!dependsOn?.length) {
    return "";
  }

  try {
    return JSON.stringify(
      dependsOn.map((dependencyName) => [
        dependencyName,
        getAdminFormValueByPath(values, dependencyName),
      ]),
    );
  } catch {
    return dependsOn
      .map(
        (dependencyName) =>
          `${String(dependencyName)}:${String(
            getAdminFormValueByPath(values, dependencyName),
          )}`,
      )
      .join("|");
  }
}

function getAdminFormValueByPath(values: FieldValues, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (currentValue, key) =>
        currentValue && typeof currentValue === "object" && key in currentValue
          ? (currentValue as Record<string, unknown>)[key]
          : undefined,
      values,
    );
}

function areAdminFieldOptionsEqual(
  left: AdminFieldOption[],
  right: AdminFieldOption[],
): boolean {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((leftOption, index) => {
    const rightOption = right[index];

    if (!rightOption) {
      return false;
    }

    return (
      leftOption.label === rightOption.label &&
      leftOption.value === rightOption.value &&
      leftOption.description === rightOption.description &&
      leftOption.disabled === rightOption.disabled &&
      leftOption.meta === rightOption.meta
    );
  });
}

function getAdminFieldLoaderSearch(args: {
  options: AdminFieldOption[];
  search: string;
  selectedValue: unknown;
}): string {
  const normalizedSearch = normalizeAdminOptionText(args.search);

  if (!normalizedSearch) {
    return args.search;
  }

  const selectedValues = getSelectedAdminFieldOptionValues(args.selectedValue);

  if (selectedValues.length === 0) {
    return args.search;
  }

  const selectedValueSet = new Set(
    selectedValues.map((value) => String(value)),
  );
  const searchMatchesSelectedLabel = args.options.some(
    (option) =>
      selectedValueSet.has(String(option.value)) &&
      normalizeAdminOptionText(option.label) === normalizedSearch,
  );

  return searchMatchesSelectedLabel ? "" : args.search;
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

function normalizeAdminOptionText(value: string): string {
  return value.trim().toLowerCase();
}
