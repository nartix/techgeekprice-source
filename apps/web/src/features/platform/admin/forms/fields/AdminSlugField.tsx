import type { FieldValues, UseFormReturn } from "react-hook-form";

import type {
  AdminFormAction,
  AdminFormField,
} from "../types/admin-form.types";
import { AdminTextField } from "./AdminTextField";

interface AdminSlugFieldProps<TValues extends FieldValues> {
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  mode: AdminFormAction;
  required: boolean;
}

export function AdminSlugField<TValues extends FieldValues>(
  props: AdminSlugFieldProps<TValues>,
) {
  return <AdminTextField {...props} />;
}
