import type { FieldValues, UseFormReturn } from "react-hook-form";

import type {
  AdminFieldOptionState,
  AdminFormField,
} from "../types/admin-form.types";
import { AdminSelectField } from "./AdminSelectField";

interface AdminRelationSelectFieldProps<TValues extends FieldValues> {
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  optionState: AdminFieldOptionState;
  required: boolean;
}

export function AdminRelationSelectField<TValues extends FieldValues>(
  props: AdminRelationSelectFieldProps<TValues>,
) {
  return <AdminSelectField {...props} />;
}
