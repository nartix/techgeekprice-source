import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";

import type {
  AdminFormAction,
  AdminFormField,
  AdminFormOptionLoaderApi,
} from "../types/admin-form.types";
import { useDebouncedValue } from "./useDebouncedValue";

export function useAdminAsyncFieldValidation<TValues extends FieldValues>(args: {
  api?: AdminFormOptionLoaderApi;
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  mode: AdminFormAction;
  values: TValues;
  visible: boolean;
}): void {
  const { api, disabled, field, form, mode, values, visible } = args;
  const value = useWatch({ control: form.control, name: field.name });
  const debouncedValue = useDebouncedValue(
    value,
    field.asyncValidationDebounceMs,
  );

  useEffect(() => {
    if (!field.validateAsync || !api || !visible || disabled) {
      return;
    }

    if (
      debouncedValue === undefined ||
      debouncedValue === null ||
      String(debouncedValue).trim().length === 0
    ) {
      return;
    }

    const controller = new AbortController();

    void field
      .validateAsync({
        api,
        mode,
        signal: controller.signal,
        value: debouncedValue,
        values,
      })
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }

        if (result === true) {
          form.clearErrors(field.name);
          return;
        }

        form.setError(field.name, {
          type: "validate",
          message: result,
        });
      });

    return () => controller.abort();
  }, [api, debouncedValue, disabled, field, form, mode, values, visible]);
}
