import type { FieldValues, UseFormReturn } from "react-hook-form";

import type {
  AdminFormAction,
  AdminFormField,
} from "../types/admin-form.types";
import { AdminTextField } from "./AdminTextField";

interface AdminEmailFieldProps<TValues extends FieldValues> {
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  mode: AdminFormAction;
  required: boolean;
}

export function AdminEmailField<TValues extends FieldValues>(
  props: AdminEmailFieldProps<TValues>,
) {
  return <AdminTextField {...props} type="email" />;
}
