"use client";

import { useEffect, useRef } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { useAdminAsyncFieldValidation } from "../hooks/useAdminAsyncFieldValidation";
import { useAdminFieldOptions } from "../hooks/useAdminFieldOptions";
import { useAdminFormDependencies } from "../hooks/useAdminFormDependencies";
import type {
  AdminFormAction,
  AdminFormField,
  AdminFormOptionLoaderApi,
} from "../types/admin-form.types";
import {
  canRenderAdminField,
  createAdminFormRuntimeContext,
  isAdminFieldDisabled,
  isAdminFieldRequired,
  shouldClearAdminFieldWhenHidden,
} from "../utils/adminFormVisibility";
import { AdminFieldRenderer } from "./AdminFieldRenderer";

interface AdminGeneratedFieldProps<TValues extends FieldValues> {
  api?: AdminFormOptionLoaderApi;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  mode: AdminFormAction;
  passwordAllowed: boolean;
  permissions: string[];
  record?: unknown;
  roles: string[];
}

export function AdminGeneratedField<TValues extends FieldValues>({
  api,
  field,
  form,
  mode,
  passwordAllowed,
  permissions,
  record,
  roles,
}: AdminGeneratedFieldProps<TValues>) {
  const values = useAdminFormDependencies(form, field);
  const ctx = createAdminFormRuntimeContext({
    fieldPath: field.name,
    mode,
    permissions,
    record,
    roles,
    values,
  });
  const visible = canRenderAdminField(field, ctx);
  const disabled = isAdminFieldDisabled(field, ctx);
  const required = isAdminFieldRequired(field, ctx);
  const wasVisible = useRef(visible);
  const optionState = useAdminFieldOptions({
    api,
    enabled: visible && !disabled,
    field,
    mode,
    values,
  });

  useAdminAsyncFieldValidation({
    api,
    disabled,
    field,
    form,
    mode,
    values,
    visible,
  });

  useEffect(() => {
    if (
      wasVisible.current &&
      !visible &&
      shouldClearAdminFieldWhenHidden(field)
    ) {
      form.setValue(field.name, undefined as never, {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.clearErrors(field.name);
    }

    wasVisible.current = visible;
  }, [field, form, visible]);

  if (!visible) {
    return null;
  }

  return (
    <AdminFieldRenderer
      api={api}
      disabled={disabled}
      field={field}
      form={form}
      mode={mode}
      optionState={optionState}
      passwordAllowed={passwordAllowed}
      readOnly={disabled || field.readOnly === true}
      required={required}
      values={values}
    />
  );
}
