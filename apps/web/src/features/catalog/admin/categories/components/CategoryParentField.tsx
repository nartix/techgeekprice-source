"use client";

import { useDataProvider } from "@refinedev/core";
import type { DataProvider } from "@refinedev/core";
import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";

import { createAdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import type {
  AdminFormAction,
  AdminFormField,
  AdminFormOptionLoaderApi,
} from "../../../../platform/admin/forms";
import type { CategoryAdminFormValues } from "../types/category-admin.types";
import { CategoryParentPicker } from "./CategoryParentPicker";

interface CategoryParentFieldProps {
  api?: AdminFormOptionLoaderApi;
  apiBasePath?: string;
  disabled: boolean;
  error?: string;
  field: AdminFormField<CategoryAdminFormValues>;
  form: UseFormReturn<CategoryAdminFormValues>;
  mode: AdminFormAction;
  readOnly: boolean;
  required: boolean;
  values: CategoryAdminFormValues;
}

export function CategoryParentField({
  apiBasePath,
  api: providedApi,
  disabled,
  error,
  field,
  form,
  mode,
  readOnly,
  required,
  values,
}: CategoryParentFieldProps) {
  const getDataProvider = useDataProvider();
  const dataProvider = getDataProvider() as DataProvider | undefined;
  const dataProviderApi = useMemo(
    () => createAdminFormOptionLoaderApi(dataProvider),
    [dataProvider],
  );
  const api = providedApi ?? dataProviderApi;
  const value = String(form.watch("parentId") ?? "");
  const excludeSubtreeId = mode === "edit" ? (values.id ?? null) : null;

  return (
    <CategoryParentPicker
      api={api}
      apiBasePath={apiBasePath}
      description={field.description}
      disabled={disabled || readOnly}
      error={error}
      excludeSubtreeId={excludeSubtreeId}
      label={field.label}
      required={required}
      selectedParentId={value}
      value={value}
      onChange={(nextValue) => {
        form.setValue("parentId", nextValue, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }}
    />
  );
}
