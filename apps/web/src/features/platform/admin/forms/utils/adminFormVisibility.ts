import type { FieldValues } from "react-hook-form";

import type {
  AdminFormAction,
  AdminFormField,
  AdminFormRuntimeContext,
  AdminFormSection,
} from "../types/admin-form.types";

export function createAdminFormRuntimeContext<TValues extends FieldValues>(
  args: Omit<AdminFormRuntimeContext<TValues>, "values"> & {
    values: TValues;
  },
): AdminFormRuntimeContext<TValues> {
  return args;
}

export function canRenderAdminField<TValues extends FieldValues>(
  field: AdminFormField<TValues>,
  ctx: AdminFormRuntimeContext<TValues>,
): boolean {
  if (!isModeAllowed(field, ctx.mode)) {
    return false;
  }

  if (!hasAnyRequiredValue(field.permissions, ctx.permissions)) {
    return false;
  }

  if (!hasAnyRequiredValue(field.roles, ctx.roles)) {
    return false;
  }

  return field.visibleWhen ? field.visibleWhen(ctx) : true;
}

export function canRenderAdminSection<TValues extends FieldValues>(
  section: AdminFormSection<TValues>,
  ctx: AdminFormRuntimeContext<TValues>,
): boolean {
  return section.visibleWhen ? section.visibleWhen(ctx) : true;
}

export function isAdminFieldDisabled<TValues extends FieldValues>(
  field: AdminFormField<TValues>,
  ctx: AdminFormRuntimeContext<TValues>,
): boolean {
  if (ctx.mode === "show" || field.readOnly) {
    return true;
  }

  if (field.disabled) {
    return true;
  }

  return field.disabledWhen ? field.disabledWhen(ctx) : false;
}

export function isAdminFieldRequired<TValues extends FieldValues>(
  field: AdminFormField<TValues>,
  ctx: AdminFormRuntimeContext<TValues>,
): boolean {
  if (field.requiredWhen) {
    return field.requiredWhen(ctx);
  }

  return Boolean(field.required);
}

export function shouldClearAdminFieldWhenHidden<TValues extends FieldValues>(
  field: AdminFormField<TValues>,
): boolean {
  return Boolean(field.clearWhenHidden && !field.preserveWhenHidden);
}

function isModeAllowed<TValues extends FieldValues>(
  field: AdminFormField<TValues>,
  mode: AdminFormAction,
): boolean {
  if (field.createOnly && mode !== "create") {
    return false;
  }

  if (field.editOnly && mode !== "edit") {
    return false;
  }

  if (field.showOnly && mode !== "show") {
    return false;
  }

  return true;
}

function hasAnyRequiredValue(
  requiredValues: string[] | undefined,
  actualValues: string[],
): boolean {
  if (!requiredValues || requiredValues.length === 0) {
    return true;
  }

  return requiredValues.some((value) => actualValues.includes(value));
}
