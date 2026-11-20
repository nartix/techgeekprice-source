import { MultiSelect } from "@mantine/core";
import { Controller } from "react-hook-form";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import type {
  AdminFieldOptionState,
  AdminFormField,
} from "../types/admin-form.types";

interface AdminMultiSelectFieldProps<TValues extends FieldValues> {
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  optionState: AdminFieldOptionState;
  required: boolean;
}

export function AdminMultiSelectField<TValues extends FieldValues>({
  disabled,
  field,
  form,
  optionState,
  required,
}: AdminMultiSelectFieldProps<TValues>) {
  return (
    <Controller
      control={form.control}
      name={field.name}
      render={({ field: rhfField, fieldState }) => (
        <MultiSelect
          comboboxProps={{ withinPortal: false }}
          data={optionState.options.map((option) => ({
            disabled: option.disabled,
            label: option.label,
            value: String(option.value),
          }))}
          description={field.description ?? field.helpText}
          disabled={disabled}
          error={fieldState.error?.message ?? optionState.error}
          label={field.label}
          placeholder={field.placeholder}
          required={required}
          searchable
          value={Array.isArray(rhfField.value) ? rhfField.value.map(String) : []}
          onBlur={rhfField.onBlur}
          onChange={rhfField.onChange}
          onSearchChange={optionState.setSearch}
          {...field.inputProps}
        />
      )}
    />
  );
}
