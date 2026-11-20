import { TextInput } from "@mantine/core";
import { Controller } from "react-hook-form";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import type {
  AdminFormAction,
  AdminFormField,
} from "../types/admin-form.types";

interface AdminTextFieldProps<TValues extends FieldValues> {
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  mode: AdminFormAction;
  required: boolean;
  type?: "text" | "email";
}

export function AdminTextField<TValues extends FieldValues>({
  disabled,
  field,
  form,
  mode,
  required,
  type = "text",
}: AdminTextFieldProps<TValues>) {
  return (
    <Controller
      control={form.control}
      name={field.name}
      render={({ field: rhfField, fieldState }) => (
        <TextInput
          autoFocus={field.autoFocus}
          description={field.description ?? field.helpText}
          disabled={disabled}
          error={fieldState.error?.message}
          label={field.label}
          placeholder={field.placeholder}
          required={required}
          type={type}
          value={rhfField.value ?? ""}
          onBlur={rhfField.onBlur}
          onChange={(event) => {
            const previousValue = rhfField.value;
            const nextValue = event.currentTarget.value;

            rhfField.onChange(nextValue);
            void field.onValueChange?.({
              getValues: form.getValues,
              mode,
              previousValue,
              setValue: form.setValue,
              value: nextValue,
              values: form.getValues(),
            });
          }}
          ref={rhfField.ref}
          {...field.inputProps}
        />
      )}
    />
  );
}
