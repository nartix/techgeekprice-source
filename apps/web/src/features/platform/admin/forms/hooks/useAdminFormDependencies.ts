import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";

import type { AdminFormField } from "../types/admin-form.types";

export function useAdminFormDependencies<TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  field: AdminFormField<TValues>,
): TValues {
  const dependencyNames = field.dependsOn ?? [];

  useWatch({
    control: form.control,
    disabled: dependencyNames.length === 0,
    name: dependencyNames,
  });

  return form.getValues();
}
