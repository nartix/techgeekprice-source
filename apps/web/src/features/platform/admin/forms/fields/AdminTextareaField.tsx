import { Textarea } from "@mantine/core";
import { Controller } from "react-hook-form";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import type { AdminFormField } from "../types/admin-form.types";

interface AdminTextareaFieldProps<TValues extends FieldValues> {
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  required: boolean;
}

export function AdminTextareaField<TValues extends FieldValues>({
  disabled,
  field,
  form,
  required,
}: AdminTextareaFieldProps<TValues>) {
  return (
    <Controller
      control={form.control}
      name={field.name}
      render={({ field: rhfField, fieldState }) => (
        <Textarea
          description={field.description ?? field.helpText}
          disabled={disabled}
          error={fieldState.error?.message}
          label={field.label}
          minRows={3}
          placeholder={field.placeholder}
          required={required}
          value={rhfField.value ?? ""}
          onBlur={rhfField.onBlur}
          onChange={(event) => rhfField.onChange(event.currentTarget.value)}
          ref={rhfField.ref}
          {...field.inputProps}
        />
      )}
    />
  );
}
