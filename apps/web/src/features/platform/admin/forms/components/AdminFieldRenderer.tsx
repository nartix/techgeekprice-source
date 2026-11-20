import type { FieldValues, UseFormReturn } from "react-hook-form";

import type {
  AdminFieldOptionState,
  AdminFormAction,
  AdminFormField,
  AdminFormOptionLoaderApi,
} from "../types/admin-form.types";
import { AdminCustomField } from "../fields/AdminCustomField";
import { AdminEmailField } from "../fields/AdminEmailField";
import { AdminMultiSelectField } from "../fields/AdminMultiSelectField";
import { AdminNumberField } from "../fields/AdminNumberField";
import { AdminPasswordField } from "../fields/AdminPasswordField";
import { AdminRelationSelectField } from "../fields/AdminRelationSelectField";
import { AdminSelectField } from "../fields/AdminSelectField";
import { AdminSlugField } from "../fields/AdminSlugField";
import { AdminSwitchField } from "../fields/AdminSwitchField";
import { AdminTextareaField } from "../fields/AdminTextareaField";
import { AdminTextField } from "../fields/AdminTextField";

interface AdminFieldRendererProps<TValues extends FieldValues> {
  api?: AdminFormOptionLoaderApi;
  disabled: boolean;
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  mode: AdminFormAction;
  optionState: AdminFieldOptionState;
  passwordAllowed: boolean;
  readOnly: boolean;
  required: boolean;
  values: TValues;
}

export function AdminFieldRenderer<TValues extends FieldValues>({
  api,
  disabled,
  field,
  form,
  mode,
  optionState,
  passwordAllowed,
  readOnly,
  required,
  values,
}: AdminFieldRendererProps<TValues>) {
  if (field.type === "password" && !passwordAllowed) {
    throw new Error(
      `Password field "${field.name}" is not allowed by this admin form config.`,
    );
  }

  if (field.type === "custom") {
    return (
      <AdminCustomField
        api={api}
        disabled={disabled}
        field={field}
        form={form}
        mode={mode}
        optionState={optionState}
        readOnly={readOnly}
        required={required}
        values={values}
      />
    );
  }

  switch (field.type) {
    case "email":
      return (
        <AdminEmailField
          disabled={disabled}
          field={field}
          form={form}
          mode={mode}
          required={required}
        />
      );
    case "number":
      return (
        <AdminNumberField
          disabled={disabled}
          field={field}
          form={form}
          required={required}
        />
      );
    case "password":
      return (
        <AdminPasswordField
          disabled={disabled}
          field={field}
          form={form}
          required={required}
        />
      );
    case "textarea":
      return (
        <AdminTextareaField
          disabled={disabled}
          field={field}
          form={form}
          required={required}
        />
      );
    case "select":
      return (
        <AdminSelectField
          disabled={disabled}
          field={field}
          form={form}
          optionState={optionState}
          required={required}
        />
      );
    case "multi-select":
      return (
        <AdminMultiSelectField
          disabled={disabled}
          field={field}
          form={form}
          optionState={optionState}
          required={required}
        />
      );
    case "relation-select":
      return (
        <AdminRelationSelectField
          disabled={disabled}
          field={field}
          form={form}
          optionState={optionState}
          required={required}
        />
      );
    case "slug":
      return (
        <AdminSlugField
          disabled={disabled}
          field={field}
          form={form}
          mode={mode}
          required={required}
        />
      );
    case "switch":
      return (
        <AdminSwitchField disabled={disabled} field={field} form={form} />
      );
    case "text":
    default:
      return (
        <AdminTextField
          disabled={disabled}
          field={field}
          form={form}
          mode={mode}
          required={required}
        />
      );
  }
}
