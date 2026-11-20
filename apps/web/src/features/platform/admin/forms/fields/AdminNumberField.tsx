import { NumberInput } from "@mantine/core";
import { Controller } from "react-hook-form";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import type { AdminFormField } from "../types/admin-form.types";

interface AdminNumberFieldProps<TValues extends FieldValues> {
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  required: boolean;
}

export function AdminNumberField<TValues extends FieldValues>({
  disabled,
  field,
  form,
  required,
}: AdminNumberFieldProps<TValues>) {
  return (
    <Controller
      control={form.control}
      name={field.name}
      render={({ field: rhfField, fieldState }) => (
        <NumberInput
          description={field.description ?? field.helpText}
          disabled={disabled}
          error={fieldState.error?.message}
          label={field.label}
          placeholder={field.placeholder}
          required={required}
          value={rhfField.value ?? ""}
          onBlur={rhfField.onBlur}
          onChange={rhfField.onChange}
          {...field.inputProps}
        />
      )}
    />
  );
}
