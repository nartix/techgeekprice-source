import type { FieldValues, UseFormReturn } from "react-hook-form";

import type {
  AdminFieldOptionState,
  AdminFormAction,
  AdminFormField,
  AdminFormOptionLoaderApi,
} from "../types/admin-form.types";

interface AdminCustomFieldProps<TValues extends FieldValues> {
  api?: AdminFormOptionLoaderApi;
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  mode: AdminFormAction;
  optionState?: AdminFieldOptionState;
  readOnly: boolean;
  required: boolean;
  values: TValues;
}

export function AdminCustomField<TValues extends FieldValues>({
  api,
  disabled,
  field,
  form,
  mode,
  optionState,
  readOnly,
  required,
  values,
}: AdminCustomFieldProps<TValues>) {
  const error = form.getFieldState(field.name, form.formState).error?.message;

  return field.render?.({
    api,
    disabled,
    error,
    field,
    form,
    mode,
    optionState,
    readOnly,
    required,
    values,
  });
}
