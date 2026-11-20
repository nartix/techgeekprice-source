import { Switch } from "@mantine/core";
import { Controller } from "react-hook-form";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import type { AdminFormField } from "../types/admin-form.types";

interface AdminSwitchFieldProps<TValues extends FieldValues> {
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
}

export function AdminSwitchField<TValues extends FieldValues>({
  disabled,
  field,
  form,
}: AdminSwitchFieldProps<TValues>) {
  return (
    <Controller
      control={form.control}
      name={field.name}
      render={({ field: rhfField }) => (
        <Switch
          checked={Boolean(rhfField.value)}
          description={field.description ?? field.helpText}
          disabled={disabled}
          label={field.label}
          onBlur={rhfField.onBlur}
          onChange={(event) => rhfField.onChange(event.currentTarget.checked)}
          {...field.inputProps}
        />
      )}
    />
  );
}
